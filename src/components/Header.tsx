import React from 'react';
import { Activity } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white border-b border-slate-200/60 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm">
            <Activity size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-slate-900 leading-tight">BNH Hospital Analytics</h1>
            <p className="text-[11px] font-medium text-slate-500">GA4 + GSC Integration</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <div className="text-right">
            <div className="text-[12px] font-medium text-slate-900">bnhhospital.com</div>
            <div className="text-[10px] text-slate-500">Property ID: 283309066</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold">
            BN
          </div>
        </div>
      </div>
    </header>
  );
}
