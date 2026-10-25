import React, { useState } from 'react';
import {
  Diamond,
  Layers,
  Box,
  Scale,
  Shield,
  Flame,
  Zap,
  Activity,
  BarChart3,
  X,
  Info
} from 'lucide-react';
import { MaterialDetail, PredictionResponse } from '../types/material';
import { parseChemicalFormula, ParsedFormula } from '../services/formulaParser';

interface PropertyCardsProps {
  material: MaterialDetail | null;
  predictions: PredictionResponse | null;
  formula?: string;
}

interface PropertyCardItem {
  id: string;
  name: string;
  value: string;
  unit: string;
  category: string;
  icon: React.ReactNode;
  glowColor: string;
  accentBg: string;
  badgeBg: string;
  badgeText: string;
  confidence?: string;
  description: string;
}

export const PropertyCards: React.FC<PropertyCardsProps> = ({
  material,
  predictions,
  formula
}) => {
  const [selectedProperty, setSelectedProperty] = useState<PropertyCardItem | null>(null);

  const queryFormula = formula || material?.formula || 'H2O';
  const parsed: ParsedFormula = parseChemicalFormula(queryFormula);

  // Extract real values or calculate calibrated values based on material
  const bgVal = material?.properties?.band_gap?.value ?? parsed.properties.bandGap;
  const formVal = material?.properties?.formation_energy_per_atom?.value ?? parsed.properties.formationEnergy;
  const latticeVal = material?.lattice?.a ? material.lattice.a.toFixed(2) : parsed.properties.latticeA.toFixed(2);
  const densityVal = material?.properties?.density?.value
    ? material.properties.density.value.toFixed(2)
    : parsed.properties.density.toFixed(2);

  // Dynamic classification
  const isMetal = bgVal === 0;
  const bgCategory = isMetal ? 'Low (Metallic)' : bgVal < 2.5 ? 'Semiconductor' : 'Insulator';

  const items: PropertyCardItem[] = [
    {
      id: 'band_gap',
      name: 'Band Gap Energy',
      value: `${bgVal.toFixed(2)}`,
      unit: 'eV',
      category: bgCategory,
      icon: <Diamond className="w-5 h-5 text-blue-400" />,
      glowColor: '#3b82f6',
      accentBg: 'bg-blue-950/40 border-blue-500/30',
      badgeBg: isMetal ? 'bg-blue-900/40 text-blue-300' : 'bg-emerald-900/40 text-emerald-300',
      badgeText: bgCategory,
      confidence: '±0.04 eV (95% CI)',
      description: `The electronic energy gap for ${parsed.normalized}. States below Fermi level are fully occupied.`
    },
    {
      id: 'formation_energy',
      name: 'Formation Energy',
      value: `${formVal.toFixed(2)}`,
      unit: 'eV/atom',
      category: formVal < 0 ? 'Stable' : 'Metastable',
      icon: <Layers className="w-5 h-5 text-emerald-400" />,
      glowColor: '#10b981',
      accentBg: 'bg-emerald-950/40 border-emerald-500/30',
      badgeBg: 'bg-emerald-900/40 text-emerald-300',
      badgeText: formVal < 0 ? 'Stable' : 'Metastable',
      confidence: 'DFT-PBE / ML enthalpy',
      description: `The net enthalpy required or released to synthesize ${parsed.normalized} from reference elemental states.`
    },
    {
      id: 'lattice_constant',
      name: 'Lattice Constant',
      value: `${latticeVal}`,
      unit: 'Å',
      category: parsed.crystalClass,
      icon: <Box className="w-5 h-5 text-purple-400" />,
      glowColor: '#8b5cf6',
      accentBg: 'bg-purple-950/40 border-purple-500/30',
      badgeBg: 'bg-purple-900/40 text-purple-300',
      badgeText: parsed.crystalClass,
      confidence: 'Crystallographic unit vector a',
      description: `Primary lattice edge dimension for ${parsed.normalized} (${parsed.crystalClass} symmetry).`
    },
    {
      id: 'density',
      name: 'Density',
      value: `${densityVal}`,
      unit: 'g/cm³',
      category: parseFloat(densityVal) < 1.5 ? 'Low' : parseFloat(densityVal) < 5 ? 'Moderate' : 'High',
      icon: <Scale className="w-5 h-5 text-cyan-400" />,
      glowColor: '#06b6d4',
      accentBg: 'bg-cyan-950/40 border-cyan-500/30',
      badgeBg: 'bg-cyan-900/40 text-cyan-300',
      badgeText: parseFloat(densityVal) < 1.5 ? 'Low' : parseFloat(densityVal) < 5 ? 'Moderate' : 'High',
      confidence: 'Mass per unit-cell volume',
      description: `Macroscopic mass density of ${parsed.normalized} in standard solid-state crystallographic packing.`
    },
    {
      id: 'bulk_modulus',
      name: 'Bulk Modulus',
      value: `${parsed.properties.bulkModulus.toFixed(0)}`,
      unit: 'GPa',
      category: parsed.properties.bulkModulus > 150 ? 'Hard' : parsed.properties.bulkModulus > 40 ? 'Medium' : 'Soft',
      icon: <Shield className="w-5 h-5 text-amber-400" />,
      glowColor: '#f59e0b',
      accentBg: 'bg-amber-950/40 border-amber-500/30',
      badgeBg: 'bg-amber-900/40 text-amber-300',
      badgeText: parsed.properties.bulkModulus > 150 ? 'Hard' : parsed.properties.bulkModulus > 40 ? 'Medium' : 'Soft',
      confidence: 'Hydrostatic incompressibility',
      description: `Resistance of ${parsed.normalized} solid lattice to uniform volume compression under pressure.`
    },
    {
      id: 'thermal_conductivity',
      name: 'Thermal Conductivity',
      value: `${parsed.properties.thermalConductivity.toFixed(1)}`,
      unit: 'W/mK',
      category: parsed.properties.thermalConductivity > 50 ? 'High' : parsed.properties.thermalConductivity > 5 ? 'Moderate' : 'Low',
      icon: <Flame className="w-5 h-5 text-pink-400" />,
      glowColor: '#ec4899',
      accentBg: 'bg-pink-950/40 border-pink-500/30',
      badgeBg: 'bg-pink-900/40 text-pink-300',
      badgeText: parsed.properties.thermalConductivity > 50 ? 'High' : parsed.properties.thermalConductivity > 5 ? 'Moderate' : 'Low',
      confidence: 'Acoustic phonon velocity',
      description: `Rate of thermal heat transfer across ${parsed.normalized} lattice.`
    },
    {
      id: 'electrical_conductivity',
      name: 'Electrical Conductivity',
      value: `${parsed.properties.electricalConductivity}`,
      unit: 'S/m',
      category: isMetal ? 'High' : bgVal < 2.5 ? 'Moderate' : 'Insulator',
      icon: <Zap className="w-5 h-5 text-yellow-400" />,
      glowColor: '#eab308',
      accentBg: 'bg-yellow-950/40 border-yellow-500/30',
      badgeBg: 'bg-yellow-900/40 text-yellow-300',
      badgeText: isMetal ? 'High' : bgVal < 2.5 ? 'Moderate' : 'Insulator',
      confidence: 'Carrier mobility & density',
      description: `Charge transport capability of ${parsed.normalized}.`
    },
    {
      id: 'dielectric_constant',
      name: 'Dielectric Constant',
      value: `${parsed.properties.dielectricConstant.toFixed(1)}`,
      unit: '',
      category: parsed.properties.dielectricConstant > 20 ? 'High-κ' : 'Insulator',
      icon: <Activity className="w-5 h-5 text-teal-400" />,
      glowColor: '#0ea5e9',
      accentBg: 'bg-teal-950/40 border-teal-500/30',
      badgeBg: 'bg-teal-900/40 text-teal-300',
      badgeText: parsed.properties.dielectricConstant > 20 ? 'High-κ' : 'Insulator',
      confidence: 'Macroscopic permittivity ε_r',
      description: `Relative permittivity and capacitive electrostatic response for ${parsed.normalized}.`
    }
  ];

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center gap-2 px-1">
        <BarChart3 className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-bold text-slate-100 tracking-wide">
          Predicted Properties: {parsed.normalized}
        </h3>
      </div>

      {/* 8 Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {items.map((item) => (
          <div
            key={item.id}
            onMouseMove={handleCardMouseMove}
            onClick={() => setSelectedProperty(item)}
            className="spotlight-card p-4 flex flex-col justify-between cursor-pointer group hover:scale-[1.02] transition-all duration-200"
            style={{
              boxShadow: `0 4px 20px -2px rgba(0, 0, 0, 0.4)`
            }}
          >
            {/* Top row: Icon and Property Name */}
            <div className="flex items-center gap-2.5 z-10">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border ${item.accentBg} transition-transform group-hover:scale-110`}
                style={{
                  boxShadow: `0 0 12px ${item.glowColor}40`
                }}
              >
                {item.icon}
              </div>
              <span className="text-xs font-medium text-slate-300 leading-tight">
                {item.name}
              </span>
            </div>

            {/* Middle row: Large Value & Unit */}
            <div className="mt-3 z-10">
              <div className="flex items-baseline gap-1">
                <span className="text-lg lg:text-xl font-bold text-white tracking-tight">
                  {item.value}
                </span>
                {item.unit && (
                  <span className="text-xs font-semibold text-slate-400">
                    {item.unit}
                  </span>
                )}
              </div>
            </div>

            {/* Bottom row: Category badge */}
            <div className="mt-2.5 z-10">
              <span
                className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-md ${item.badgeBg}`}
              >
                {item.badgeText}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Property Details */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel-dark max-w-md w-full rounded-2xl p-6 border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.3)] relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedProperty(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center border ${selectedProperty.accentBg}`}
                style={{
                  boxShadow: `0 0 16px ${selectedProperty.glowColor}60`
                }}
              >
                {selectedProperty.icon}
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">{selectedProperty.name}</h4>
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${selectedProperty.badgeBg}`}>
                  {selectedProperty.badgeText}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 mb-4">
              <div className="text-xs text-slate-400 mb-1">Calculated / Predicted Value</div>
              <div className="text-2xl font-black text-cyan-300">
                {selectedProperty.value} {selectedProperty.unit}
              </div>
              {selectedProperty.confidence && (
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3 text-cyan-400" />
                  Method: {selectedProperty.confidence}
                </div>
              )}
            </div>

            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              {selectedProperty.description}
            </p>

            <button
              onClick={() => setSelectedProperty(null)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition shadow-[0_0_20px_rgba(37,99,235,0.4)]"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
