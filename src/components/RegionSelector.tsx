import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Database } from 'lucide-react';
import { Region } from '../types';

interface RegionSelectorProps {
  onRegionSelect: (region: Region) => void;
}

const mockRegions: Region[] = [
  {
    id: 'uttarakhand-dehradun',
    name: 'Dehradun District',
    state: 'Uttarakhand',
    area: 3088,
    bounds: {
      center: [30.3165, 78.0322],
      bounds: [[29.8, 77.5], [30.8, 78.5]]
    },
    datasets: { dem: true, weather: true, lulc: true, fireHistory: true }
  },
  {
    id: 'uttarakhand-nainital',
    name: 'Nainital District',
    state: 'Uttarakhand',
    area: 4251,
    bounds: {
      center: [29.3803, 79.4636],
      bounds: [[29.0, 79.0], [29.8, 80.0]]
    },
    datasets: { dem: true, weather: true, lulc: true, fireHistory: true }
  },
  {
    id: 'himachal-shimla',
    name: 'Shimla District',
    state: 'Himachal Pradesh',
    area: 5131,
    bounds: {
      center: [31.1048, 77.1734],
      bounds: [[30.5, 76.5], [31.7, 78.0]]
    },
    datasets: { dem: true, weather: true, lulc: true, fireHistory: true }
  },
  {
    id: 'karnataka-kodagu',
    name: 'Kodagu District',
    state: 'Karnataka',
    area: 4102,
    bounds: {
      center: [12.3375, 75.8069],
      bounds: [[12.0, 75.4], [12.7, 76.2]]
    },
    datasets: { dem: true, weather: true, lulc: true, fireHistory: true }
  }
];

const RegionSelector: React.FC<RegionSelectorProps> = ({ onRegionSelect }) => {
  const [selectedRegion, setSelectedRegion] = useState<string>('');

  const handleRegionChange = (regionId: string) => {
    const region = mockRegions.find(r => r.id === regionId);
    if (region) {
      setSelectedRegion(regionId);
      onRegionSelect(region);
    }
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
          Select Analysis Region
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Choose a region to begin fire risk prediction and simulation analysis
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 mb-6">
          <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Region Selection</h3>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Analysis Region
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Choose a region...</option>
              {mockRegions.map(region => (
                <option key={region.id} value={region.id}>
                  {region.name}, {region.state}
                </option>
              ))}
            </select>
          </div>

          {selectedRegion && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700"
            >
              <div className="flex items-start space-x-2">
                <Database className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-1" />
                <div className="text-sm">
                  <p className="font-medium text-gray-800 dark:text-gray-200 mb-3">Available Datasets:</p>
                  <div className="grid grid-cols-2 gap-3 text-gray-600 dark:text-gray-300">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span>DEM Data (30m)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span>Weather Data</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span>LULC Data</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span>Fire History</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const region = mockRegions.find(r => r.id === selectedRegion);
                    if (region) onRegionSelect(region);
                  }}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  Start Analysis for {mockRegions.find(r => r.id === selectedRegion)?.name}
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Region Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockRegions.map((region) => (
          <motion.div
            key={region.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => handleRegionChange(region.id)}
            className={`p-6 rounded-xl border cursor-pointer transition-all ${
              selectedRegion === region.id
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {region.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {region.state}
                </p>
              </div>
              <MapPin className={`h-5 w-5 ${
                selectedRegion === region.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
              }`} />
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Area:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {region.area.toLocaleString()} km²
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Datasets:</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  Complete
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default RegionSelector;