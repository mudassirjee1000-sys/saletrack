import React from "react";
import { Store, Loader2 } from "lucide-react";

export const LoadingScreen: React.FC<{ message?: string }> = ({
  message = "Loading account...",
}) => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-slate-100 p-6 selection:bg-blue-500 selection:text-white">
      <div className="flex flex-col items-center max-w-sm text-center">
        {/* Brand Icon */}
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/20 mb-6 ring-4 ring-blue-500/30">
          <Store className="w-8 h-8 text-white" />
        </div>

        {/* Loading Spinner */}
        <div className="flex items-center space-x-3 mb-3">
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          <h2 className="text-lg font-bold tracking-tight text-white">{message}</h2>
        </div>

        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          Verifying security credentials and loading your isolated business workspace...
        </p>

        {/* Brand footer */}
        <div className="mt-8 pt-4 border-t border-slate-800 text-2xs text-slate-500 tracking-wider uppercase font-semibold">
          SaleTrack Retail Engine
        </div>
      </div>
    </div>
  );
};
