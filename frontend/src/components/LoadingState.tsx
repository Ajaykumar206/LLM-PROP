import React from 'react';

interface LoadingStateProps {
  message?: string;
  submessage?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Searching materials database and computing crystal parameters...",
  submessage = "Retrieving verified DFT properties, parsing CIF geometry, and querying T5 model"
}) => {
  return (
    <div className="glass-panel rounded-2xl p-12 text-center my-8 flex flex-col items-center justify-center">
      <div className="relative mb-5">
        <div className="w-14 h-14 border-4 border-crystal-100 border-t-crystal-500 rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-crystal-500 rounded-full animate-ping" />
        </div>
      </div>
      <h3 className="text-base font-bold text-slate-800 mb-1">{message}</h3>
      <p className="text-xs text-slate-400 max-w-md">{submessage}</p>
    </div>
  );
};
