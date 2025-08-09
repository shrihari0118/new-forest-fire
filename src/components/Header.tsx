import React from 'react';
import { Satellite, Flame } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Satellite className="h-8 w-8 text-orange-400" />
              <div>

                <p className="text-sm text-blue-200">Advanced Geospatial Analytics for Fire Management</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-blue-800 px-3 py-1 rounded-full">
              <Flame className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-medium">Real-time Monitoring</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;