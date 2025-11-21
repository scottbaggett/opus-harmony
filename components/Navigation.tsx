import React from 'react';
import { ViewMode } from '../types';

interface NavigationProps {
  currentMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentMode, onChange }) => {
  const tabs = [
    { id: ViewMode.SIGHT_READING, label: 'Sight Reading' },
    { id: ViewMode.HARMONY, label: 'Harmony' },
    { id: ViewMode.RHYTHM, label: 'Rhythm & Motion' },
    { id: ViewMode.INTERVALS, label: 'Intervals' },
  ];

  return (
    <nav className="w-full max-w-6xl mx-auto my-8 px-4">
      <div className="bg-[#232128] rounded-full p-1 flex justify-between items-center shadow-lg border border-white/5">
        {tabs.map((tab) => {
          const isActive = currentMode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                flex-1 py-3 px-6 rounded-full text-lg tracking-wide transition-all duration-500 ease-out
                ${isActive 
                  ? 'bg-[#3e3047] text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] border border-white/10' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;