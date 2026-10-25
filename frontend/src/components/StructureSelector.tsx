import React from 'react';
import { Layers, CheckCircle2, ChevronRight, Activity, Zap } from 'lucide-react';
import { PolymorphOption } from '../types/material';

interface StructureSelectorProps {
  polymorphs: PolymorphOption[];
  selectedMaterialId: string;
  onSelect: (materialId: string) => void;
  isLoading?: boolean;
}

export const StructureSelector: React.FC<StructureSelectorProps> = ({
  polymorphs,
  selectedMaterialId,
  onSelect,
  isLoading
}) => {
  if (!polymorphs || polymorphs.length <= 1) {
    return null;
  }

  return (
    <div className="glass-panel rounded-2xl p-5 mb-8 border border-slate-200/80">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-crystal-600" />
          <h3 className="text-sm font-bold text-slate-800">
            Multiple Crystal Structures / Polymorphs ({polymorphs.length})
          </h3>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Select a crystallographic polymorph to inspect its properties
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {polymorphs.map((poly) => {
          const isSelected = poly.material_id === selectedMaterialId;

          return (
            <button
              key={poly.material_id}
              onClick={() => onSelect(poly.material_id)}
              disabled={isLoading || isSelected}
              className={`p-3.5 rounded-xl border text-left transition relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-crystal-50/80 border-crystal-400 ring-2 ring-crystal-200 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-crystal-300 hover:bg-slate-50/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono font-bold text-slate-800">
                    {poly.material_id}
                  </span>
                  {isSelected ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-crystal-700 bg-crystal-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 group-hover:text-crystal-500 flex items-center">
                      Select <ChevronRight className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <div className="text-sm font-semibold text-slate-800 capitalize mb-1">
                  {poly.crystal_system} • <span className="font-mono text-xs text-slate-600">{poly.space_group}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100/80 mt-2 flex items-center justify-between text-xs text-slate-500 font-mono">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  {poly.band_gap_eV.toFixed(2)} eV
                </span>
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-emerald-500" />
                  Ehull: {poly.energy_above_hull_eV_atom.toFixed(3)}
                </span>
                <span>
                  {poly.density_g_cm3.toFixed(1)} g/cm³
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
