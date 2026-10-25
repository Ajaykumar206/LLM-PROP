import React, { useState } from 'react';
import {
  X,
  Clock,
  Bookmark,
  BarChart2,
  Box,
  Settings,
  ArrowRight,
  Trash2,
  Check,
  ExternalLink
} from 'lucide-react';
import { MaterialDetail } from '../types/material';

interface NavigationModalsProps {
  activeModal: string | null;
  onClose: () => void;
  recentSearches: string[];
  savedMaterials: string[];
  onSelectFormula: (formula: string) => void;
  onRemoveSaved: (formula: string) => void;
  currentMaterial: MaterialDetail | null;
}

export const NavigationModals: React.FC<NavigationModalsProps> = ({
  activeModal,
  onClose,
  recentSearches,
  savedMaterials,
  onSelectFormula,
  onRemoveSaved,
  currentMaterial
}) => {
  // Compare state
  const [compMat1, setCompMat1] = useState(currentMaterial?.formula || 'SiO4');
  const [compMat2, setCompMat2] = useState('TiO2');

  // Application finder filter
  const [targetProperty, setTargetProperty] = useState('Band Gap > 3.0 eV (Insulator)');

  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="glass-panel-dark max-w-lg w-full rounded-2xl p-6 border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.3)] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. Recent Searches */}
        {activeModal === 'Recent Searches' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center">
                <Clock className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Recent Searches</h3>
                <p className="text-xs text-slate-400">Quickly revisit past material queries</p>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {recentSearches.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-6">No recent searches yet.</div>
              ) : (
                recentSearches.map((formula, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      onSelectFormula(formula);
                      onClose();
                    }}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 hover:border-cyan-500/40 cursor-pointer transition group"
                  >
                    <span className="text-sm font-semibold text-slate-200 group-hover:text-cyan-300">
                      {formula}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 2. Saved Materials */}
        {activeModal === 'Saved Materials' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
                <Bookmark className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Saved Materials</h3>
                <p className="text-xs text-slate-400">Bookmarked crystal systems and compositions</p>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {savedMaterials.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-6">No saved materials yet. Star a material to save it!</div>
              ) : (
                savedMaterials.map((formula, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 transition"
                  >
                    <span
                      onClick={() => {
                        onSelectFormula(formula);
                        onClose();
                      }}
                      className="text-sm font-semibold text-slate-200 hover:text-cyan-300 cursor-pointer flex-1"
                    >
                      {formula}
                    </span>
                    <button
                      onClick={() => onRemoveSaved(formula)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition rounded-lg hover:bg-slate-800"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 3. Compare Materials */}
        {activeModal === 'Compare Materials' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center">
                <BarChart2 className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Compare Materials</h3>
                <p className="text-xs text-slate-400">Side-by-side solid-state property analysis</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 font-medium">Material A</label>
                <input
                  type="text"
                  value={compMat1}
                  onChange={(e) => setCompMat1(e.target.value)}
                  className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-medium">Material B</label>
                <input
                  type="text"
                  value={compMat2}
                  onChange={(e) => setCompMat2(e.target.value)}
                  className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between pb-1 border-b border-slate-800">
                <span className="text-slate-400 font-medium">Property</span>
                <span className="text-cyan-400 font-bold">{compMat1}</span>
                <span className="text-purple-400 font-bold">{compMat2}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Band Gap (eV)</span>
                <span className="text-white">0.00 / 8.90</span>
                <span className="text-white">3.20</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Formation Energy</span>
                <span className="text-white">-8.12 eV/atom</span>
                <span className="text-white">-9.82 eV/atom</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Crystal System</span>
                <span className="text-white">Trigonal / Cubic</span>
                <span className="text-white">Tetragonal (Rutile)</span>
              </div>
            </div>

            <button
              onClick={() => {
                onSelectFormula(compMat2);
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-[0_0_20px_rgba(37,99,235,0.4)]"
            >
              Switch Active View to {compMat2}
            </button>
          </div>
        )}

        {/* 4. 3D Visualization */}
        {activeModal === '3D Visualization' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
                <Box className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">3D Visualization Laboratory</h3>
                <p className="text-xs text-slate-400">Advanced crystallographic rendering parameters</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">CPK Atomic Color Palette</span>
                <span className="text-cyan-400 font-semibold">Enabled</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Unit-cell Parallelepiped Vectors</span>
                <span className="text-cyan-400 font-semibold">12 Edges</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Covalent Bonding Cutoff Radii</span>
                <span className="text-cyan-400 font-semibold">Standard Cordero</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">WebGL Hardware Acceleration</span>
                <span className="text-emerald-400 font-semibold">60 FPS</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-[0_0_20px_rgba(37,99,235,0.4)]"
            >
              Return to 3D Viewer
            </button>
          </div>
        )}

        {/* 5. Application Finder */}
        {activeModal === 'Application Finder' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                <Settings className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Application Finder</h3>
                <p className="text-xs text-slate-400">Match materials to technological applications</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-slate-400 font-medium">Select Target Requirement:</label>
              <select
                value={targetProperty}
                onChange={(e) => setTargetProperty(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-cyan-400"
              >
                <option>Band Gap &gt; 3.0 eV (Insulator / Dielectric)</option>
                <option>Band Gap 1.0 - 1.8 eV (Photovoltaics / Solar)</option>
                <option>Zero Band Gap (Metallic / High Conductivity)</option>
                <option>High Thermal Stability (Refractory Ceramics)</option>
                <option>High Lithium Intercalation (Battery Cathodes)</option>
              </select>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
              <div className="text-cyan-400 font-bold">Recommended Matches:</div>
              <div className="flex flex-wrap gap-2 pt-1">
                {['SiO4', 'TiO2', 'BaTiO3', 'Al2O3', 'LiFePO4'].map((mat) => (
                  <button
                    key={mat}
                    onClick={() => {
                      onSelectFormula(mat);
                      onClose();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-600/40 border border-slate-700 hover:border-cyan-500 text-slate-200 text-xs font-semibold transition"
                  >
                    {mat}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-[0_0_20px_rgba(37,99,235,0.4)]"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
