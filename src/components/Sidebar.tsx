import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  MapPin,
  AlertTriangle,
  Play,
  Map,
  Download,
  Settings,
  ChevronRight
} from 'lucide-react';


interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'select-region', label: 'Select Region', icon: MapPin },
  { id: 'risk-analysis', label: 'Risk Analysis', icon: AlertTriangle },
  { id: 'simulation', label: 'Simulation', icon: Play },
  { id: 'map', label: 'Map Visualization', icon: Map },
  { id: 'download', label: 'Download Reports', icon: Download },
  { id: 'settings', label: 'Settings', icon: Settings }
];


const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm z-40">
      <div className="p-4">
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <motion.button
                key={item.id}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span className="font-medium">{item.label}</span>
                </div>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </nav>

        
      </div>
    </aside>
  );
};

export default Sidebar;