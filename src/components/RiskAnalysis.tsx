import React, { useEffect, useRef, useState } from 'react';
import { Chart, DoughnutController, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { PredictionData, Region } from '../types';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend, Title, ChartDataLabels);

interface RiskAnalysisProps {
  predictionData: PredictionData | null;
  selectedRegion: Region | null;
}

const RiskAnalysis: React.FC<RiskAnalysisProps> = ({ predictionData }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [percentages, setPercentages] = useState({ high: 0, moderate: 0, low: 0 });

  useEffect(() => {
    if (!chartRef.current || !predictionData) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const totalArea =
      predictionData.highRiskArea +
      predictionData.moderateRiskArea +
      predictionData.lowRiskArea;

    const high = ((predictionData.highRiskArea / totalArea) * 100).toFixed(1);
    const moderate = ((predictionData.moderateRiskArea / totalArea) * 100).toFixed(1);
    const low = ((predictionData.lowRiskArea / totalArea) * 100).toFixed(1);

    setPercentages({ high: parseFloat(high), moderate: parseFloat(moderate), low: parseFloat(low) });

    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['High Risk', 'Moderate Risk', 'Low Risk'],
        datasets: [
          {
            data: [
              predictionData.highRiskArea,
              predictionData.moderateRiskArea,
              predictionData.lowRiskArea,
            ],
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
                return `${label}: ${value} sq km (${percent}%)`;
              },
            },
          },
          datalabels: {
            color: '#fff',
            formatter: (value: number) => `${((value / totalArea) * 100).toFixed(1)}%`,
            font: {
              weight: 'bold' as const,
              size: 14,
            },
          },
          title: {
            display: true,
            text: '🔥 Fire Risk Area Breakdown',
            font: {
              size: 20,
            },
            color: '#1f2937',
            padding: {
              top: 10,
              bottom: 20,
            },
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
  }, [predictionData]);

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200">🔥 Fire Risk Distribution</h2>

      <div
        className="rounded-lg shadow-lg p-4 bg-white transition-transform duration-300 hover:scale-105"
        style={{ width: '100%', maxWidth: '480px', height: '400px' }}
      >
        <canvas ref={chartRef} />
      </div>

      {predictionData && (
        <div className="w-full max-w-xl px-6 py-6 bg-white rounded-xl shadow-lg space-y-4">
          <h3 className="text-xl font-medium text-gray-700 mb-2">📊 Risk Summary</h3>
          <ul className="text-sm text-gray-600 space-y-3">
            <li>
              <span className="font-medium text-red-600">High Risk:</span>{' '}
              <strong>{predictionData.highRiskArea} sq km</strong>
              <div className="w-full h-2 bg-red-200 rounded mt-1">
                <div
                  className="h-2 bg-red-500 rounded"
                  style={{ width: `${percentages.high}%` }}
                ></div>
              </div>
              <p className="text-xs text-right">{percentages.high}%</p>
            </li>

            <li>
              <span className="font-medium text-orange-500">Moderate Risk:</span>{' '}
              <strong>{predictionData.moderateRiskArea} sq km</strong>
              <div className="w-full h-2 bg-orange-200 rounded mt-1">
                <div
                  className="h-2 bg-orange-500 rounded"
                  style={{ width: `${percentages.moderate}%` }}
                ></div>
              </div>
              <p className="text-xs text-right">{percentages.moderate}%</p>
            </li>

            <li>
              <span className="font-medium text-green-600">Low Risk:</span>{' '}
              <strong>{predictionData.lowRiskArea} sq km</strong>
              <div className="w-full h-2 bg-green-200 rounded mt-1">
                <div
                  className="h-2 bg-green-500 rounded"
                  style={{ width: `${percentages.low}%` }}
                ></div>
              </div>
              <p className="text-xs text-right">{percentages.low}%</p>
            </li>

            <li className="pt-2 border-t mt-3">
              <strong>Total Area:</strong>{' '}
              {predictionData.highRiskArea +
                predictionData.moderateRiskArea +
                predictionData.lowRiskArea}{' '}
              sq km
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default RiskAnalysis;
