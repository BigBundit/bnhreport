import React from 'react';
import { Search } from 'lucide-react';
import { FilterState } from '../types';

interface FilterSectionProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onApply: () => void;
  availableCountries: string[];
}

export function FilterSection({ filters, setFilters, onApply, availableCountries }: FilterSectionProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm mb-5">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wide">ประเทศ</label>
          <select 
            className="px-3 py-2 border-1.5 border-slate-200 rounded-lg text-[13px] bg-slate-50 outline-none focus:border-indigo-900 min-w-[200px] cursor-pointer"
            value={filters.country}
            onChange={e => { setFilters(f => ({ ...f, country: e.target.value })); setTimeout(onApply, 0); }}
          >
            <option value="all">🌏 ทั้งหมด (All)</option>
            <option value="intl">🌍 อินเตอร์ (ไม่รวมไทย)</option>
            <option value="th">🇹🇭 ไทย (Thailand)</option>
            <option disabled>──────────</option>
            {availableCountries.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wide">ช่วงวันที่</label>
          <div className="flex gap-2 items-center">
            <input 
              type="date" 
              className="w-[130px] px-3 py-2 border-1.5 border-slate-200 rounded-lg text-[13px] outline-none focus:border-indigo-900 cursor-pointer"
              value={filters.dateFrom}
              onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
            />
            <span className="text-slate-400">–</span>
            <input 
              type="date" 
              className="w-[130px] px-3 py-2 border-1.5 border-slate-200 rounded-lg text-[13px] outline-none focus:border-indigo-900 cursor-pointer"
              value={filters.dateTo}
              onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 mt-auto">
          <button onClick={onApply} className="px-4 py-2 bg-indigo-900 text-white rounded-lg text-[13px] font-semibold hover:bg-indigo-800 transition-all flex items-center gap-2">
            <Search size={16} /> กรอง
          </button>
        </div>
      </div>
    </div>
  );
}
