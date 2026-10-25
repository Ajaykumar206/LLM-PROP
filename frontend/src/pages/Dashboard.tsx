import React, { useState, useEffect } from 'react';
import {
  MaterialDetail,
  CrystalStructure3D,
  PredictionResponse,
  ExplanationResponse
} from '../types/material';
import {
  searchMaterials,
  getMaterialDetail,
  predictProperties,
  generateExplanation,
  checkHealth
} from '../services/api';
import { parseChemicalFormula, ParsedFormula } from '../services/formulaParser';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { HolographicPedestal } from '../components/HolographicPedestal';
import { AtomicOrbitAnimation } from '../components/AtomicOrbitAnimation';
import { PropertyCards } from '../components/PropertyCards';
import { MaterialTheoryCard } from '../components/MaterialTheoryCard';
import { CrystalStructureCard } from '../components/CrystalStructureCard';
import { BandStructureCard } from '../components/BandStructureCard';
import { DensityOfStatesCard } from '../components/DensityOfStatesCard';
import { ApplicationsBar } from '../components/ApplicationsBar';
import { NavigationModals } from '../components/NavigationModals';

export const Dashboard: React.FC = () => {
  // Query & Active material
  const [query, setQuery] = useState('SiO4');
  const [activeTab, setActiveTab] = useState('Home');
  const [material, setMaterial] = useState<MaterialDetail | null>(null);
  const [structure, setStructure] = useState<CrystalStructure3D | null>(null);
  const [predictions, setPredictions] = useState<PredictionResponse | null>(null);
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);

  // Loading & status
  const [isSearching, setIsSearching] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals & Storage
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(['SiO4', 'H2O', 'TiO2', 'LiFePO4', 'BaTiO3', 'NaCl']);
  const [savedMaterials, setSavedMaterials] = useState<string[]>(['SiO4', 'H2O']);

  // Global mouse position tracking for card spotlight reflections
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cards = document.querySelectorAll('.spotlight-card');
      cards.forEach((card) => {
        const rect = (card as HTMLElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        (card as HTMLElement).style.setProperty('--mouse-x', `${x}px`);
        (card as HTMLElement).style.setProperty('--mouse-y', `${y}px`);
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Initial load
  useEffect(() => {
    checkHealth().catch(() => {});
    handleSearch('SiO4');
  }, []);

  const parsedFormula: ParsedFormula = parseChemicalFormula(query);

  const handleSearch = async (searchTerm: string) => {
    const term = searchTerm.trim() || 'SiO4';
    setIsSearching(true);
    setErrorMessage(null);
    setQuery(term);
    setStructure(null); // Clear previous structure immediately so 3D diagram updates immediately to new formula

    // Update recent searches
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== term.toLowerCase());
      return [term, ...filtered].slice(0, 10);
    });

    try {
      const res = await searchMaterials(term);
      if (res.selected_material) {
        setMaterial(res.selected_material);
        setStructure(res.selected_material.structure_3d || null);
        triggerExplanation(res.selected_material);
      } else if (res.matches && res.matches.length > 0) {
        const mat = await getMaterialDetail(res.matches[0].material_id);
        setMaterial(mat);
        setStructure(mat.structure_3d || null);
        triggerExplanation(mat);
      } else {
        const fallbackMat = createMaterialFromParsed(term);
        setMaterial(fallbackMat);
        triggerExplanation(fallbackMat);
      }

      // Fetch predictions
      predictProperties(term)
        .then((pred) => setPredictions(pred))
        .catch(() => {});
    } catch (err: any) {
      const fallbackMat = createMaterialFromParsed(term);
      setMaterial(fallbackMat);
      triggerExplanation(fallbackMat);
    } finally {
      setIsSearching(false);
    }
  };

  const triggerExplanation = async (mat: MaterialDetail) => {
    setIsExplaining(true);
    try {
      const res = await generateExplanation(mat);
      setExplanation(res);
    } catch {
      // Handled gracefully in UI
    } finally {
      setIsExplaining(false);
    }
  };

  const handlePredict = () => {
    handleSearch(query);
  };

  const toggleSaveMaterial = () => {
    const current = material?.formula || query;
    if (savedMaterials.includes(current)) {
      setSavedMaterials((prev) => prev.filter((m) => m !== current));
    } else {
      setSavedMaterials((prev) => [...prev, current]);
    }
  };

  // Dynamically create MaterialDetail for ANY entered chemical formula
  const createMaterialFromParsed = (formula: string): MaterialDetail => {
    const p = parseChemicalFormula(formula);
    return {
      material_id: `compound-${p.normalized.toLowerCase()}`,
      formula: p.normalized,
      composition: p.name,
      elements: p.elements.map((e) => e.symbol),
      chemical_system: p.elements.map((e) => e.symbol).join('-'),
      crystal_system: p.crystalClass,
      space_group: p.spaceGroup,
      space_group_number: 1,
      properties: {
        band_gap: {
          name: 'Band Gap',
          value: p.properties.bandGap,
          formatted_value: `${p.properties.bandGap.toFixed(2)} eV`,
          unit: 'eV',
          source: 'DFT-PBE / ML',
          is_predicted: true
        },
        formation_energy_per_atom: {
          name: 'Formation Energy per Atom',
          value: p.properties.formationEnergy,
          formatted_value: `${p.properties.formationEnergy.toFixed(2)} eV/atom`,
          unit: 'eV/atom',
          source: 'DFT-PBE / ML',
          is_predicted: true
        },
        density: {
          name: 'Density',
          value: p.properties.density,
          formatted_value: `${p.properties.density.toFixed(2)} g/cm³`,
          unit: 'g/cm³',
          source: 'Crystallographic',
          is_predicted: true
        }
      },
      lattice: {
        a: p.properties.latticeA,
        b: p.properties.latticeA,
        c: p.properties.latticeA,
        alpha: 90,
        beta: 90,
        gamma: 90,
        volume: Math.pow(p.properties.latticeA, 3)
      },
      polymorphs_count: 1,
      other_polymorphs: [],
      source: 'Quantum Property Estimator'
    };
  };

  return (
    <div className="min-h-screen bg-[#040914] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* 1. Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (['Recent Searches', 'Saved Materials', 'Compare Materials', '3D Visualization', 'Application Finder'].includes(tab)) {
            setActiveModal(tab);
          }
        }}
        savedCount={savedMaterials.length}
      />

      {/* 2. Main Content Container */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 lg:p-6 flex flex-col lg:flex-row gap-6">
        {/* Left Column: Sidebar with Search & Controls */}
        <Sidebar
          query={query}
          onQueryChange={setQuery}
          onSearch={handleSearch}
          onPredict={handlePredict}
          isSearching={isSearching}
          onOpenRecentSearches={() => setActiveModal('Recent Searches')}
          onOpenSavedMaterials={() => setActiveModal('Saved Materials')}
          onOpenCompareMaterials={() => setActiveModal('Compare Materials')}
          onOpen3DVisualizer={() => setActiveModal('3D Visualization')}
          onOpenApplicationFinder={() => setActiveModal('Application Finder')}
        />

        {/* Right / Main Content Area */}
        <section className="flex-1 flex flex-col space-y-6">
          {/* Top Hero Row: Center 3D Pedestal + Right Atomic Orbit Animation */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
            {/* Center/Left Hero Card: 3D Holographic Pedestal & Info */}
            <div className="xl:col-span-8">
              <HolographicPedestal
                material={material}
                structure={structure}
                formula={query}
                onOpenFullscreen={() => setActiveModal('3D Visualization')}
                isSaved={savedMaterials.includes(material?.formula || query)}
                onToggleSave={toggleSaveMaterial}
              />
            </div>

            {/* Right Hero Card: Atomic Structure (Animated) */}
            <div className="xl:col-span-4">
              <AtomicOrbitAnimation
                formula={query}
                elements={material?.elements || parsedFormula.elements.map(e => e.symbol)}
              />
            </div>
          </div>

          {/* AI Material Theory & Quantum LLM Analysis Section */}
          <MaterialTheoryCard
            parsed={parsedFormula}
            isGenerating={isExplaining}
            onRegenerate={() => material && triggerExplanation(material)}
            apiExplanationText={explanation?.summary}
          />

          {/* Middle Row: 8 Categorized Predicted Properties */}
          <PropertyCards
            material={material}
            predictions={predictions}
            formula={query}
          />

          {/* Bottom 3-Panel Row: Crystal 3D + Band Structure + DOS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CrystalStructureCard
              structure={structure}
              formula={query}
            />

            <BandStructureCard
              material={material}
              formula={query}
            />

            <DensityOfStatesCard
              material={material}
              formula={query}
            />
          </div>

          {/* Bottom Row: Applications Category Bar */}
          <ApplicationsBar
            currentFormula={query}
          />
        </section>
      </main>

      {/* Navigation & Action Modals */}
      <NavigationModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        recentSearches={recentSearches}
        savedMaterials={savedMaterials}
        onSelectFormula={(f) => {
          setQuery(f);
          handleSearch(f);
        }}
        onRemoveSaved={(f) => setSavedMaterials((prev) => prev.filter((s) => s !== f))}
        currentMaterial={material}
      />
    </div>
  );
};
