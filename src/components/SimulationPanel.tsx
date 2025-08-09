import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Settings,
  Wind,
  Thermometer,
  Droplets,
  Zap,
  TrendingUp
} from 'lucide-react';
import { SimulationData } from '../types';

interface SimulationPanelProps {
  simulationData: SimulationData | null;
  simulationTimeStep: number;
  onTimeStepChange: (timeStep: number) => void;
  isPlaying: boolean;
  onPlayToggle: (playing: boolean) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  environmentalParams: {
    windSpeed: number;
    humidity: number;
    temperature: number;
  };
  onEnvironmentalParamsChange: (params: any) => void;
}

const SimulationPanel: React.FC<SimulationPanelProps> = ({
  simulationData,
  simulationTimeStep,
  onTimeStepChange,
  isPlaying,
  onPlayToggle,
  speed,
  onSpeedChange,
  environmentalParams,
  onEnvironmentalParamsChange
}) => {
  useEffect(() => {
    if (!isPlaying || !simulationData) return;

    const interval = setInterval(() => {
      const currentIndex = simulationData.timeSteps.indexOf(simulationTimeStep);
      const nextIndex = (currentIndex + 1) % simulationData.timeSteps.length;
      onTimeStepChange(simulationData.timeSteps[nextIndex]);
    }, 2000 / speed);

    return () => clearInterval(interval);
  }, [isPlaying, simulationTimeStep, speed, simulationData, onTimeStepChange]);

  const handleDownloadVideo = () => {
    // Simulate video download
    const filename = `fire_simulation_${simulationData?.region || 'region'}_${Date.now()}.mp4`;
    
    // Create a mock video blob
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Fire Simulation Video', 400, 300);
      ctx.fillText(`Region: ${simulationData?.region || 'N/A'}`, 400, 340);
    }
    
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert(`Successfully downloaded: ${filename}`);
      }
    }, 'image/png');
  };

  const handleParameterChange = (param: string, value: number) => {
    onEnvironmentalParamsChange({
      ...environmentalParams,
      [param]: value
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Fire Spread Simulation
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Cellular Automata-based fire spread modeling with environmental parameters
        </p>
      </div>

      {!simulationData ? (
        <div className="bg-white dark:bg-gray-800 p-12 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <Play className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Simulation Data Available
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Please select a region and run the prediction model to generate simulation data.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Simulation Controls */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center space-x-2 mb-4">
                <Play className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Simulation Controls
                </h3>
              </div>

              <div className="space-y-4">
                {/* Play/Pause Controls */}
                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onPlayToggle(!isPlaying)}
                    className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                      isPlaying
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    <span>{isPlaying ? 'Pause' : 'Play'}</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onTimeStepChange(simulationData.timeSteps[0])}
                    className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </motion.button>
                </div>

                {/* Speed Control */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Animation Speed: {speed}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.5"
                    value={speed}
                    onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Time Step Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time Step: {simulationTimeStep} hours
                  </label>
                  <div className="grid grid-cols-5 gap-1">
                    {simulationData.timeSteps.map(step => (
                      <motion.button
                        key={step}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onTimeStepChange(step)}
                        className={`px-2 py-2 text-sm rounded transition-colors ${
                          simulationTimeStep === step
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {step}h
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Download Video */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownloadVideo}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Simulation Video</span>
                </motion.button>
              </div>
            </motion.div>

            {/* Environmental Parameters */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center space-x-2 mb-4">
                <Settings className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Environmental Parameters
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Wind className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Wind Speed: {environmentalParams.windSpeed} km/h
                    </label>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={environmentalParams.windSpeed}
                    onChange={(e) => handleParameterChange('windSpeed', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Droplets className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Humidity: {environmentalParams.humidity}%
                    </label>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={environmentalParams.humidity}
                    onChange={(e) => handleParameterChange('humidity', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Thermometer className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Temperature: {environmentalParams.temperature}°C
                    </label>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="45"
                    value={environmentalParams.temperature}
                    onChange={(e) => handleParameterChange('temperature', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Simulation Results */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Simulation Results - {simulationTimeStep} Hours
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-medium text-red-700 dark:text-red-300">
                      Burned Area
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {simulationData.totalBurnedArea[simulationData.timeSteps.indexOf(simulationTimeStep)]} km²
                  </p>
                </div>

                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                      Spread Rate
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {simulationData.spreadRate[simulationData.timeSteps.indexOf(simulationTimeStep)]} km²/h
                  </p>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Progression Timeline
                </h4>
                <div className="space-y-2">
                  {simulationData.timeSteps.map((timeStep, index) => (
                    <motion.div
                      key={timeStep}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                        timeStep === simulationTimeStep
                          ? 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700'
                          : 'bg-gray-50 dark:bg-gray-700'
                      }`}
                    >
                      <span className="font-medium text-gray-900 dark:text-white">
                        {timeStep} hours
                      </span>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {simulationData.totalBurnedArea[index]} km²
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          +{simulationData.spreadRate[index]} km²/h
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default SimulationPanel;