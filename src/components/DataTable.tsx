import React, { useState, useMemo } from 'react';
import { Search, Download, Trash2, FileText } from 'lucide-react';
import { DataRow, SortState, PageQuery } from '../types';
import { formatNumber, formatPercent, formatTime, formatPosition, isAIOQuery } from '../utils';

interface DataTableProps {
  data: DataRow[];
  pageListActive: boolean;
  pageQueries?: Record<string, PageQuery[]>;
  onShowPage: (path: string, isKeyword?: boolean) => void;
  onRemoveItem?: (path: string, isKeyword: boolean) => void;
}

export function DataTable({ data, pageListActive, pageQueries, onShowPage, onRemoveItem }: DataTableProps) {
  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState>({ field: 'users', dir: -1 });

  const filteredData = useMemo(() => {
    let d = data;
    if (search) {
      const q = search.toLowerCase();
      d = d.filter(r => (r.page || '').toLowerCase().includes(q) || (r.pageTitle || '').toLowerCase().includes(q));
    }
    return d.sort((a, b) => {
      const av = a[sort.field] || 0;
      const bv = b[sort.field] || 0;
      if (typeof av === 'string' && typeof bv === 'string') {
        return sort.dir * av.localeCompare(bv);
      }
      return sort.dir * ((av as number) - (bv as number));
    });
  }, [data, search, sort]);

  const totalPages = perPage === 0 ? 1 : Math.ceil(filteredData.length / (perPage || 1));
  const pagedData = perPage === 0 ? filteredData : filteredData.slice((page - 1) * perPage, page * perPage);

  const handleSort = (field: keyof DataRow) => {
    if (sort.field === field) setSort({ field, dir: sort.dir === 1 ? -1 : 1 });
    else setSort({ field, dir: -1 });
    setPage(1);
  };

  const handleExportCSV = () => {
    if (!filteredData.length) { alert('No data to export'); return; }
    const hdr = ['No.', 'Page', 'Page Title', 'Users', 'Sessions', 'Views', 'Avg Eng Time (s)', 'Engagement Rate', 'Key Events', 'Impressions', 'Clicks', 'CTR', 'Avg Position'];
    const rows = filteredData.map((r, i) => [
      i + 1, r.page, (r.pageTitle || '').replace(/,/g, ' '), r.users, r.sessions, r.views,
      (r.engTime || 0).toFixed(1), (r.engRate || 0).toFixed(4), r.keyEvents, r.impressions, r.clicks, (r.ctr || 0).toFixed(4), (r.position || 0).toFixed(1)
    ]);
    const csv = [hdr, ...rows].map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'BNH_Analytics_' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const SortIcon = ({ field }: { field: keyof DataRow }) => {
    if (sort.field !== field) return null;
    return <span className="ml-1 text-indigo-300">{sort.dir === -1 ? '↓' : '↑'}</span>;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden mb-6">
      <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-[16px] text-slate-900 font-bold flex items-center gap-2">
          <FileText size={20} className="text-indigo-600" /> Page Performance
          {pageListActive && <span className="text-[11px] font-bold tracking-wider uppercase bg-indigo-100 text-indigo-700 rounded-md px-2 py-1 ml-2">Filtered by List</span>}
        </h2>
        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search pages..." 
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 w-[220px] transition-all"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select 
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-all"
            value={perPage}
            onChange={e => { setPerPage(+e.target.value); setPage(1); }}
          >
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
            <option value="0">All</option>
          </select>
          <button onClick={handleExportCSV} className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[13px] font-semibold hover:bg-emerald-100 transition-all flex items-center gap-2 shadow-sm">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse text-[13px]">
          <thead className="bg-slate-50 text-slate-600 sticky top-0 z-10 border-b border-slate-200">
            <tr>
              <th className="p-3 font-semibold text-[11px] uppercase tracking-wider whitespace-nowrap text-center w-12">No.</th>
              <th className="p-3 font-semibold text-[11px] uppercase tracking-wider cursor-pointer whitespace-nowrap hover:text-indigo-600 transition-colors" onClick={() => handleSort('page')}>Page<SortIcon field="page" /></th>
              <th className="p-3 font-semibold text-[11px] uppercase tracking-wider cursor-pointer whitespace-nowrap hover:text-indigo-600 transition-colors text-right" onClick={() => handleSort('users')}>Users <span className="text-[9px] bg-slate-200 px-1 rounded ml-1">GA4</span><SortIcon field="users" /></th>
              <th className="p-3 font-semibold text-[11px] uppercase tracking-wider cursor-pointer whitespace-nowrap hover:text-indigo-600 transition-colors text-right" onClick={() => handleSort('sessions')}>Sessions <span className="text-[9px] bg-slate-200 px-1 rounded ml-1">GA4</span><SortIcon field="sessions" /></th>
              <th className="p-3 font-semibold text-[11px] uppercase tracking-wider cursor-pointer whitespace-nowrap hover:text-indigo-600 transition-colors text-right" onClick={() => handleSort('views')}>Views <span className="text-[9px] bg-slate-200 px-1 rounded ml-1">GA4</span><SortIcon field="views" /></th>
              <th className="p-3 font-semibold text-[11px] uppercase tracking-wider cursor-pointer whitespace-nowrap hover:text-indigo-600 transition-colors text-right" onClick={() => handleSort('engTime')}>Avg Eng.Time <span className="text-[9px] bg-slate-200 px-1 rounded ml-1">GA4</span><SortIcon field="engTime" /></th>
              <th className="p-3 font-semibold text-[11px] uppercase tracking-wider cursor-pointer whitespace-nowrap hover:text-indigo-600 transition-colors text-right" onClick={() => handleSort('engRate')}>Eng.Rate <span className="text-[9px] bg-slate-200 px-1 rounded ml-1">GA4</span><SortIcon field="engRate" /></th>
              <th className="p-3 font-semibold text-[11px] uppercase tracking-wider cursor-pointer whitespace-nowrap hover:text-indigo-600 transition-colors text-right" onClick={() => handleSort('keyEvents')}>Key Events <span className="text-[9px] bg-slate-200 px-1 rounded ml-1">GA4</span><SortIcon field="keyEvents" /></th>
              <th className="p-3 font-semibold text-[11px] uppercase tracking-wider cursor-pointer whitespace-nowrap hover:text-indigo-600 transition-colors text-right" onClick={() => handleSort('impressions')}>Impressions <span className="text-[9px] bg-slate-200 px-1 rounded ml-1">GSC</span><SortIcon field="impressions" /></th>
              <th className="p-3 font-semibold text-[11px] uppercase tracking-wider cursor-pointer whitespace-nowrap hover:text-indigo-600 transition-colors text-right" onClick={() => handleSort('clicks')}>Clicks <span className="text-[9px] bg-slate-200 px-1 rounded ml-1">GSC</span><SortIcon field="clicks" /></th>
              <th className="p-3 font-semibold text-[11px] uppercase tracking-wider cursor-pointer whitespace-nowrap hover:text-indigo-600 transition-colors text-right" onClick={() => handleSort('ctr')}>CTR <span className="text-[9px] bg-slate-200 px-1 rounded ml-1">GSC</span><SortIcon field="ctr" /></th>
              <th className="p-3 font-semibold text-[11px] uppercase tracking-wider cursor-pointer whitespace-nowrap hover:text-indigo-600 transition-colors text-right" onClick={() => handleSort('position')}>Avg Pos. <span className="text-[9px] bg-slate-200 px-1 rounded ml-1">GSC</span><SortIcon field="position" /></th>
              {pageListActive && onRemoveItem && <th className="p-3 font-semibold text-[11px] uppercase tracking-wider whitespace-nowrap text-center w-12">Remove</th>}
            </tr>
          </thead>
          <tbody>
            {pagedData.length === 0 ? (
              <tr><td colSpan={13} className="p-12 text-center text-slate-400 text-[13px]">{pageListActive ? 'No Data (No pages match the active list)' : 'No Data (Please enter Access Token and click "Load Data")'}</td></tr>
            ) : (
              pagedData.map((r, i) => {
                const rowIndex = (page - 1) * perPage + i + 1;
                const ec = r.engRate >= 0.6 ? 'text-emerald-700 font-medium' : r.engRate >= 0.4 ? 'text-amber-600' : 'text-rose-600';
                const pc = r.position > 0 && r.position <= 10 ? 'text-emerald-700 font-medium' : r.position <= 20 && r.position > 0 ? 'text-amber-600' : (r.position > 20 ? 'text-rose-600' : '');
                const isInList = pageListActive; // If active, all rows are in list
                const isKeyword = r.pageTitle?.startsWith('[Keyword]');
                return (
                  <tr key={i} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${isInList ? 'bg-indigo-50/30' : ''}`}>
                    <td className="p-3 whitespace-nowrap text-[12px] text-slate-400 text-center">{rowIndex}</td>
                    <td className="p-3 cursor-pointer max-w-[280px]" onClick={() => onShowPage(r.page, isKeyword)}>
                      <span className="font-semibold text-slate-800 block truncate hover:text-indigo-600 transition-colors" title={r.pageTitle}>{r.pageTitle}</span>
                      <span className="text-[11px] text-slate-500 block truncate mt-0.5" title={r.page}>{r.page}</span>
                      {pageQueries && pageQueries[r.page] && pageQueries[r.page].length > 0 && (
                        <div className="mt-2 flex flex-col gap-1.5">
                          {(() => {
                            const kws = pageQueries[r.page];
                            const aios = kws.filter(kw => isAIOQuery(kw.query)).sort((a,b) => b.clicks - a.clicks);
                            const normalKws = kws.filter(kw => !isAIOQuery(kw.query)).sort((a,b) => b.clicks - a.clicks);
                            return (
                              <>
                                {normalKws.length > 0 && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider w-6">KW:</span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100 truncate max-w-[180px]" title={`Clicks: ${normalKws[0].clicks} | Imp: ${normalKws[0].impressions}`}>
                                      {normalKws[0].query}
                                    </span>
                                    {normalKws.length > 1 && <span className="text-[10px] text-slate-400">+{normalKws.length - 1}</span>}
                                  </div>
                                )}
                                {aios.length > 0 && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider w-6">AIO:</span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-100 truncate max-w-[180px]" title={`Clicks: ${aios[0].clicks} | Imp: ${aios[0].impressions}`}>
                                      {aios[0].query}
                                    </span>
                                    {aios.length > 1 && <span className="text-[10px] text-slate-400">+{aios.length - 1}</span>}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right tabular-nums whitespace-nowrap text-slate-600">{r.users === 0 ? '–' : formatNumber(r.users)}</td>
                    <td className="p-3 text-right tabular-nums whitespace-nowrap text-slate-600">{r.sessions === 0 ? '–' : formatNumber(r.sessions)}</td>
                    <td className="p-3 text-right tabular-nums whitespace-nowrap text-slate-600">{r.views === 0 ? '–' : formatNumber(r.views)}</td>
                    <td className="p-3 text-right tabular-nums whitespace-nowrap text-slate-600">{r.engTime === 0 ? '–' : formatTime(r.engTime)}</td>
                    <td className={`p-3 text-right tabular-nums whitespace-nowrap ${ec}`}>{r.engRate === 0 ? '–' : formatPercent(r.engRate)}</td>
                    <td className="p-3 text-right tabular-nums whitespace-nowrap text-slate-600">{r.keyEvents === 0 ? '–' : formatNumber(r.keyEvents)}</td>
                    <td className="p-3 text-right tabular-nums whitespace-nowrap text-slate-600">{r.impressions === 0 ? '–' : formatNumber(r.impressions)}</td>
                    <td className="p-3 text-right tabular-nums whitespace-nowrap text-slate-600 font-medium">{r.clicks === 0 ? '–' : formatNumber(r.clicks)}</td>
                    <td className="p-3 text-right tabular-nums whitespace-nowrap text-slate-600">{r.ctr === 0 ? '–' : formatPercent(r.ctr)}</td>
                    <td className={`p-3 text-right tabular-nums whitespace-nowrap ${pc}`}>{r.position === 0 ? '–' : formatPosition(r.position)}</td>
                    {pageListActive && onRemoveItem && (
                      <td className="p-3 text-center">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onRemoveItem(r.page, isKeyword); }}
                          className="text-slate-300 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-rose-50"
                          title="Remove from List"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100 text-[12px] text-slate-500">
        <span className="font-medium">
          {filteredData.length > 0 ? `Showing ${(page - 1) * perPage + 1}–${Math.min(page * perPage, filteredData.length)} of ${filteredData.length.toLocaleString()} entries` : 'No entries found'}
        </span>
        {totalPages > 1 && perPage > 0 && (
          <div className="flex gap-1.5">
            {page > 1 && <button className="w-8 h-8 border border-slate-200 rounded-lg flex items-center justify-center bg-white hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm" onClick={() => setPage(page - 1)}>‹</button>}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              if (p > totalPages) return null;
              return (
                <button 
                  key={p} 
                  className={`w-8 h-8 border rounded-lg flex items-center justify-center transition-colors shadow-sm font-medium ${p === page ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 text-slate-600'}`}
                  onClick={() => setPage(p)}
                >{p}</button>
              );
            })}
            {page < totalPages && <button className="w-8 h-8 border border-slate-200 rounded-lg flex items-center justify-center bg-white hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm" onClick={() => setPage(page + 1)}>›</button>}
          </div>
        )}
      </div>
    </div>
  );
}
