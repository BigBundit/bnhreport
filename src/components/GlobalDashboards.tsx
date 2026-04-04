import React, { useMemo } from 'react';
import { DataRow, PageQuery } from '../types';
import { formatNumber } from '../utils';
import { isAIOQuery } from '../utils';

interface GlobalDashboardsProps {
  data: DataRow[];
  pageQueries: Record<string, PageQuery[]>;
}

export function GlobalDashboards({ data, pageQueries }: GlobalDashboardsProps) {
  // 1. Top Countries
  const topCountries = useMemo(() => {
    const map = new Map<string, { users: number, views: number, clicks: number }>();
    data.forEach(r => {
      if (!map.has(r.country)) map.set(r.country, { users: 0, views: 0, clicks: 0 });
      const v = map.get(r.country)!;
      v.users += r.users;
      v.views += r.views;
      v.clicks += r.clicks;
    });
    return Array.from(map.entries())
      .map(([country, metrics]) => ({ country, ...metrics }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 15);
  }, [data]);

  // 2. Top Keywords & AIO
  const { topKeywords, topAIO } = useMemo(() => {
    const kwMap = new Map<string, { clicks: number, impressions: number }>();
    const aioMap = new Map<string, { clicks: number, impressions: number }>();

    const activePages = new Set(data.map(r => r.page));

    Object.entries(pageQueries).forEach(([page, queries]) => {
      let isActive = false;
      for (const p of activePages) {
        if (p === page || page.includes(p) || p.includes(page)) {
          isActive = true;
          break;
        }
      }

      if (isActive) {
        queries.forEach(q => {
          if (isAIOQuery(q.query)) {
            if (!aioMap.has(q.query)) aioMap.set(q.query, { clicks: 0, impressions: 0 });
            aioMap.get(q.query)!.clicks += q.clicks;
            aioMap.get(q.query)!.impressions += q.impressions;
          } else {
            if (!kwMap.has(q.query)) kwMap.set(q.query, { clicks: 0, impressions: 0 });
            kwMap.get(q.query)!.clicks += q.clicks;
            kwMap.get(q.query)!.impressions += q.impressions;
          }
        });
      }
    });

    return {
      topKeywords: Array.from(kwMap.entries()).map(([q, m]) => ({ query: q, ...m })).sort((a, b) => b.clicks - a.clicks).slice(0, 15),
      topAIO: Array.from(aioMap.entries()).map(([q, m]) => ({ query: q, ...m })).sort((a, b) => b.clicks - a.clicks).slice(0, 15)
    };
  }, [data, pageQueries]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
      {/* Country Dashboard */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex flex-col h-[320px]">
        <h3 className="text-indigo-900 font-bold text-[14px] mb-3 flex justify-between items-center shrink-0">
          <span>🌍 Top Countries</span>
          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-semibold">GA4 + GSC</span>
        </h3>
        <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-white sticky top-0 z-10">
              <tr>
                <th className="py-2 font-semibold text-slate-500 border-b border-slate-100">Country</th>
                <th className="py-2 font-semibold text-slate-500 text-right border-b border-slate-100">Views</th>
                <th className="py-2 font-semibold text-slate-500 text-right border-b border-slate-100">Clicks</th>
              </tr>
            </thead>
            <tbody>
              {topCountries.length > 0 ? topCountries.map((c, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-2 capitalize truncate max-w-[120px] font-medium text-slate-700" title={c.country}>{c.country === 'all' ? 'Unknown' : c.country}</td>
                  <td className="py-2 text-right tabular-nums text-slate-600">{formatNumber(c.views)}</td>
                  <td className="py-2 text-right tabular-nums text-slate-600">{formatNumber(c.clicks)}</td>
                </tr>
              )) : (
                <tr><td colSpan={3} className="py-4 text-center text-slate-400 text-xs">No Data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Keyword Dashboard */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex flex-col h-[320px]">
        <h3 className="text-indigo-900 font-bold text-[14px] mb-3 flex justify-between items-center shrink-0">
          <span>🔑 Top Keywords</span>
          <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded font-semibold">GSC</span>
        </h3>
        <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-white sticky top-0 z-10">
              <tr>
                <th className="py-2 font-semibold text-slate-500 border-b border-slate-100">Keyword</th>
                <th className="py-2 font-semibold text-slate-500 text-right border-b border-slate-100">Clicks</th>
                <th className="py-2 font-semibold text-slate-500 text-right border-b border-slate-100">Imp.</th>
              </tr>
            </thead>
            <tbody>
              {topKeywords.length > 0 ? topKeywords.map((k, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-2 truncate max-w-[140px] font-medium text-slate-700" title={k.query}>{k.query}</td>
                  <td className="py-2 text-right tabular-nums text-indigo-600 font-semibold">{formatNumber(k.clicks)}</td>
                  <td className="py-2 text-right tabular-nums text-slate-500">{formatNumber(k.impressions)}</td>
                </tr>
              )) : (
                <tr><td colSpan={3} className="py-4 text-center text-slate-400 text-xs">No Data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AIO Dashboard */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex flex-col h-[320px]">
        <h3 className="text-indigo-900 font-bold text-[14px] mb-3 flex justify-between items-center shrink-0">
          <span>🤖 Top AIO Queries</span>
          <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-1 rounded font-semibold">GSC</span>
        </h3>
        <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-white sticky top-0 z-10">
              <tr>
                <th className="py-2 font-semibold text-slate-500 border-b border-slate-100">AIO Query</th>
                <th className="py-2 font-semibold text-slate-500 text-right border-b border-slate-100">Clicks</th>
                <th className="py-2 font-semibold text-slate-500 text-right border-b border-slate-100">Imp.</th>
              </tr>
            </thead>
            <tbody>
              {topAIO.length > 0 ? topAIO.map((k, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-2 truncate max-w-[140px] font-medium text-slate-700" title={k.query}>{k.query}</td>
                  <td className="py-2 text-right tabular-nums text-purple-600 font-semibold">{formatNumber(k.clicks)}</td>
                  <td className="py-2 text-right tabular-nums text-slate-500">{formatNumber(k.impressions)}</td>
                </tr>
              )) : (
                <tr><td colSpan={3} className="py-4 text-center text-slate-400 text-xs">No Data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
