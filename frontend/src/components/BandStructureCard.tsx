import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import { MaterialDetail } from '../types/material';
import { parseChemicalFormula, ParsedFormula } from '../services/formulaParser';

interface BandStructureCardProps {
  material: MaterialDetail | null;
  formula?: string;
}

export const BandStructureCard: React.FC<BandStructureCardProps> = ({ material, formula }) => {
  const [hoverData, setHoverData] = useState<{ x: number; y: number; energy: number; kPoint: string } | null>(null);

  const queryFormula = formula || material?.formula || 'H2O';
  const parsed: ParsedFormula = parseChemicalFormula(queryFormula);

  const bg = material?.properties?.band_gap?.value ?? parsed.properties.bandGap;
  const isMetal = bg === 0;

  // Paths coordinates (viewBox 0 0 320 180)
  // Fermi level at y = 90 (0 eV)
  // Conduction band above y = 90
  // Valence band below y = 90
  const conductionShift = isMetal ? 0 : Math.min(38, bg * 5);

  const cbPath = `M 20 ${70 - conductionShift} Q 60 ${40 - conductionShift} 95 ${60 - conductionShift} T 170 ${45 - conductionShift} T 245 ${55 - conductionShift} T 300 ${50 - conductionShift}`;
  const cbPath2 = `M 20 ${55 - conductionShift} Q 60 ${25 - conductionShift} 95 ${40 - conductionShift} T 170 ${30 - conductionShift} T 245 ${40 - conductionShift} T 300 ${35 - conductionShift}`;

  const vbPath = `M 20 ${105 + (isMetal ? 0 : 8)} Q 60 ${125 + (isMetal ? 0 : 8)} 95 ${110 + (isMetal ? 0 : 8)} T 170 ${130 + (isMetal ? 0 : 8)} T 245 ${112 + (isMetal ? 0 : 8)} T 300 ${120 + (isMetal ? 0 : 8)}`;
  const vbPath2 = `M 20 ${125 + (isMetal ? 0 : 8)} Q 60 ${145 + (isMetal ? 0 : 8)} 95 ${130 + (isMetal ? 0 : 8)} T 170 ${150 + (isMetal ? 0 : 8)} T 245 ${132 + (isMetal ? 0 : 8)} T 300 ${140 + (isMetal ? 0 : 8)}`;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const energy = ((90 - (y / rect.height) * 180) / 90) * 6;

    let kPoint = 'Γ';
    const normX = x / rect.width;
    if (normX < 0.25) kPoint = 'Γ → X';
    else if (normX < 0.5) kPoint = 'X → M';
    else if (normX < 0.75) kPoint = 'M → Γ';
    else kPoint = 'Γ → Z';

    setHoverData({ x, y, energy, kPoint });
  };

  return (
    <div className="glass-panel-dark spotlight-card rounded-2xl p-4 flex flex-col justify-between h-[320px]">
      {/* Header */}
      <div className="flex items-center justify-between z-10 mb-1">
        <h4 className="text-xs font-bold text-slate-200 tracking-wide flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          Band Structure: {parsed.normalized}
        </h4>
        <span className="text-[10px] text-cyan-300 font-mono">
          E_g: {bg.toFixed(2)} eV
        </span>
      </div>

      {/* SVG Chart */}
      <div className="relative flex-1 w-full flex items-center justify-center">
        <svg
          viewBox="0 0 320 180"
          className="w-full h-full select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverData(null)}
        >
          {/* Energy Y-Axis */}
          <line x1="30" y1="15" x2="30" y2="160" stroke="#334155" strokeWidth="1" />
          <text x="8" y="95" fill="#64748b" fontSize="8" transform="rotate(-90 8,95)" textAnchor="middle">
            Energy (eV)
          </text>

          {/* Horizontal Grid & Labels */}
          {[-6, -3, 0, 3, 6].map((ev) => {
            const y = 90 - (ev / 6) * 70;
            return (
              <g key={ev}>
                <line
                  x1="30"
                  y1={y}
                  x2="305"
                  y2={y}
                  stroke={ev === 0 ? '#475569' : '#1e293b'}
                  strokeDasharray={ev === 0 ? '3 3' : undefined}
                  strokeWidth="1"
                />
                <text x="25" y={y + 3} fill="#64748b" fontSize="8" textAnchor="end">
                  {ev}
                </text>
              </g>
            );
          })}

          {/* High Symmetry Vertical Lines */}
          {[30, 98, 167, 236, 305].map((x, i) => (
            <line key={i} x1={x} y1="15" x2={x} y2="160" stroke="#1e293b" strokeWidth="1" />
          ))}

          {/* High Symmetry Labels on X axis */}
          <text x="30" y="172" fill="#64748b" fontSize="9" textAnchor="middle">Γ</text>
          <text x="98" y="172" fill="#64748b" fontSize="9" textAnchor="middle">X</text>
          <text x="167" y="172" fill="#64748b" fontSize="9" textAnchor="middle">M</text>
          <text x="236" y="172" fill="#64748b" fontSize="9" textAnchor="middle">Γ</text>
          <text x="305" y="172" fill="#64748b" fontSize="9" textAnchor="middle">Z</text>

          {/* Conduction Bands (Blue Glow) */}
          <path
            d={cbPath}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            filter="drop-shadow(0 0 4px #0284c7)"
          />
          <path
            d={cbPath2}
            fill="none"
            stroke="#0284c7"
            strokeWidth="1.5"
            strokeOpacity="0.8"
          />

          {/* Valence Bands (Red/Pink Glow) */}
          <path
            d={vbPath}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2"
            filter="drop-shadow(0 0 4px #e11d48)"
          />
          <path
            d={vbPath2}
            fill="none"
            stroke="#e11d48"
            strokeWidth="1.5"
            strokeOpacity="0.8"
          />

          {/* Mouse Crosshair */}
          {hoverData && (
            <g>
              <line x1={hoverData.x} y1="15" x2={hoverData.x} y2="160" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="2 2" />
              <line x1="30" y1={hoverData.y} x2="305" y2={hoverData.y} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="2 2" />
              <circle cx={hoverData.x} cy={hoverData.y} r="3" fill="#38bdf8" />
            </g>
          )}
        </svg>

        {/* Hover Tooltip */}
        {hoverData && (
          <div
            className="absolute pointer-events-none bg-slate-900/90 border border-cyan-500/50 rounded px-2 py-1 text-[10px] text-white shadow-lg"
            style={{
              left: Math.min(hoverData.x + 10, 200),
              top: Math.max(hoverData.y - 25, 10)
            }}
          >
            {hoverData.kPoint}: <span className="text-cyan-300 font-bold">{hoverData.energy.toFixed(2)} eV</span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 pt-1.5 border-t border-slate-800/60 z-10 text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-sky-400 shadow-[0_0_6px_#38bdf8]" />
          <span className="text-slate-300 font-medium">Conduction Band</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-rose-500 shadow-[0_0_6px_#f43f5e]" />
          <span className="text-slate-300 font-medium">Valence Band</span>
        </div>
      </div>
    </div>
  );
};
