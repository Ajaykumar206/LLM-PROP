import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { parseChemicalFormula, ParsedFormula } from '../services/formulaParser';

interface AtomicOrbitAnimationProps {
  formula: string;
  elements?: string[];
}

interface OrbitRing {
  radiusX: number;
  radiusY: number;
  tiltAngle: number;
  speed: number;
  color: string;
  electrons: {
    angle: number;
    size: number;
    color: string;
    glowColor: string;
  }[];
}

export const AtomicOrbitAnimation: React.FC<AtomicOrbitAnimationProps> = ({
  formula
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  const parsed: ParsedFormula = parseChemicalFormula(formula);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    // Build rings & electrons dynamically based on atomic numbers
    const primaryEl = parsed.elements[0]?.data;
    const secondaryEl = parsed.elements[1]?.data || primaryEl;

    const col1 = primaryEl?.color || '#38bdf8';
    const col2 = secondaryEl?.color || '#ef4444';

    const rings: OrbitRing[] = [
      {
        radiusX: 135,
        radiusY: 48,
        tiltAngle: -Math.PI / 6,
        speed: 0.015,
        color: `${col1}60`,
        electrons: [
          { angle: 0, size: 5, color: col1, glowColor: `${col1}cc` },
          { angle: Math.PI, size: 4.5, color: col2, glowColor: `${col2}cc` }
        ]
      },
      {
        radiusX: 110,
        radiusY: 42,
        tiltAngle: Math.PI / 4,
        speed: -0.02,
        color: `${col2}60`,
        electrons: [
          { angle: 0.8, size: 5, color: col2, glowColor: `${col2}cc` },
          { angle: 0.8 + Math.PI, size: 4.5, color: col1, glowColor: `${col1}cc` }
        ]
      },
      {
        radiusX: 145,
        radiusY: 52,
        tiltAngle: Math.PI / 12,
        speed: 0.012,
        color: 'rgba(56, 189, 248, 0.35)',
        electrons: [
          { angle: 1.5, size: 4.5, color: col1, glowColor: `${col1}cc` },
          { angle: 1.5 + (2 * Math.PI) / 3, size: 5, color: col2, glowColor: `${col2}cc` },
          { angle: 1.5 + (4 * Math.PI) / 3, size: 4.5, color: '#fbbf24', glowColor: 'rgba(251, 191, 36, 0.8)' }
        ]
      },
      {
        radiusX: 85,
        radiusY: 34,
        tiltAngle: -Math.PI / 3,
        speed: -0.025,
        color: 'rgba(168, 85, 247, 0.4)',
        electrons: [
          { angle: 2.2, size: 4.5, color: '#a855f7', glowColor: 'rgba(168, 85, 247, 0.8)' },
          { angle: 2.2 + Math.PI, size: 5, color: col1, glowColor: `${col1}cc` }
        ]
      }
    ];

    let time = 0;

    const render = () => {
      time += 0.015;

      // Smooth mouse tilt
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const centerX = w / 2 + mouseRef.current.x * 20;
      const centerY = h / 2 + mouseRef.current.y * 15;

      // Glowing aura
      const radialGlow = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, 120);
      radialGlow.addColorStop(0, `${col1}33`);
      radialGlow.addColorStop(0.5, `${col2}1a`);
      radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radialGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 120, 0, Math.PI * 2);
      ctx.fill();

      // Orbit Rings & Electrons
      rings.forEach((ring) => {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(ring.tiltAngle + mouseRef.current.x * 0.15);

        ctx.beginPath();
        ctx.ellipse(0, 0, ring.radiusX, ring.radiusY, 0, 0, Math.PI * 2);
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 2]);
        ctx.stroke();
        ctx.setLineDash([]);

        ring.electrons.forEach((el) => {
          el.angle += ring.speed;
          const ex = ring.radiusX * Math.cos(el.angle);
          const ey = ring.radiusY * Math.sin(el.angle);

          // Electron glow
          const elGlow = ctx.createRadialGradient(ex, ey, 0, ex, ey, el.size * 2.5);
          elGlow.addColorStop(0, el.glowColor);
          elGlow.addColorStop(1, 'transparent');
          ctx.fillStyle = elGlow;
          ctx.beginPath();
          ctx.arc(ex, ey, el.size * 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Electron core
          ctx.fillStyle = el.color;
          ctx.beginPath();
          ctx.arc(ex, ey, el.size, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.restore();
      });

      // Center Pulsing Nucleus
      const pulseSize = 18 + Math.sin(time * 3) * 1.5;
      const nucGlow = ctx.createRadialGradient(centerX, centerY, 2, centerX, centerY, pulseSize * 2.2);
      nucGlow.addColorStop(0, '#ffffff');
      nucGlow.addColorStop(0.3, col1);
      nucGlow.addColorStop(0.7, col2);
      nucGlow.addColorStop(1, 'transparent');

      ctx.fillStyle = nucGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseSize * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Nucleus 3D sphere gradient
      const sphereGrad = ctx.createRadialGradient(
        centerX - pulseSize * 0.3,
        centerY - pulseSize * 0.3,
        2,
        centerX,
        centerY,
        pulseSize
      );
      sphereGrad.addColorStop(0, '#ffffff');
      sphereGrad.addColorStop(0.4, col1);
      sphereGrad.addColorStop(0.8, col2);
      sphereGrad.addColorStop(1, '#0f172a');

      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [formula]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    mouseRef.current.targetX = nx;
    mouseRef.current.targetY = ny;
  };

  const handleMouseLeave = () => {
    mouseRef.current.targetX = 0;
    mouseRef.current.targetY = 0;
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="glass-panel-dark spotlight-card rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <h4 className="text-sm font-semibold text-slate-200 tracking-wide flex items-center gap-2">
          Atomic Structure (Animated)
        </h4>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-slate-400 hover:text-slate-200 transition p-1 rounded-lg hover:bg-slate-800/60"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Orbit Canvas with Mouse-responsive tilt */}
      {isExpanded && (
        <div className="relative flex items-center justify-center py-2 z-10">
          <canvas
            ref={canvasRef}
            width={340}
            height={200}
            className="w-full h-48 cursor-pointer select-none"
            title="Move mouse to interact with atomic orbital model"
          />
        </div>
      )}

      {/* Dynamic Elements Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-2 border-t border-slate-800/60 z-10 text-xs">
        {parsed.elements.slice(0, 3).map((el) => (
          <div key={el.symbol} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shadow-sm"
              style={{
                backgroundColor: el.data.color,
                boxShadow: `0 0 8px ${el.data.color}`
              }}
            />
            <span className="text-slate-300 font-medium">
              {el.symbol} ({el.data.name})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
