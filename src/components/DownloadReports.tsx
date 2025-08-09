import React from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  FileText,
  Image,
  Video,
  Database,
  Calendar,
  MapPin,
  CheckCircle
} from 'lucide-react';
import { PredictionData, SimulationData, Region } from '../types';

interface DownloadReportsProps {
  predictionData: PredictionData | null;
  simulationData: SimulationData | null;
  selectedRegion: Region | null;
}

const DownloadReports: React.FC<DownloadReportsProps> = ({
  predictionData,
  simulationData,
  selectedRegion
}) => {
  const handleDownload = (type: string, format: string) => {
    // Simulate download functionality
    const filename = `${type}_${selectedRegion?.name || 'region'}_${Date.now()}.${format}`;
    
    // Create mock data based on type
    let data;
    switch (type) {
      case 'prediction':
        data = predictionData;
        break;
      case 'simulation':
        data = simulationData;
        break;
      case 'report':
        data = { prediction: predictionData, simulation: simulationData, region: selectedRegion };
        break;
      default:
        data = {};
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show success notification
    alert(`Successfully downloaded: ${filename}`);
  };

  const downloadOptions = [
    {
      category: 'Prediction Data',
      items: [
        {
          title: 'Fire Risk GeoTIFF',
          description: 'High-resolution raster data with fire risk classifications',
          format: 'tiff',
          icon: Image,
          color: 'orange',
          available: !!predictionData
        },
        {
          title: 'Risk Zones Shapefile',
          description: 'Vector data of identified fire risk zones',
          format: 'shp',
          icon: MapPin,
          color: 'blue',
          available: !!predictionData
        },
        {
          title: 'Prediction Metadata',
          description: 'Model parameters, confidence scores, and analysis details',
          format: 'json',
          icon: Database,
          color: 'green',
          available: !!predictionData
        }
      ]
    },
    {
      category: 'Simulation Data',
      items: [
        {
          title: 'Fire Spread Animation',
          description: 'MP4 video showing fire spread progression over time',
          format: 'mp4',
          icon: Video,
          color: 'red',
          available: !!simulationData
        },
        {
          title: 'Spread Data Rasters',
          description: 'Time-series GeoTIFF files for each simulation step',
          format: 'zip',
          icon: Image,
          color: 'purple',
          available: !!simulationData
        },
        {
          title: 'Simulation Parameters',
          description: 'Environmental conditions and model settings used',
          format: 'json',
          icon: Database,
          color: 'indigo',
          available: !!simulationData
        }
      ]
    },
    {
      category: 'Reports',
      items: [
        {
          title: 'Comprehensive Analysis Report',
          description: 'Complete PDF report with maps, charts, and analysis',
          format: 'pdf',
          icon: FileText,
          color: 'gray',
          available: !!(predictionData || simulationData)
        },
        {
          title: 'Executive Summary',
          description: 'High-level summary for stakeholders and decision makers',
          format: 'pdf',
          icon: FileText,
          color: 'blue',
          available: !!(predictionData || simulationData)
        },
        {
          title: 'Technical Documentation',
          description: 'Detailed methodology and technical specifications',
          format: 'pdf',
          icon: FileText,
          color: 'green',
          available: !!(predictionData || simulationData)
        }
      ]
    }
  ];

  const getColorClasses = (color: string, available: boolean) => {
    if (!available) {
      return {
        bg: 'bg-gray-50 dark:bg-gray-800',
        border: 'border-gray-200 dark:border-gray-700',
        icon: 'text-gray-400',
        button: 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
      };
    }

    const colorMap: { [key: string]: any } = {
      orange: {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-200 dark:border-orange-700',
        icon: 'text-orange-600 dark:text-orange-400',
        button: 'bg-orange-600 hover:bg-orange-700 text-white'
      },
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-700',
        icon: 'text-blue-600 dark:text-blue-400',
        button: 'bg-blue-600 hover:bg-blue-700 text-white'
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-700',
        icon: 'text-green-600 dark:text-green-400',
        button: 'bg-green-600 hover:bg-green-700 text-white'
      },
      red: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-700',
        icon: 'text-red-600 dark:text-red-400',
        button: 'bg-red-600 hover:bg-red-700 text-white'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-200 dark:border-purple-700',
        icon: 'text-purple-600 dark:text-purple-400',
        button: 'bg-purple-600 hover:bg-purple-700 text-white'
      },
      indigo: {
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        border: 'border-indigo-200 dark:border-indigo-700',
        icon: 'text-indigo-600 dark:text-indigo-400',
        button: 'bg-indigo-600 hover:bg-indigo-700 text-white'
      },
      gray: {
        bg: 'bg-gray-50 dark:bg-gray-700',
        border: 'border-gray-200 dark:border-gray-600',
        icon: 'text-gray-600 dark:text-gray-400',
        button: 'bg-gray-600 hover:bg-gray-700 text-white'
      }
    };

    return colorMap[color] || colorMap.gray;
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
          Download Reports
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Export analysis results, simulation data, and comprehensive reports
        </p>
      </div>

      {/* Region Info */}
      {selectedRegion && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-4">
            <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Current Analysis: {selectedRegion.name}, {selectedRegion.state}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Generated: {predictionData?.timestamp.toLocaleDateString() || 'Not available'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Area: {selectedRegion.area.toLocaleString()} km²
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Status: Analysis Complete
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Download Categories */}
      {downloadOptions.map((category, categoryIndex) => (
        <motion.div
          key={category.category}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 + categoryIndex * 0.1 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {category.category}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.items.map((item, itemIndex) => {
              const Icon = item.icon;
              const colors = getColorClasses(item.color, item.available);
              
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: itemIndex * 0.1 }}
                  className={`p-4 rounded-lg border ${colors.bg} ${colors.border} ${
                    item.available ? 'hover:shadow-md' : ''
                  } transition-all`}
                >
                  <div className="flex items-start space-x-3 mb-3">
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                      <Icon className={`h-5 w-5 ${colors.icon}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                        {item.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={item.available ? { scale: 1.02 } : {}}
                    whileTap={item.available ? { scale: 0.98 } : {}}
                    onClick={() => item.available && handleDownload(category.category.toLowerCase().split(' ')[0], item.format)}
                    disabled={!item.available}
                    className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${colors.button}`}
                  >
                    <Download className="h-4 w-4" />
                    <span>Download {item.format.toUpperCase()}</span>
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      ))}

      {/* Bulk Download */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Bulk Download Options
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleDownload('all', 'zip')}
            disabled={!(predictionData || simulationData)}
            className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              predictionData || simulationData
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            <Download className="h-5 w-5" />
            <span>Download All Data (ZIP)</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleDownload('report', 'pdf')}
            disabled={!(predictionData || simulationData)}
            className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              predictionData || simulationData
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            <FileText className="h-5 w-5" />
            <span>Generate Full Report (PDF)</span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DownloadReports;