import React, { useState } from 'react';
import { BarChart2 } from 'lucide-react';
import { MaterialDetail } from '../types/material';
import { parseChemicalFormula, ParsedFormula } from '../services/formulaParser';

interface DensityOfStatesCardProps {
  material: MaterialDetail | null;
  formula?: string;
}

export const DensityOfStatesCard: React.FC<DensityOfStatesCardProps> = ({ material, formula }) => {
  const [hoverData, setHoverData] = useState<{ x: number; y: number; dos: number; energy: number } | null>(null);

  const queryFormula = formula || material?.formula || 'H2O';
  const parsed: ParsedFormula = parseChemicalFormula(queryFormula);

  // Projected DOS curves based on formula elements
  // Primary and secondary elements
  const el1 = parsed.elements[0] || { symbol: 'H', data: { name: 'Hydrogen', color: '#38bdf8' } };
  const el2 = parsed.elements[1] || el1;

  // DOS paths (viewBox 0 0 320 180)
  const isInsulator = parsed.isInsulator;
  const gapShift = isInsulator ? 25 : 0;

  // Total DOS curve (multi-peak white glow)
  const totalPath = isInsulator
    ? `M 30 155 Q 50 145 70 135 T 100 115 T 125 145 T 150 155 L 180 155 Q 205 130 230 35 T 255 45 T 280 95 T 305 155`
    : `M 30 155 Q 60 150 75 140 T 110 120 T 135 145 T 167 125 T 200 130 T 225 35 T 245 45 T 270 95 T 305 155`;

  // Element 1 valence orbital curve (e.g. s orbital)
  const orb1Path = `M 30 155 Q 55 145 75 130 T 100 148 T 130 155 T 225 155 T 305 155`;

  // Element 2 p-orbital or d-orbital curve
  const orb2Path = `M 30 155 Q 167 155 190 140 T 225 50 T 255 110 T 305 155`;

  // Secondary orbital curve
  const orb3Path = `M 30 155 Q 180 155 210 135 T 240 70 T 270 95 T 305 155`;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const energy = ((x - 167) / 138) * 10;
    const dos = ((155 - y) / 130) * 40;

    setHoverData({ x, y, energy, dos: Math.max(0, dos) });
  };

  return (
    <div className="glass-panel-dark spotlight-card rounded-2xl p-4 flex flex-col justify-between h-[320px]">
      {/* Header */}
      <div className="flex items-center justify-between z-10 mb-1">
        <h4 className="text-xs font-bold text-slate-200 tracking-wide flex items-center gap-1.5">
          <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
          Density of States (DOS)
        </h4>
        <span className="text-[10px] text-slate-400 font-mono">
          E_Fermi = 0 eV
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
          {/* DOS Y-Axis */}
          <line x1="30" y1="15" x2="30" y2="155" stroke="#334155" strokeWidth="1" />
          <text x="8" y="90" fill="#64748b" fontSize="8" transform="rotate(-90 8,90)" textAnchor="middle">
            DOS (a.u.)
          </text>

          {/* Horizontal Grid & Labels */}
          {[0, 10, 20, 30, 40].map((dos) => {
            const y = 155 - (dos / 40) * 130;
            return (
              <g key={dos}>
                <line x1="30" y1={y} x2="305" y2={y} stroke="#1e293b" strokeWidth="1" />
                <text x="25" y={y + 3} fill="#64748b" fontSize="8" textAnchor="end">
                  {dos}
                </text>
              </g>
            );
          })}

          {/* Energy X-Axis & Grid */}
          {[-10, -5, 0, 5, 10].map((ev) => {
            const x = 167 + (ev / 10) * 138;
            return (
              <g key={ev}>
                <line
                  x1={x}
                  y1="15"
                  x2={x}
                  y2="155"
                  stroke={ev === 0 ? '#475569' : '#1e293b'}
                  strokeDasharray={ev === 0 ? '3 3' : undefined}
                  strokeWidth="1"
                />
                <text x={x} y={167} fill="#64748b" fontSize="8" textAnchor="middle">
                  {ev}
                </text>
              </g>
            );
          })}
          <text x="167" y="177" fill="#64748b" fontSize="8" textAnchor="middle">
            Energy (eV)
          </text>

          {/* DOS Curves with Glow */}
          {/* Total */}
          <path
            d={totalPath}
            fill="none"
            stroke="#f8fafc"
            strokeWidth="1.8"
            filter="drop-shadow(0 0 3px rgba(255,255,255,0.7))"
          />

          {/* Element 1 orbital */}
          <path
            d={orb1Path}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="1.5"
            filter="drop-shadow(0 0 3px #06b6d4)"
          />

          {/* Element 2 orbital */}
          <path
            d={orb2Path}
            fill="none"
            stroke="#10b981"
            strokeWidth="1.6"
            filter="drop-shadow(0 0 4px #10b981)"
          />

          {/* Element 2 p-orbital */}
          <path
            d={orb3Path}
            fill="none"
            stroke="#f97316"
            strokeWidth="1.6"
            filter="drop-shadow(0 0 4px #f97316)"
          />

          {/* Hover Crosshair */}
          {hoverData && (
            <g>
              <line x1={hoverData.x} y1="15" x2={hoverData.x} y2="155" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="2 2" />
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
            E: <span className="text-cyan-300 font-bold">{hoverData.energy.toFixed(1)} eV</span> | DOS: <span className="text-emerald-300 font-bold">{hoverData.dos.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Dynamic Element-Specific Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-1.5 border-t border-slate-800/60 z-10 text-[10px]">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-0.5 bg-slate-100 shadow-[0_0_4px_#fff]" />
          <span className="text-slate-300">Total</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-0.5 bg-cyan-400 shadow-[0_0_4px_#06b6d4]" />
          <span className="text-slate-300">{el1.symbol} (s)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-0.5 bg-emerald-400 shadow-[0_0_4px_#10b981]" />
          <span className="text-slate-300">{el2.symbol} (p)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-0.5 bg-orange-400 shadow-[0_0_4px_#f97316]" />
          <span className="text-slate-300">{el2.symbol} (s)</span>
        </div>
      </div>
    </div>
  );
};
