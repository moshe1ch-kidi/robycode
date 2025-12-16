import React from 'react';
import { Wifi, HandMetal, Compass, Palette } from 'lucide-react';

interface SensorDashboardProps {
  distance: number;
  isTouching: boolean;
  gyroAngle: number;
  detectedColor: string;
}

const SensorDashboard: React.FC<SensorDashboardProps> = ({ 
  distance, 
  isTouching, 
  gyroAngle, 
  detectedColor 
}) => {
  
  // Helper to get color code for display
  const getDisplayColor = (colorName: string) => {
    switch(colorName.toLowerCase()) {
      case 'red': return '#ef4444';
      case 'black': return '#1f2937';
      case 'white': return '#ffffff';
      default: return '#e5e7eb'; // gray-200
    }
  };

  return (
    <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-slate-200 flex items-center justify-around z-10 transition-all">
      
      {/* Ultrasonic / Distance */}
      <div className="flex flex-col items-center gap-1 min-w-[80px]">
        <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Wifi size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Distance</span>
        </div>
        <div className="text-2xl font-mono font-bold text-slate-800">
            {distance < 255 ? distance : '> 255'} <span className="text-sm text-slate-400">cm</span>
        </div>
      </div>

      <div className="w-px h-10 bg-slate-300"></div>

      {/* Gyro */}
      <div className="flex flex-col items-center gap-1 min-w-[80px]">
        <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Compass size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Gyro</span>
        </div>
        <div className="text-2xl font-mono font-bold text-slate-800">
            {gyroAngle}°
        </div>
      </div>

      <div className="w-px h-10 bg-slate-300"></div>

      {/* Touch Sensor */}
      <div className="flex flex-col items-center gap-1 min-w-[80px]">
        <div className="flex items-center gap-2 text-slate-500 mb-1">
            <HandMetal size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Touch</span>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-bold border ${
            isTouching 
                ? 'bg-red-100 text-red-600 border-red-200' 
                : 'bg-slate-100 text-slate-400 border-slate-200'
        }`}>
            {isTouching ? 'PRESSED' : 'RELEASED'}
        </div>
      </div>

      <div className="w-px h-10 bg-slate-300"></div>

      {/* Color Sensor */}
      <div className="flex flex-col items-center gap-1 min-w-[80px]">
        <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Palette size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Color</span>
        </div>
        <div className="flex items-center gap-2">
            <div 
                className="w-6 h-6 rounded-full border border-slate-300 shadow-sm"
                style={{ backgroundColor: getDisplayColor(detectedColor) }}
            />
            <span className="font-mono font-bold text-slate-700 capitalize">
                {detectedColor}
            </span>
        </div>
      </div>

    </div>
  );
};

export default SensorDashboard;