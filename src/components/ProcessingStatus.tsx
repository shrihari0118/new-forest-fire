import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { ProcessingStep } from '../types';

interface ProcessingStatusProps {
  steps: ProcessingStep[];
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ steps }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="flex items-center space-x-2 mb-6">
        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Processing Status</h2>
      </div>

      <div className="space-y-4">
        {steps.map((step) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: step.id * 0.1 }}
            className="flex items-center space-x-3"
          >
            <div className="flex-shrink-0">
              {step.status === 'completed' && (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              {step.status === 'processing' && (
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              )}
              {step.status === 'pending' && (
                <Clock className="h-5 w-5 text-gray-400" />
              )}
              {step.status === 'error' && (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${
                step.status === 'completed' ? 'text-green-700' :
                step.status === 'processing' ? 'text-blue-700' :
                step.status === 'error' ? 'text-red-700' :
                'text-gray-500 dark:text-gray-400'
              }`}>
                {step.name}
              </p>
              
              {step.status === 'processing' && (
                <div className="mt-1">
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{step.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${step.progress}%` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${step.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700"
      >
        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
          Processing high-resolution geospatial data...
        </p>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
          This may take a few minutes depending on region size
        </p>
      </motion.div>
    </motion.div>
  );
};

export default ProcessingStatus;