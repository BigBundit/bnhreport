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
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter size={18} className="text-indigo-600" />
        <h2 className="text-[15px] text-slate-900 font-semibold">Filters</h2>
      </div>
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Country</label>
          <select 
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 min-w-[200px] cursor-pointer transition-all"
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
          <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Date Range</label>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2 items-center">
              <input 
                type="date" 
                className="w-[140px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-all"
                value={filters.dateFrom}
                onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
              />
              <span className="text-slate-400 font-medium">–</span>
              <input 
                type="date" 
                className="w-[140px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-all"
                value={filters.dateTo}
                onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
              />
            </div>
            
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            
            <div className="flex gap-1.5">
              {[ { l: '30d', v: 30 }, { l: '60d', v: 60 }, { l: '90d', v: 90 }, { l: '1y', v: 365 }, { l: '2y', v: 730 } ].map(q => (
                <button 
                  key={q.l}
                  onClick={() => {
                    const dFrom = new Date(); dFrom.setDate(dFrom.getDate() - q.v);
                    const dTo = new Date();
                    setFilters(f => ({ ...f, dateFrom: dFrom.toISOString().split('T')[0], dateTo: dTo.toISOString().split('T')[0] }));
                    setTimeout(onApply, 0);
                  }}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 rounded-lg text-[11px] font-bold transition-all shadow-sm"
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
