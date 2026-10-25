import React from 'react';
import { Atom } from 'lucide-react';

interface NavbarProps {
  activeTab?: string;
  onTabChange: (tab: string) => void;
  savedCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onTabChange
}) => {
  return (
    <header className="w-full flex items-center justify-between py-3 px-6 glass-panel-dark border-b border-slate-800/80 sticky top-0 z-40">
      {/* Left: Glowing Atomic Logo & Title */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('Home')}>
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.6)]">
          <div className="w-full h-full bg-[#050b14] rounded-[10px] flex items-center justify-center">
            <Atom className="w-6 h-6 text-cyan-400 animate-spin" style={{ animationDuration: '20s' }} />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-black tracking-tight text-white">
              Materials
            </span>
            <span className="text-lg font-black tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              AI Explorer
            </span>
          </div>
          <div className="text-[10px] tracking-wider text-slate-400 font-medium">
            Predict • Visualize • Discover • Innovate
          </div>
        </div>
      </div>
    </header>
  );
};

