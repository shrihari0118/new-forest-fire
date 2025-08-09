import React from 'react';
import { Settings, Eye, Download, Play } from 'lucide-react';
import { PredictionData, SimulationData } from '../types';

interface ControlPanelProps {
  activeLayer: string;
  onLayerChange: (layer: string) => void;
  simulationTimeStep: number;
  onTimeStepChange: (timeStep: number) => void;
  predictionData: PredictionData | null;
  simulationData: SimulationData | null;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  activeLayer,
  onLayerChange,
  simulationTimeStep,
  onTimeStepChange,
  predictionData,
  simulationData
}) => {
  const handleDownload = (type: string) => {
    // Simulate download functionality
    const blob = new Blob([JSON.stringify({ type, data: type === 'prediction' ? predictionData : simulationData })], 
      { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Settings className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-800">Control Panel</h2>
      </div>

      <div className="space-y-6">
        {/* Layer Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Eye className="inline h-4 w-4 mr-1" />
            Map Layer
          </label>
          <div className="space-y-2">
            <button
              onClick={() => onLayerChange('base')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                activeLayer === 'base' 
                  ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Base Map
            </button>
            {predictionData && (
              <button
                onClick={() => onLayerChange('prediction')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  activeLayer === 'prediction' 
                    ? 'bg-orange-100 text-orange-800 border border-orange-300' 
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Fire Risk Prediction
              </button>
            )}
            {simulationData && (
              <button
                onClick={() => onLayerChange('simulation')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  activeLayer === 'simulation' 
                    ? 'bg-red-100 text-red-800 border border-red-300' 
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Fire Spread Simulation
              </button>
            )}
          </div>
        </div>

        {/* Simulation Time Control */}
        {simulationData && activeLayer === 'simulation' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Play className="inline h-4 w-4 mr-1" />
              Simulation Time Step
            </label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 w-8">1h</span>
                <input
                  type="range"
                  min="0"
                  max="4"
                  value={[1, 2, 3, 6, 12].indexOf(simulationTimeStep)}
                  onChange={(e) => onTimeStepChange([1, 2, 3, 6, 12][parseInt(e.target.value)])}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-8">12h</span>
              </div>
              <div className="text-center">
                <span className="text-lg font-semibold text-blue-600">
                  {simulationTimeStep} hours
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {[1, 2, 3, 6, 12].map(step => (
                  <button
                    key={step}
                    onClick={() => onTimeStepChange(step)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      simulationTimeStep === step
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {step}h
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Download Options */}
        {(predictionData || simulationData) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Download className="inline h-4 w-4 mr-1" />
              Export Data
            </label>
            <div className="space-y-2">
              {predictionData && (
                <button
                  onClick={() => handleDownload('prediction')}
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm"
                >
                  Download Prediction (GeoTIFF)
                </button>
              )}
              {simulationData && (
                <button
                  onClick={() => handleDownload('simulation')}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                >
                  Download Simulation (Animation)
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;