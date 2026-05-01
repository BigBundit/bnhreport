import React from 'react';
import { Search, Filter } from 'lucide-react';
import { FilterState } from '../types';

interface FilterSectionProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onApply: () => void;
  availableCountries: string[];
}

export function FilterSection({ filters, setFilters, onApply, availableCountries }: FilterSectionProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700 mb-6 transition-colors">
      <div className="flex items-center gap-2 mb-4">
        <Filter size={18} className="text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-[15px] text-slate-900 dark:text-white font-semibold">Filters</h2>
      </div>
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Country</label>
          <select 
            className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] text-slate-800 dark:text-slate-200 outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 min-w-[200px] cursor-pointer transition-all"
            value={filters.country}
            onChange={e => { setFilters(f => ({ ...f, country: e.target.value })); setTimeout(onApply, 0); }}
          >
            <option value="all">🌏 All Countries</option>
            {availableCountries.some(c => c.toLowerCase() !== 'thailand' && c.toLowerCase() !== 'th') && (
              <option value="intl">🌍 International (Exclude TH)</option>
            )}
            {availableCountries.some(c => c.toLowerCase() === 'thailand' || c.toLowerCase() === 'th') && (
              <option value="th">🇹🇭 Thailand</option>
            )}
            {availableCountries.length > 0 && <option disabled>──────────</option>}
            {availableCountries.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Date Range & Comparison</label>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2 items-center">
              <input 
                type="date" 
                className="w-[140px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] text-slate-800 dark:text-slate-200 outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-all"
                value={filters.dateFrom}
                onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
              />
              <span className="text-slate-400 font-medium">–</span>
              <input 
                type="date" 
                className="w-[140px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] text-slate-800 dark:text-slate-200 outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-all"
                value={filters.dateTo}
                onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
              />
            </div>
            
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
            
            <select 
              className="px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[12px] text-slate-700 dark:text-slate-200 outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-all"
              value={filters.compareMode}
              onChange={(e) => setFilters(f => ({ ...f, compareMode: e.target.value as any }))}
            >
              <option value="prev_period">vs Prev Period</option>
              <option value="prev_year">vs Prev Year</option>
              <option value="none">No Comparison</option>
            </select>
            
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
            
            <div className="flex gap-1.5">
              {[ { l: '7d', v: 7 }, { l: '14d', v: 14 }, { l: '30d (1M)', v: 30 }, { l: '90d (3M)', v: 90 }, { l: '6M', v: 180 } ].map(q => (
                <button 
                  key={q.l}
                  onClick={() => {
                    const dFrom = new Date(); dFrom.setDate(dFrom.getDate() - q.v);
                    const dTo = new Date();
                    setFilters(f => ({ ...f, dateFrom: dFrom.toISOString().split('T')[0], dateTo: dTo.toISOString().split('T')[0] }));
                    setTimeout(onApply, 0);
                  }}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-200 dark:hover:border-indigo-500/50 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg text-[11px] font-bold transition-all shadow-sm"
                >
                  {q.l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 mt-auto">
          <button onClick={onApply} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[13px] font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-all flex items-center gap-2 shadow-sm">
            <Search size={16} /> Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
