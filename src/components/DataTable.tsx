import React, { useState, useMemo } from 'react';
import { Search, Download, Trash2 } from 'lucide-react';
import { DataRow, SortState, PageQuery } from '../types';
import { formatNumber, formatPercent, formatTime, formatPosition } from '../utils';

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
    if (!filteredData.length) { alert('ไม่มีข้อมูล'); return; }
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
    return <span>{sort.dir === -1 ? ' ▼' : ' ▲'}</span>;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-5">
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2.5">
        <h2 className="text-[14px] text-indigo-900 font-bold flex items-center">
          📄 รายการ
          {pageListActive && <span className="text-[11px] font-semibold bg-indigo-900 text-white rounded-full px-2.5 py-0.5 ml-2">📋 กรองตาม List</span>}
        </h2>
        <div className="flex gap-2 items-center flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="ค้นหาหน้า..." 
              className="pl-8 pr-3 py-1.5 border-1.5 border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-900 w-[180px]"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select 
            className="px-2.5 py-1.5 border-1.5 border-slate-200 rounded-lg text-xs bg-slate-50 outline-none cursor-pointer"
            value={perPage}
            onChange={e => { setPerPage(+e.target.value); setPage(1); }}
          >
            <option value="25">25/หน้า</option>
            <option value="50">50/หน้า</option>
            <option value="100">100/หน้า</option>
            <option value="0">ทั้งหมด</option>
          </select>
          <button onClick={handleExportCSV} className="px-3 py-1.5 bg-green-800 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-all flex items-center gap-1.5">
            <Download size={14} /> CSV
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-indigo-900 text-white sticky top-0 z-10">
            <tr>
              <th className="p-2.5 font-bold text-[10px] uppercase tracking-wide whitespace-nowrap text-center w-12">ลำดับ</th>
              <th className="p-2.5 font-bold text-[10px] uppercase tracking-wide cursor-pointer whitespace-nowrap hover:bg-indigo-800" onClick={() => handleSort('page')}>หน้า<SortIcon field="page" /></th>
              <th className="p-2.5 font-bold text-[10px] uppercase tracking-wide cursor-pointer whitespace-nowrap hover:bg-indigo-800 text-right" onClick={() => handleSort('users')}>Users (GA4)<SortIcon field="users" /></th>
              <th className="p-2.5 font-bold text-[10px] uppercase tracking-wide cursor-pointer whitespace-nowrap hover:bg-indigo-800 text-right" onClick={() => handleSort('sessions')}>Sessions (GA4)<SortIcon field="sessions" /></th>
              <th className="p-2.5 font-bold text-[10px] uppercase tracking-wide cursor-pointer whitespace-nowrap hover:bg-indigo-800 text-right" onClick={() => handleSort('views')}>Views (GA4)<SortIcon field="views" /></th>
              <th className="p-2.5 font-bold text-[10px] uppercase tracking-wide cursor-pointer whitespace-nowrap hover:bg-indigo-800 text-right" onClick={() => handleSort('engTime')}>Avg Eng.Time (GA4)<SortIcon field="engTime" /></th>
              <th className="p-2.5 font-bold text-[10px] uppercase tracking-wide cursor-pointer whitespace-nowrap hover:bg-indigo-800 text-right" onClick={() => handleSort('engRate')}>Eng.Rate (GA4)<SortIcon field="engRate" /></th>
              <th className="p-2.5 font-bold text-[10px] uppercase tracking-wide cursor-pointer whitespace-nowrap hover:bg-indigo-800 text-right" onClick={() => handleSort('keyEvents')}>Key Events (GA4)<SortIcon field="keyEvents" /></th>
              <th className="p-2.5 font-bold text-[10px] uppercase tracking-wide cursor-pointer whitespace-nowrap hover:bg-indigo-800 text-right" onClick={() => handleSort('impressions')}>Impressions (GSC)<SortIcon field="impressions" /></th>
              <th className="p-2.5 font-bold text-[10px] uppercase tracking-wide cursor-pointer whitespace-nowrap hover:bg-indigo-800 text-right" onClick={() => handleSort('clicks')}>Clicks (GSC)<SortIcon field="clicks" /></th>
              <th className="p-2.5 font-bold text-[10px] uppercase tracking-wide cursor-pointer whitespace-nowrap hover:bg-indigo-800 text-right" onClick={() => handleSort('ctr')}>CTR (GSC)<SortIcon field="ctr" /></th>
              <th className="p-2.5 font-bold text-[10px] uppercase tracking-wide cursor-pointer whitespace-nowrap hover:bg-indigo-800 text-right" onClick={() => handleSort('position')}>Avg Pos. (GSC)<SortIcon field="position" /></th>
              {pageListActive && onRemoveItem && <th className="p-2.5 font-bold text-[10px] uppercase tracking-wide whitespace-nowrap text-center w-12">ลบ</th>}
            </tr>
          </thead>
          <tbody>
            {pagedData.length === 0 ? (
              <tr><td colSpan={13} className="p-12 text-center text-slate-400 text-[13px]">{pageListActive ? 'No Data (ไม่พบหน้าที่ตรงกับ Page List)' : 'No Data (กรุณากรอก Access Token และกด "โหลดข้อมูลจริง")'}</td></tr>
            ) : (
              pagedData.map((r, i) => {
                const rowIndex = (page - 1) * perPage + i + 1;
                const ec = r.engRate >= 0.6 ? 'text-green-800 font-semibold' : r.engRate >= 0.4 ? 'text-orange-600' : 'text-red-800';
                const pc = r.position > 0 && r.position <= 10 ? 'text-green-800 font-semibold' : r.position <= 20 && r.position > 0 ? 'text-orange-600' : (r.position > 20 ? 'text-red-800' : '');
                const isInList = pageListActive; // If active, all rows are in list
                const isKeyword = r.pageTitle?.startsWith('[Keyword]');
                return (
                  <tr key={i} className={`border-b border-slate-50 hover:bg-indigo-50/50 ${isInList ? 'bg-green-50/30' : ''}`}>
                    <td className="p-2 whitespace-nowrap text-[11px] text-slate-500 text-center">{rowIndex}</td>
                    <td className="p-2 cursor-pointer max-w-[260px]" onClick={() => onShowPage(r.page, isKeyword)}>
                      <span className="font-semibold text-indigo-900 block truncate hover:underline" title={r.pageTitle}>{r.pageTitle}</span>
                      <span className="text-[10px] text-slate-400 block truncate" title={r.page}>{r.page}</span>
                      {pageQueries && pageQueries[r.page] && pageQueries[r.page].length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {pageQueries[r.page].slice(0, 2).map((kw, idx) => (
                            <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-600 border border-slate-200 truncate max-w-[120px]" title={`Clicks: ${kw.clicks} | Imp: ${kw.impressions}`}>
                              {kw.query}
                            </span>
                          ))}
                          {pageQueries[r.page].length > 2 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-50 text-slate-400 border border-slate-100">
                              +{pageQueries[r.page].length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-2 text-right tabular-nums whitespace-nowrap">{r.users === 0 ? '–' : formatNumber(r.users)}</td>
                    <td className="p-2 text-right tabular-nums whitespace-nowrap">{r.sessions === 0 ? '–' : formatNumber(r.sessions)}</td>
                    <td className="p-2 text-right tabular-nums whitespace-nowrap">{r.views === 0 ? '–' : formatNumber(r.views)}</td>
                    <td className="p-2 text-right tabular-nums whitespace-nowrap">{r.engTime === 0 ? '–' : formatTime(r.engTime)}</td>
                    <td className={`p-2 text-right tabular-nums whitespace-nowrap ${ec}`}>{r.engRate === 0 ? '–' : formatPercent(r.engRate)}</td>
                    <td className="p-2 text-right tabular-nums whitespace-nowrap">{r.keyEvents === 0 ? '–' : formatNumber(r.keyEvents)}</td>
                    <td className="p-2 text-right tabular-nums whitespace-nowrap">{r.impressions === 0 ? '–' : formatNumber(r.impressions)}</td>
                    <td className="p-2 text-right tabular-nums whitespace-nowrap">{r.clicks === 0 ? '–' : formatNumber(r.clicks)}</td>
                    <td className="p-2 text-right tabular-nums whitespace-nowrap">{r.ctr === 0 ? '–' : formatPercent(r.ctr)}</td>
                    <td className={`p-2 text-right tabular-nums whitespace-nowrap ${pc}`}>{r.position === 0 ? '–' : formatPosition(r.position)}</td>
                    {pageListActive && onRemoveItem && (
                      <td className="p-2 text-center">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onRemoveItem(r.page, isKeyword); }}
                          className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
                          title="ลบออกจาก List"
                        >
                          <Trash2 size={14} />
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
      <div className="flex items-center justify-between px-5 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500">
        <span>
          {filteredData.length > 0 ? `แสดง ${(page - 1) * perPage + 1}–${Math.min(page * perPage, filteredData.length)} จาก ${filteredData.length.toLocaleString()} รายการ` : 'ไม่มีข้อมูล'}
        </span>
        {totalPages > 1 && perPage > 0 && (
          <div className="flex gap-1">
            {page > 1 && <button className="w-7 h-7 border-1.5 border-slate-200 rounded-md flex items-center justify-center bg-white hover:bg-indigo-900 hover:text-white hover:border-indigo-900 transition-colors" onClick={() => setPage(page - 1)}>‹</button>}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              if (p > totalPages) return null;
              return (
                <button 
                  key={p} 
                  className={`w-7 h-7 border-1.5 rounded-md flex items-center justify-center transition-colors ${p === page ? 'bg-indigo-900 text-white border-indigo-900' : 'border-slate-200 bg-white hover:bg-indigo-900 hover:text-white hover:border-indigo-900'}`}
                  onClick={() => setPage(p)}
                >{p}</button>
              );
            })}
            {page < totalPages && <button className="w-7 h-7 border-1.5 border-slate-200 rounded-md flex items-center justify-center bg-white hover:bg-indigo-900 hover:text-white hover:border-indigo-900 transition-colors" onClick={() => setPage(page + 1)}>›</button>}
          </div>
        )}
      </div>
    </div>
  );
}
