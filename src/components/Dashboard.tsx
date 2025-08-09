import React from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Clock,
  Thermometer,
  Wind,
  Droplets,
  Play,
  Download
} from 'lucide-react';
import { Region, PredictionData, SimulationData, ProcessingStep } from '../types';
import ProcessingStatus from './ProcessingStatus';

interface DashboardProps {
  selectedRegion: Region | null;
  predictionData: PredictionData | null;
  simulationData: SimulationData | null;
  isProcessing: boolean;
  processingSteps: ProcessingStep[];
  onNavigate?: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  selectedRegion,
  predictionData,
  //simulationData,
  isProcessing,
  processingSteps,
  onNavigate
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard Overview
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Real-time forest fire prediction and simulation monitoring
        </p>
      </motion.div>

      {/* Key Metrics */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Regions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedRegion ? '1' : '0'}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Risk Level</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {predictionData ? 'HIGH' : 'N/A'}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Model Confidence</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {predictionData ? `${(predictionData.confidence * 100).toFixed(1)}%` : 'N/A'}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Update</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {predictionData ? predictionData.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Current Weather Conditions */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Current Weather Conditions
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg mb-2 mx-auto w-fit">
                <Thermometer className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Temperature</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">28°C</p>
            </div>
            <div className="text-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-2 mx-auto w-fit">
                <Droplets className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Humidity</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">45%</p>
            </div>
            <div className="text-center">
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg mb-2 mx-auto w-fit">
                <Wind className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Wind Speed</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">15 km/h</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            System Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">ML Model</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Active</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Data Pipeline</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Running</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Satellite Feed</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Processing Status */}
      {isProcessing && (
        <motion.div variants={itemVariants}>
          <ProcessingStatus steps={processingSteps} />
        </motion.div>
      )}

      {/* Region Information */}
      {selectedRegion && (
        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Selected Region: {selectedRegion.name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">State</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">{selectedRegion.state}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Area</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">{selectedRegion.area.toLocaleString()} km²</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Datasets Available</p>
              <div className="flex space-x-2 mt-1">
                {Object.entries(selectedRegion.datasets).map(([key, available]) => (
                  <span
                    key={key}
                    className={`px-2 py-1 text-xs rounded-full ${
                      available
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}
                  >
                    {key.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate?.('select-region')}
            className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Run New Analysis</p>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate?.('simulation')}
            className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
          >
            <Play className="h-6 w-6 text-orange-600 dark:text-orange-400 mb-2" />
            <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Start Simulation</p>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate?.('download')}
            className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <Download className="h-6 w-6 text-green-600 dark:text-green-400 mb-2" />
            <p className="text-sm font-medium text-green-700 dark:text-green-300">Export Reports</p>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;