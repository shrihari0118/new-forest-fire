import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Map, Layers, Eye, EyeOff, Crosshair, Info, Wind, Thermometer, Droplets } from 'lucide-react';
import { Region, PredictionData, SimulationData } from '../types';

interface MapVisualizationProps {
  selectedRegion: Region | null;
  predictionData: PredictionData | null;
  simulationData: SimulationData | null;
  activeLayer: string;
  simulationTimeStep: number;
  onLayerChange: (layer: string) => void;
  environmentalParams: {
    windSpeed: number;
    humidity: number;
    temperature: number;
  };
}

declare global {
  interface Window {
    L: any;
  }
}

const MapVisualization: React.FC<MapVisualizationProps> = ({
  selectedRegion,
  predictionData,
  simulationData,
  activeLayer,
  simulationTimeStep,
  onLayerChange,
  environmentalParams
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const layersRef = useRef<{ [key: string]: any }>({});
  const [isDrawingMode, setIsDrawingMode] = React.useState(false);
  const [selectedPoint, setSelectedPoint] = React.useState<any>(null);

  useEffect(() => {
    if (!mapRef.current || !window.L) return;

    // Initialize map
    if (!leafletMap.current) {
      leafletMap.current = window.L.map(mapRef.current, {
        zoomControl: false
      }).setView([28.6139, 77.2090], 6);
      
      // Add satellite base layer
      window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community'
      }).addTo(leafletMap.current);

      // Add custom zoom control
      window.L.control.zoom({
        position: 'topright'
      }).addTo(leafletMap.current);

      // Add click handler for point selection
      leafletMap.current.on('click', (e: any) => {
        if (isDrawingMode) {
          setSelectedPoint({
            lat: e.latlng.lat,
            lng: e.latlng.lng,
            weather: {
              temperature: environmentalParams.temperature + (Math.random() - 0.5) * 5,
              humidity: environmentalParams.humidity + (Math.random() - 0.5) * 10,
              windSpeed: environmentalParams.windSpeed + (Math.random() - 0.5) * 8
            }
          });
        }
      });
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!leafletMap.current || !selectedRegion) return;

    // Clear existing layers
    Object.values(layersRef.current).forEach((layer: any) => {
      leafletMap.current.removeLayer(layer);
    });
    layersRef.current = {};

    // Fit map to region bounds
    const bounds = window.L.latLngBounds(selectedRegion.bounds.bounds);
    leafletMap.current.fitBounds(bounds);

    // Add region boundary
    const regionLayer = window.L.rectangle(selectedRegion.bounds.bounds, {
      color: '#3b82f6',
      weight: 2,
      fillOpacity: 0.1
    }).addTo(leafletMap.current);
    layersRef.current['region'] = regionLayer;
  }, [selectedRegion]);

  useEffect(() => {
    if (!leafletMap.current || !predictionData) return;

    // Remove existing prediction layers
    if (layersRef.current['prediction']) {
      leafletMap.current.removeLayer(layersRef.current['prediction']);
    }

    if (activeLayer === 'prediction') {
      const predictionLayer = window.L.layerGroup();
      
      predictionData.riskZones.forEach(zone => {
        const color = zone.risk === 'high' ? '#ef4444' : 
                     zone.risk === 'moderate' ? '#f97316' : '#22c55e';
        
        const marker = window.L.circleMarker([zone.lat, zone.lng], {
          radius: 8,
          fillColor: color,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        });
        
        marker.bindPopup(`
          <strong>Risk Level: ${zone.risk.toUpperCase()}</strong><br>
          Confidence: ${(zone.confidence * 100).toFixed(1)}%<br>
          Location: ${zone.lat.toFixed(4)}, ${zone.lng.toFixed(4)}
        `);
        
        predictionLayer.addLayer(marker);
      });
      
      predictionLayer.addTo(leafletMap.current);
      layersRef.current['prediction'] = predictionLayer;
    }
  }, [predictionData, activeLayer]);

  useEffect(() => {
    if (!leafletMap.current || !simulationData) return;

    // Remove existing simulation layers
    if (layersRef.current['simulation']) {
      leafletMap.current.removeLayer(layersRef.current['simulation']);
    }

    if (activeLayer === 'simulation') {
      const simulationLayer = window.L.layerGroup();
      const spreadData = simulationData.spreadData[simulationTimeStep];
      
      if (spreadData) {
        spreadData.forEach(point => {
          const intensity = point.intensity;
         // const color = `rgba(239, 68, 68, ${intensity})`;
          
          const marker = window.L.circleMarker([point.lat, point.lng], {
            radius: 6,
            fillColor: '#ef4444',
            color: '#dc2626',
            weight: 1,
            opacity: 1,
            fillOpacity: intensity
          });
          
          marker.bindPopup(`
            <strong>Fire Spread Point</strong><br>
            Intensity: ${(intensity * 100).toFixed(1)}%<br>
            Time: ${simulationTimeStep} hours<br>
            Location: ${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}
          `);
          
          simulationLayer.addLayer(marker);
        });
      }
      
      simulationLayer.addTo(leafletMap.current);
      layersRef.current['simulation'] = simulationLayer;
    }
  }, [simulationData, activeLayer, simulationTimeStep]);

  const handleLayerToggle = (layer: string) => {
    onLayerChange(activeLayer === layer ? 'base' : layer);
  };

  const closePopup = () => {
    setSelectedPoint(null);
  };

  if (!selectedRegion) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-96 flex items-center justify-center"
      >
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Map className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <p className="text-xl font-medium text-gray-900 dark:text-white mb-2">Select a region to view map</p>
          <p className="text-sm">Choose a region from the sidebar to start interactive mapping</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Interactive Map Visualization
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Real-time fire risk mapping with interactive analysis tools
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Map Header */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/20 dark:to-orange-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Layers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {selectedRegion.name}, {selectedRegion.state}
              </h3>
            </div>
            
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsDrawingMode(!isDrawingMode)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  isDrawingMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <Crosshair className="h-4 w-4 mr-1 inline" />
                {isDrawingMode ? 'Exit Analysis' : 'Point Analysis'}
              </motion.button>
            </div>
          </div>
          
          {/* Layer Controls */}
          <div className="flex items-center space-x-2 mt-3">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Layers:</span>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleLayerToggle('prediction')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeLayer === 'prediction'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {activeLayer === 'prediction' ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              <span>Fire Risk</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleLayerToggle('simulation')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeLayer === 'simulation'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {activeLayer === 'simulation' ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              <span>Fire Spread</span>
            </motion.button>
          </div>
        </div>
      
        {/* Map Container */}
        <div className="relative">
          <div ref={mapRef} className="h-[600px] w-full" />
          
          {/* Map Info Overlay */}
          <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-xs">
            <div className="text-sm">
              <p className="font-medium text-gray-900 dark:text-white mb-1">
                Current View: {activeLayer === 'prediction' ? 'Fire Risk Prediction' : 
                              activeLayer === 'simulation' ? `Fire Spread - ${simulationTimeStep}h` : 
                              'Satellite Base Map'}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {isDrawingMode ? 'Click anywhere to analyze point data' : 'Use layer controls to toggle overlays'}
              </p>
            </div>
          </div>

          {/* Point Analysis Popup */}
          {selectedPoint && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-w-sm z-50"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Point Analysis</h4>
                </div>
                <button
                  onClick={closePopup}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Coordinates</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedPoint.lat.toFixed(4)}, {selectedPoint.lng.toFixed(4)}
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded">
                    <Thermometer className="h-4 w-4 text-red-600 dark:text-red-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">Temp</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedPoint.weather.temperature.toFixed(1)}°C
                    </p>
                  </div>
                  
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <Droplets className="h-4 w-4 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">Humidity</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedPoint.weather.humidity.toFixed(1)}%
                    </p>
                  </div>
                  
                  <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <Wind className="h-4 w-4 text-gray-600 dark:text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">Wind</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedPoint.weather.windSpeed.toFixed(1)} km/h
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MapVisualization;