import React from 'react';
import { Zap, BarChart2, AlertCircle } from 'lucide-react';
import { MaterialDetail } from '../types/material';

interface BandStructureChartProps {
  material: MaterialDetail;
}

export const BandStructureChart: React.FC<BandStructureChartProps> = ({ material }) => {
  const bg = material.properties?.band_gap?.value;

  if (bg === null || bg === undefined) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-slate-200/80 text-center">
        <div className="flex flex-col items-center justify-center py-6 text-slate-400">
          <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
          <h4 className="text-sm font-semibold text-slate-700">Electronic Band Structure Not Available</h4>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Electronic band structure calculation is not available for this database entry. Arbitrary band dispersion curves are strictly never fabricated.
          </p>
        </div>
      </div>
    );
  }

  // Band gap classification
  const isMetal = bg === 0;
  const isSemiconductor = bg > 0 && bg <= 3.0;
  const isInsulator = bg > 3.0;

  // Visual scaling
  const chartHeight = 220;
  const vbmY = isMetal ? chartHeight / 2 : chartHeight * 0.65;
  const cbmY = isMetal ? chartHeight / 2 : Math.max(30, vbmY - Math.min(130, bg * 25));

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-200/80">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="text-base font-bold text-slate-800">Electronic Energy Band Diagram</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Grounded in DFT-calculated electronic band gap ({bg.toFixed(3)} eV)
          </p>
        </div>
        <span
          className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
            isMetal
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : isSemiconductor
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
          }`}
        >
          {isMetal ? 'Metallic (Conductor)' : isSemiconductor ? 'Semiconductor' : 'Wide-Bandgap Insulator'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* SVG Band Diagram */}
        <div className="md:col-span-2 relative bg-white rounded-xl p-4 border border-slate-200/60 shadow-inner">
          <svg viewBox="0 0 400 220" className="w-full h-48 select-none">
            {/* Grid background lines */}
            <line x1="50" y1="20" x2="380" y2="20" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="50" y1="70" x2="380" y2="70" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="50" y1="120" x2="380" y2="120" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="50" y1="170" x2="380" y2="170" stroke="#f1f5f9" strokeWidth="1" />

            {/* Energy Axis */}
            <line x1="50" y1="10" x2="50" y2="210" stroke="#94a3b8" strokeWidth="1.5" />
            <text x="15" y="115" fill="#64748b" fontSize="11" fontWeight="600" transform="rotate(-90 25,115)">
              Energy (eV)
            </text>

            {/* Conduction Band Region */}
            <rect
              x="60"
              y="10"
              width="320"
              height={Math.max(10, cbmY - 10)}
              fill="url(#conduction-grad)"
              rx="4"
            />
            <text x="70" y={Math.max(25, cbmY - 10)} fill="#0284c7" fontSize="11" fontWeight="700">
              Conduction Band (Unoccupied states)
            </text>

            {/* Valence Band Region */}
            <rect
              x="60"
              y={vbmY}
              width="320"
              height={210 - vbmY}
              fill="url(#valence-grad)"
              rx="4"
            />
            <text x="70" y={Math.min(200, vbmY + 20)} fill="#4338ca" fontSize="11" fontWeight="700">
              Valence Band (Occupied states)
            </text>

            {/* Fermi Level (EF) */}
            <line
              x1="55"
              y1={isMetal ? vbmY : (vbmY + cbmY) / 2}
              x2="380"
              y2={isMetal ? vbmY : (vbmY + cbmY) / 2}
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            <text
              x="330"
              y={isMetal ? vbmY - 6 : (vbmY + cbmY) / 2 - 6}
              fill="#ef4444"
              fontSize="10"
              fontWeight="bold"
            >
              EF (Fermi Level)
            </text>

            {/* Band gap arrow dimension if semiconductor or insulator */}
            {!isMetal && (
              <g>
                <line x1="220" y1={cbmY} x2="220" y2={vbmY} stroke="#0ea5e9" strokeWidth="2" markerEnd="url(#arrow)" />
                <rect x="230" y={(vbmY + cbmY) / 2 - 12} width="85" height="24" rx="4" fill="#f0f9ff" stroke="#bae6fd" />
                <text x="240" y={(vbmY + cbmY) / 2 + 4} fill="#0369a1" fontSize="11" fontWeight="bold" fontFamily="monospace">
                  Eg = {bg.toFixed(2)} eV
                </text>
              </g>
            )}

            {isMetal && (
              <text x="180" y="115" fill="#d97706" fontSize="12" fontWeight="bold">
                Continuous DOS at EF (Overlap)
              </text>
            )}

            <defs>
              <linearGradient id="conduction-grad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="valence-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e0e7ff" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#c7d2fe" stopOpacity="0.3" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Interpretation Details */}
        <div className="space-y-3">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
            <span className="text-xs font-semibold text-slate-500 block mb-1">Electronic State</span>
            <span className="text-sm font-bold text-slate-800">
              {isMetal
                ? 'Metallic Conductance (Zero Bandgap)'
                : isSemiconductor
                ? 'Semiconducting Band Transport'
                : 'Dielectric Electrical Insulation'}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              {isMetal
                ? 'Valence and conduction bands overlap at the Fermi level, allowing free carrier electron transport.'
                : isSemiconductor
                ? 'Thermal or optical energy can excite electrons across the gap into conduction states, suitable for optoelectronics.'
                : 'Large electronic gap restricts thermal carrier generation, providing high dielectric resistance.'}
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
            <span className="text-xs font-semibold text-slate-500 block mb-1">Optical Absorption Edge</span>
            <span className="text-sm font-mono font-bold text-slate-800">
              {bg > 0 ? `λ ≈ ${(1239.8 / bg).toFixed(1)} nm` : 'Broadband (Metallic)'}
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              {bg > 3.1
                ? 'Ultraviolet optical absorption (Transparent in visible range)'
                : bg > 1.8
                ? 'Visible spectrum absorption window'
                : bg > 0
                ? 'Near-infrared optical absorption'
                : 'Total optical reflection / absorption'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
