import React, { useEffect, useRef, useState } from 'react';
import { Chart, DoughnutController, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { PredictionData, Region } from '../types';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend, Title, ChartDataLabels);

interface RiskAnalysisProps {
  predictionData: PredictionData | null;
  selectedRegion: Region | null;
}

// API base
const API_BASE = (import.meta as any)?.env?.VITE_API_BASE_URL || '/api';

const RiskAnalysis: React.FC<RiskAnalysisProps> = ({ predictionData, selectedRegion }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [localData, setLocalData] = useState<PredictionData | null>(null);
  const [percentages, setPercentages] = useState({ high: 0, moderate: 0, low: 0 });

  // Always fetch dynamic prediction when region changes (so we don't stick to any static prop values)
  useEffect(() => {
    const controller = new AbortController();

    const fetchPrediction = async () => {
      if (!selectedRegion) {
        setLocalData(null);
        return;
      }
      try {
        const region = selectedRegion.id || selectedRegion.name;
        const res = await fetch(`${API_BASE}/prediction?region=${encodeURIComponent(region)}`, {
          signal: controller.signal
        });
        const data = await res.json();
        if (!res.ok || data.ok === false) throw new Error(data?.detail || data?.message || 'Prediction failed');

        const mapped: PredictionData = {
          highRiskArea: data.high_risk_area_km2 ?? 0,
          moderateRiskArea: data.moderate_risk_area_km2 ?? 0,
          lowRiskArea: data.low_risk_area_km2 ?? 0,
          confidence: typeof data.confidence === 'number' ? data.confidence : 0.8,
          timestamp: new Date(data.timestamp || Date.now()),
          overallRiskLevel: data.overall_risk_level || undefined
        } as any;

        setLocalData(mapped);
      } catch (e) {
        if ((e as any).name !== 'AbortError') {
          console.error('Prediction fetch failed:', e);
          setLocalData(null);
        }
      }
    };

    fetchPrediction();
    return () => controller.abort();
  }, [selectedRegion?.id, selectedRegion?.name]);

  // Prefer fetched (dynamic) data if available; fall back to prop if needed
  const pd = localData || predictionData;

  useEffect(() => {
    if (!chartRef.current || !pd) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const totalArea =
      pd.highRiskArea +
      pd.moderateRiskArea +
      pd.lowRiskArea || 0.000001;

    const high = ((pd.highRiskArea / totalArea) * 100).toFixed(1);
    const moderate = ((pd.moderateRiskArea / totalArea) * 100).toFixed(1);
    const low = ((pd.lowRiskArea / totalArea) * 100).toFixed(1);

    setPercentages({ high: parseFloat(high), moderate: parseFloat(moderate), low: parseFloat(low) });

    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['High Risk', 'Moderate Risk', 'Low Risk'],
        datasets: [
          {
            data: [pd.highRiskArea, pd.moderateRiskArea, pd.lowRiskArea],
            backgroundColor: ['#ef4444', '#f97316', '#22c55e'],
            borderColor: '#fff',
            borderWidth: 2,
            hoverOffset: 20,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1200,
          easing: 'easeOutBounce',
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20,
              color: '#374151',
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || '';
                const value = context.raw as number;
                const percent = ((value / totalArea) * 100).toFixed(2);
                return `${label}: ${value.toFixed(2)} sq km (${percent}%)`;
              },
            },
          },
          datalabels: {
            color: '#fff',
            formatter: (value: number) => `${((value / totalArea) * 100).toFixed(1)}%`,
            font: { weight: 'bold' as const, size: 14 },
          },
          title: {
            display: true,
            text: '🔥 Fire Risk Area Breakdown',
            font: { size: 20 },
            color: '#1f2937',
            padding: { top: 10, bottom: 20 },
          },
        },
      },
      plugins: [ChartDataLabels],
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [pd]);

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200">🔥 Fire Risk Distribution</h2>

      <div
        className="rounded-lg shadow-lg p-4 bg-white transition-transform duration-300 hover:scale-105"
        style={{ width: '100%', maxWidth: '480px', height: '400px' }}
      >
        <canvas ref={chartRef} />
      </div>

      {pd && (
        <div className="w-full max-w-xl px-6 py-6 bg-white rounded-xl shadow-lg space-y-4">
          <h3 className="text-xl font-medium text-gray-700 mb-2">📊 Risk Summary</h3>
          <ul className="text-sm text-gray-600 space-y-3">
            <li>
              <span className="font-medium text-red-600">High Risk:</span>{' '}
              <strong>{pd.highRiskArea.toFixed(2)} sq km</strong>
              <div className="w-full h-2 bg-red-200 rounded mt-1">
                <div className="h-2 bg-red-500 rounded" style={{ width: `${percentages.high}%` }}></div>
              </div>
              <p className="text-xs text-right">{percentages.high}%</p>
            </li>

            <li>
              <span className="font-medium text-orange-500">Moderate Risk:</span>{' '}
              <strong>{pd.moderateRiskArea.toFixed(2)} sq km</strong>
              <div className="w-full h-2 bg-orange-200 rounded mt-1">
                <div className="h-2 bg-orange-500 rounded" style={{ width: `${percentages.moderate}%` }}></div>
              </div>
              <p className="text-xs text-right">{percentages.moderate}%</p>
            </li>

            <li>
              <span className="font-medium text-green-600">Low Risk:</span>{' '}
              <strong>{pd.lowRiskArea.toFixed(2)} sq km</strong>
              <div className="w-full h-2 bg-green-200 rounded mt-1">
                <div className="h-2 bg-green-500 rounded" style={{ width: `${percentages.low}%` }}></div>
              </div>
              <p className="text-xs text-right">{percentages.low}%</p>
            </li>

            <li className="pt-2 border-t mt-3">
              <strong>Total Area:</strong>{' '}
              {(pd.highRiskArea + pd.moderateRiskArea + pd.lowRiskArea).toFixed(2)} sq km
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default RiskAnalysis;