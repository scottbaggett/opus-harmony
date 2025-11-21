import React from 'react';

const HarmonyExplorer: React.FC = () => {
  return (
    <div className="w-full h-[400px] bg-[#17161b] rounded-3xl border border-white/10 flex items-center justify-center relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-transparent opacity-50"></div>
      
      {/* Abstract representation of Circle of Fifths */}
      <div className="relative w-64 h-64 rounded-full border border-white/10 animate-[spin_60s_linear_infinite]">
        {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30) * (Math.PI / 180);
            const x = 128 + 110 * Math.cos(angle);
            const y = 128 + 110 * Math.sin(angle);
            return (
                <div 
                    key={i}
                    className="absolute w-4 h-4 bg-amber-500/50 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)] transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-150 hover:bg-amber-400 cursor-pointer"
                    style={{ left: x, top: y }}
                />
            );
        })}
        <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-serif italic text-2xl text-white/50">Harmony</span>
        </div>
      </div>

      <div className="absolute bottom-8 text-center w-full px-8">
          <p className="text-gray-400 italic">"Harmony is the vertical aspect of music..."</p>
      </div>
    </div>
  );
};

export default HarmonyExplorer;