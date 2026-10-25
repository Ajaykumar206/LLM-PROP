import React, { useState } from 'react';
import {
  Atom,
  ChevronDown,
  Settings,
  Key,
  Bookmark
} from 'lucide-react';

interface NavbarProps {
  activeTab?: string;
  onTabChange: (tab: string) => void;
  savedCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onTabChange,
  savedCount = 1
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
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

        {/* Right: User Profile Avatar */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800/80 text-xs font-medium text-slate-200 transition group hover:border-cyan-500/50"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
              AJ
            </div>
            <span className="hidden sm:inline text-slate-200 font-semibold">Ajay Kumar</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition" />
          </button>

          {/* User Profile Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 glass-panel-dark rounded-2xl p-4 border border-slate-800 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow">
                  AJ
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Ajay Kumar</div>
                  <div className="text-[11px] text-cyan-400">Scientist / Researcher</div>
                </div>
              </div>

              <div className="space-y-1 py-3 text-xs">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onTabChange('Saved Materials');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
                >
                  <span className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-amber-400" /> Saved Materials
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-amber-300">
                    {savedCount}
                  </span>
                </button>

                <div className="px-3 py-2 flex items-center justify-between text-slate-400 text-[11px]">
                  <span className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-emerald-400" /> Materials Project API
                  </span>
                  <span className="text-emerald-400 font-bold">Connected</span>
                </div>

                <div className="px-3 py-2 flex items-center justify-between text-slate-400 text-[11px]">
                  <span className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-purple-400" /> AI Engine
                  </span>
                  <span className="text-purple-400 font-bold">T5 + Gemini</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
};
