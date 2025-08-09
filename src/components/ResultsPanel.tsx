import React from 'react';
import { BarChart, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { PredictionData, SimulationData } from '../types';

interface ResultsPanelProps {
  predictionData: PredictionData | null;
  simulationData: SimulationData | null;
  activeLayer: string;
  simulationTimeStep: number;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({
  predictionData,
  simulationData,
  //activeLayer,
  simulationTimeStep
}) => {
  const formatArea = (area: number) => {
    return area.toLocaleString(undefined, { maximumFractionDigits: 1 });
  };

  const formatPercentage = (value: number, total: number) => {
    return ((value / total) * 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Prediction Results */}
      {predictionData && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-800">Fire Risk Analysis</h3>
          </div>

          <div className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Model Confidence</span>
                <span className="text-lg font-bold text-orange-600">
                  {(predictionData.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-600 h-2 rounded-full"
                  style={{ width: `${predictionData.confidence * 100}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-md">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">High Risk</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-700">
                    {formatArea(predictionData.highRiskArea)} km²
                  </p>
                  <p className="text-xs text-gray-600">
                    {formatPercentage(predictionData.highRiskArea, predictionData.totalArea)}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-md">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Moderate Risk</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-orange-700">
                    {formatArea(predictionData.moderateRiskArea)} km²
                  </p>
                  <p className="text-xs text-gray-600">
                    {formatPercentage(predictionData.moderateRiskArea, predictionData.totalArea)}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-md">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Low Risk</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-700">
                    {formatArea(predictionData.lowRiskArea)} km²
                  </p>
                  <p className="text-xs text-gray-600">
                    {formatPercentage(predictionData.lowRiskArea, predictionData.totalArea)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">Analysis Details</p>
                  <p className="text-xs mt-1">
                    Based on DEM, weather patterns, LULC data, and historical fire incidents.
                    Updated: {predictionData.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Results */}
      {simulationData && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-800">Fire Spread Simulation</h3>
          </div>

          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Burned Area at {simulationTimeStep}h
                </span>
                <span className="text-lg font-bold text-red-600">
                  {formatArea(simulationData.totalBurnedArea[simulationData.timeSteps.indexOf(simulationTimeStep)])} km²
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Spread Rate</span>
                <span className="text-sm font-medium text-red-700">
                  {simulationData.spreadRate[simulationData.timeSteps.indexOf(simulationTimeStep)]} km²/h
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Progression Timeline</h4>
              {simulationData.timeSteps.map((timeStep, index) => (
                <div 
                  key={timeStep}
                  className={`flex items-center justify-between p-2 rounded-md transition-colors ${
                    timeStep === simulationTimeStep ? 'bg-red-100 border border-red-300' : 'bg-gray-50'
                  }`}
                >
                  <span className="text-sm font-medium text-gray-700">{timeStep}h</span>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-800">
                      {formatArea(simulationData.totalBurnedArea[index])} km²
                    </p>
                    <p className="text-xs text-gray-600">
                      +{simulationData.spreadRate[index]} km²/h
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-yellow-50 rounded-md border border-yellow-200">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-700">
                  <p className="font-medium">Simulation Notice</p>
                  <p className="text-xs mt-1">
                    Cellular Automata model based on wind patterns, fuel moisture, and terrain slope.
                    Actual fire behavior may vary based on real-time conditions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsPanel;