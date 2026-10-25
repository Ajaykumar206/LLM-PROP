import React, { useState } from 'react';
import {
  Box,
  Search,
  ArrowRight,
  Clock,
  Bookmark,
  BarChart2,
  Sliders,
  Settings,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  query: string;
  onQueryChange: (val: string) => void;
  onSearch: (term: string) => void;
  onPredict: () => void;
  isSearching: boolean;
  onOpenRecentSearches: () => void;
  onOpenSavedMaterials: () => void;
  onOpenCompareMaterials: () => void;
  onOpen3DVisualizer: () => void;
  onOpenApplicationFinder: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  query,
  onQueryChange,
  onSearch,
  onPredict,
  isSearching,
  onOpenRecentSearches,
  onOpenSavedMaterials,
  onOpenCompareMaterials,
  onOpen3DVisualizer,
  onOpenApplicationFinder
}) => {
  const [activeInputTab, setActiveInputTab] = useState<'formula' | 'description'>('formula');
  const [descriptionText, setDescriptionText] = useState('High-k dielectric oxide with cubic crystal symmetry');

  const examples = ['SiO4', 'LiFePO4', 'TiO2', 'BaTiO3', 'Graphene', 'GaN'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeInputTab === 'formula') {
      onSearch(query);
    } else {
      // Natural language text description - map key terms to search formula
      if (descriptionText.toLowerCase().includes('dielectric') || descriptionText.toLowerCase().includes('oxide')) {
        onSearch('BaTiO3');
      } else {
        onSearch('SiO2');
      }
    }
  };

  const navMenuItems = [
    { label: 'Recent Searches', icon: <Clock className="w-4 h-4 text-slate-400" />, onClick: onOpenRecentSearches },
    { label: 'Saved Materials', icon: <Bookmark className="w-4 h-4 text-slate-400" />, onClick: onOpenSavedMaterials },
    { label: 'Compare Materials', icon: <BarChart2 className="w-4 h-4 text-slate-400" />, onClick: onOpenCompareMaterials },
    { label: '3D Visualization', icon: <Box className="w-4 h-4 text-slate-400" />, onClick: onOpen3DVisualizer },
    { label: 'Application Finder', icon: <Settings className="w-4 h-4 text-slate-400" />, onClick: onOpenApplicationFinder }
  ];

  return (
    <aside className="w-full lg:w-72 flex-shrink-0 space-y-4">
      {/* Material Input Card */}
      <div className="glass-panel-dark spotlight-card rounded-2xl p-5 space-y-4">
        {/* Title */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.3)]">
            <Box className="w-4 h-4 text-cyan-400" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-wide">
            Material Input
          </h3>
        </div>

        {/* Input Switcher Tabs */}
        <div className="flex border-b border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveInputTab('formula')}
            className={`pb-2 px-1 relative transition-colors ${
              activeInputTab === 'formula'
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Chemical Formula
            {activeInputTab === 'formula' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
            )}
          </button>
          <button
            onClick={() => setActiveInputTab('description')}
            className={`pb-2 px-3 relative transition-colors ${
              activeInputTab === 'description'
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Text Description
            {activeInputTab === 'description' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
            )}
          </button>
        </div>

        {/* Form Input */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {activeInputTab === 'formula' ? (
            <div className="relative flex items-center">
              <input
                type="text"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="e.g. SiO4, TiO2, GaAs..."
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl py-2.5 pl-3.5 pr-10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 shadow-inner"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="absolute right-1.5 p-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white transition disabled:opacity-50 shadow-sm"
                title="Search Formula"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <textarea
                value={descriptionText}
                onChange={(e) => setDescriptionText(e.target.value)}
                placeholder="Describe material properties, crystal class, application..."
                rows={2}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl py-2 px-3 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 shadow-inner resize-none"
              />
            </div>
          )}

          {/* Examples Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-400 font-medium">Examples:</span>
            <div className="grid grid-cols-3 gap-1.5">
              {examples.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => {
                    onQueryChange(ex);
                    onSearch(ex);
                  }}
                  className={`py-1 px-2 rounded-lg text-xs font-semibold border transition text-center ${
                    query.toLowerCase() === ex.toLowerCase()
                      ? 'bg-blue-600/30 text-cyan-300 border-cyan-500/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'bg-slate-900/70 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
                  }`}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Predict Properties Button */}
          <button
            type="button"
            onClick={onPredict}
            disabled={isSearching}
            className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:via-indigo-500 hover:to-cyan-400 active:scale-[0.98] transition-all duration-200 shadow-[0_0_25px_rgba(37,99,235,0.45)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)] group disabled:opacity-50"
          >
            <span>Predict Properties</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>

      {/* Navigation Tools Menu */}
      <div className="glass-panel-dark spotlight-card rounded-2xl p-2 space-y-1">
        {navMenuItems.map((item, idx) => (
          <button
            key={idx}
            onClick={item.onClick}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition group"
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span>{item.label}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
          </button>
        ))}
      </div>

      {/* Bottom Promo Card: "Discover Materials for a Better Tomorrow" */}
      <div className="relative rounded-2xl overflow-hidden p-5 border border-blue-500/30 bg-gradient-to-b from-blue-950/60 to-slate-950/90 shadow-[0_10px_30px_-10px_rgba(6,182,212,0.25)]">
        {/* Glow backdrop aura */}
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-cyan-500/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-400/40">
            <Sparkles className="w-4 h-4 text-cyan-300" />
          </div>
          <h4 className="text-sm font-bold text-white leading-snug">
            Discover Materials for a Better Tomorrow
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            AI generative property screening accelerating solid-state physics discovery.
          </p>
        </div>

        {/* 3D Molecular Graphics Decorative Render */}
        <div className="mt-3 relative h-20 flex items-center justify-center opacity-85">
          <svg viewBox="0 0 160 80" className="w-full h-full">
            {/* Bonds */}
            <line x1="30" y1="50" x2="65" y2="30" stroke="#38bdf8" strokeWidth="2" strokeOpacity="0.6" />
            <line x1="65" y1="30" x2="110" y2="45" stroke="#38bdf8" strokeWidth="2" strokeOpacity="0.6" />
            <line x1="110" y1="45" x2="140" y2="25" stroke="#38bdf8" strokeWidth="2" strokeOpacity="0.6" />
            <line x1="65" y1="30" x2="80" y2="65" stroke="#38bdf8" strokeWidth="2" strokeOpacity="0.6" />

            {/* Glowing atoms */}
            <circle cx="30" cy="50" r="8" fill="#3b82f6" filter="drop-shadow(0 0 6px #3b82f6)" />
            <circle cx="65" cy="30" r="12" fill="#06b6d4" filter="drop-shadow(0 0 10px #06b6d4)" />
            <circle cx="110" cy="45" r="9" fill="#ef4444" filter="drop-shadow(0 0 8px #ef4444)" />
            <circle cx="140" cy="25" r="7" fill="#8b5cf6" filter="drop-shadow(0 0 6px #8b5cf6)" />
            <circle cx="80" cy="65" r="10" fill="#10b981" filter="drop-shadow(0 0 8px #10b981)" />
          </svg>
        </div>
      </div>
    </aside>
  );
};
