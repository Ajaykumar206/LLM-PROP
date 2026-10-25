import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ExplanationResponse } from '../types/material';

interface MaterialExplanationProps {
  explanation: ExplanationResponse | null;
  isLoading: boolean;
  onRegenerate: () => void;
  crystalDescription?: string | null;
}

export const MaterialExplanation: React.FC<MaterialExplanationProps> = ({
  explanation,
  isLoading,
  onRegenerate,
  crystalDescription
}) => {
  const [showFullRaw, setShowFullRaw] = useState(false);

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-200/80">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-crystal-500 to-lavender-500 flex items-center justify-center text-white shadow-sm shadow-crystal-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              AI Scientific Property Analysis
            </h3>
            <p className="text-xs text-slate-500">
              Computational material analysis grounded strictly in DFT calculations and T5 model predictions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {explanation && (
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200/60">
              Engine: {explanation.model_used}
            </span>
          )}

          <button
            onClick={onRegenerate}
            disabled={isLoading}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:border-crystal-300 text-slate-700 hover:text-crystal-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Synthesizing...' : 'Re-analyze'}</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4 py-4 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded w-5/6"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="h-24 bg-slate-100 rounded-xl"></div>
            <div className="h-24 bg-slate-100 rounded-xl"></div>
          </div>
        </div>
      )}

      {/* T5 Model Generated Structural Summary if available */}
      {crystalDescription && (
        <div className="mb-5 p-3.5 bg-gradient-to-r from-crystal-50/80 to-lavender-50/80 rounded-xl border border-crystal-200/60">
          <div className="flex items-center gap-2 text-xs font-bold text-crystal-800 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-crystal-600" />
            <span>T5 Sequence-to-Sequence Structural Summary:</span>
          </div>
          <p className="text-xs font-medium text-slate-700">
            {crystalDescription}
          </p>
        </div>
      )}

      {/* Main explanation content */}
      {!isLoading && explanation && (
        <div className="space-y-5">
          {/* Summary Callout */}
          <div className="p-4 bg-white rounded-xl border border-crystal-200 shadow-sm">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-crystal-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-crystal-700 mb-1">
                  Executive Summary
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  {explanation.summary}
                </p>
              </div>
            </div>
          </div>

          {/* Analysis Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Crystal Structure */}
            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/60">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                <ShieldCheck className="w-4 h-4 text-crystal-600" />
                <span>Crystal Structure & Symmetry</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {explanation.crystal_structure_analysis}
              </p>
            </div>

            {/* Electronic & Physical Behavior */}
            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/60">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Electronic Transport & Properties</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {explanation.physical_and_electronic_properties}
              </p>
            </div>

            {/* Thermodynamics & Stability */}
            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/60">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Thermodynamic Stability</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {explanation.stability_and_thermodynamics}
              </p>
            </div>

            {/* Limitations & Uncertainties */}
            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/60">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Limitations & DFT Uncertainty</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {explanation.limitations_and_uncertainties}
              </p>
            </div>
          </div>

          {/* Raw Full Report Toggle */}
          {explanation.raw_markdown && (
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowFullRaw(!showFullRaw)}
                className="text-xs font-semibold text-crystal-600 hover:text-crystal-700 flex items-center gap-1 transition"
              >
                <span>{showFullRaw ? 'Collapse Detailed Report' : 'View Full Scientific Report'}</span>
                {showFullRaw ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showFullRaw && (
                <div className="mt-3 p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-sans shadow-inner">
                  {explanation.raw_markdown}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
