import React, { useState } from 'react';
import { Search, Sparkles, AlertCircle } from 'lucide-react';

interface MaterialSearchProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  currentQuery: string;
}

const EXAMPLE_MATERIALS = [
  { formula: 'SiO2', label: 'SiO₂ (Quartz)' },
  { formula: 'GaAs', label: 'GaAs (Semiconductor)' },
  { formula: 'TiO2', label: 'TiO₂ (Rutile)' },
  { formula: 'Si', label: 'Silicon (Diamond-cubic)' },
  { formula: 'Al2O3', label: 'Al₂O₃ (Corundum)' },
  { formula: 'BaTiO3', label: 'BaTiO₃ (Perovskite)' },
  { formula: 'GaN', label: 'GaN (Wurtzite)' },
  { formula: 'MoS2', label: 'MoS₂ (2D Dichalcogenide)' },
];

export const MaterialSearch: React.FC<MaterialSearchProps> = ({
  onSearch,
  isLoading,
  currentQuery
}) => {
  const [inputVal, setInputVal] = useState(currentQuery);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  React.useEffect(() => {
    setInputVal(currentQuery);
  }, [currentQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputVal(val);

    // Basic client-side formula check
    if (val.trim() && !/^[A-Za-z0-9\(\)\-_,\s]+$/.test(val)) {
      setValidationWarning('Contains characters not typical in chemical formulas.');
    } else {
      setValidationWarning(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    onSearch(inputVal.trim());
  };

  const handlePresetClick = (formula: string) => {
    setInputVal(formula);
    setValidationWarning(null);
    onSearch(formula);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 mb-8 border border-slate-200/80 shadow-sm">
      <form onSubmit={handleSubmit} className="w-full">
        <label htmlFor="material-input" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Material Formula or Chemical ID
        </label>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="h-5 w-5 text-crystal-500" />
            </div>
            <input
              id="material-input"
              type="text"
              value={inputVal}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="e.g. SiO2, GaAs, TiO2, Al2O3, BaTiO3, mp-149..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-crystal-400 focus:border-crystal-400 text-base font-medium shadow-sm transition"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !inputVal.trim()}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-crystal-500 to-crystal-600 hover:from-crystal-600 hover:to-crystal-700 text-white font-medium rounded-xl shadow-md shadow-crystal-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Explore Crystal</span>
              </>
            )}
          </button>
        </div>

        {validationWarning && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{validationWarning}</span>
          </div>
        )}
      </form>

      {/* Preset example chips */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-medium">Examples:</span>
        {EXAMPLE_MATERIALS.map((item) => (
          <button
            key={item.formula}
            type="button"
            onClick={() => handlePresetClick(item.formula)}
            disabled={isLoading}
            className="px-2.5 py-1 text-xs font-medium bg-slate-100/80 hover:bg-crystal-50 text-slate-600 hover:text-crystal-700 border border-slate-200/60 hover:border-crystal-300 rounded-lg transition active:scale-95"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
