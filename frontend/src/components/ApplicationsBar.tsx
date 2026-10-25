import React, { useRef, useState } from 'react';
import {
  Briefcase,
  FlaskConical,
  Layers,
  Cpu,
  Sparkles,
  BatteryCharging,
  CircuitBoard,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

interface ApplicationCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  relevance: string;
}

interface ApplicationsBarProps {
  currentFormula?: string;
}

export const ApplicationsBar: React.FC<ApplicationsBarProps> = ({
  currentFormula = 'SiO4'
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedApp, setSelectedApp] = useState<ApplicationCategory | null>(null);

  const categories: ApplicationCategory[] = [
    {
      id: 'ceramics',
      name: 'Ceramics',
      icon: <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />,
      description: 'High-temperature structural ceramics, refractories, and wear-resistant coatings.',
      relevance: `${currentFormula} silicate tetrahedra provide exceptional thermal stability, mechanical rigidity, and corrosion resistance at elevated temperatures above 1400°C.`
    },
    {
      id: 'glass',
      name: 'Glass Materials',
      icon: <Layers className="w-3.5 h-3.5 text-blue-400" />,
      description: 'Optical fibers, borosilicate labware, window vitreous silica, and bioactive glasses.',
      relevance: `${currentFormula} is the universal network former in amorphous oxide glasses, providing optical transparency and low thermal expansion.`
    },
    {
      id: 'semiconductors',
      name: 'Semiconductors',
      icon: <Cpu className="w-3.5 h-3.5 text-purple-400" />,
      description: 'Gate oxide dielectric barriers, passivation layers, and substrate isolation.',
      relevance: `Forms atomic-quality native interfaces with silicon with a large ~9 eV band gap and breakdown electric fields > 10 MV/cm.`
    },
    {
      id: 'catalysts',
      name: 'Catalysts',
      icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400" />,
      description: 'Zeolite framework molecular sieves, petrochemistry cracking, and heterogeneous catalysis.',
      relevance: `Framework interconnected [SiO4] and [AlO4] polyhedra create microporous channels with Brønsted acid sites for selective chemical catalysis.`
    },
    {
      id: 'energy_storage',
      name: 'Energy Storage',
      icon: <BatteryCharging className="w-3.5 h-3.5 text-amber-400" />,
      description: 'Solid electrolyte separators, anode coatings, and olivine LiFePO4 frameworks.',
      relevance: `Robust polyanionic covalent frameworks stabilize electrode crystal structures against oxygen loss during high-voltage battery cycling.`
    },
    {
      id: 'electronics',
      name: 'Electronics',
      icon: <CircuitBoard className="w-3.5 h-3.5 text-rose-400" />,
      description: 'Printed circuit board dielectric substrates, inter-layer isolation, and MEMS resonators.',
      relevance: `Offers exceptionally low dielectric loss (tan δ < 10⁻⁴) and high frequency impedance isolation across RF spectrums.`
    }
  ];

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <>
      <div className="glass-panel-dark spotlight-card rounded-2xl p-3 flex items-center justify-between gap-3 overflow-hidden">
        {/* Left: Section Title */}
        <div className="flex items-center gap-2 pl-2 flex-shrink-0">
          <Briefcase className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-slate-100 tracking-wide">
            Applications
          </span>
        </div>

        {/* Middle: Horizontal Scrolling Category Pills */}
        <div
          ref={scrollRef}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth flex-1 py-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedApp(cat)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 hover:border-cyan-500/50 text-slate-300 hover:text-white text-xs font-medium transition flex-shrink-0 group hover:shadow-[0_0_12px_rgba(6,182,212,0.25)]"
            >
              {cat.icon}
              <span className="group-hover:translate-x-0.5 transition-transform">
                {cat.name}
              </span>
            </button>
          ))}
        </div>

        {/* Right: Scroll Carousel Controls */}
        <div className="flex items-center gap-1 pr-1 flex-shrink-0">
          <button
            onClick={() => handleScroll('left')}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
            title="Scroll left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
            title="Scroll right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Application Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel-dark max-w-md w-full rounded-2xl p-6 border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.3)] relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedApp(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-center">
                {selectedApp.icon}
              </div>
              <div>
                <h4 className="text-base font-bold text-white">{selectedApp.name}</h4>
                <p className="text-xs text-slate-400">{selectedApp.description}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 my-4">
              <div className="text-xs font-semibold text-cyan-400 mb-1.5">
                Relevance to {currentFormula}:
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedApp.relevance}
              </p>
            </div>

            <button
              onClick={() => setSelectedApp(null)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition shadow-[0_0_20px_rgba(37,99,235,0.4)]"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
