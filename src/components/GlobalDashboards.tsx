import React, { useMemo } from 'react';
import { DataRow, PageQuery } from '../types';
import { formatNumber, formatPercent } from '../utils';
import { isAIOQuery } from '../utils';
import { Globe, Key, Bot, Users, Plane, MapPin } from 'lucide-react';

interface GlobalDashboardsProps {
  data: DataRow[];
  pageQueries: Record<string, PageQuery[]>;
}

export function GlobalDashboards({ data, pageQueries }: GlobalDashboardsProps) {
  // 1. Audience Stats (Thai vs Inter)
  const audienceStats = useMemo(() => {
    let totalViews = 0;
    let thaiViews = 0;
    
    data.forEach(r => {
      totalViews += r.views;
      const c = r.country.toLowerCase();
      if (c === 'th' || c === 'thailand' || c === 'ไทย') {
        thaiViews += r.views;
      }
    });

    const interViews = totalViews - thaiViews;
    const interPercent = totalViews > 0 ? interViews / totalViews : 0;
    const thaiPercent = totalViews > 0 ? thaiViews / totalViews : 0;

    return { totalViews, thaiViews, interViews, interPercent, thaiPercent };
  }, [data]);

  // 2. Top Countries
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
      .map(([country, metrics]) => ({ 
        country, 
        ...metrics,
        viewPercent: audienceStats.totalViews > 0 ? metrics.views / audienceStats.totalViews : 0
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 15);
  }, [data, audienceStats.totalViews]);

  // 3. Top Keywords & AIO
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
    <>
      {/* Audience Overview Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/60 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <Users size={24} className="text-blue-600" />
          </div>
          <div>
            <div className="text-[12px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Total Views (All)</div>
            <div className="text-2xl font-bold text-slate-900">{formatNumber(audienceStats.totalViews)}</div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/60 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
            <MapPin size={24} className="text-emerald-600" />
          </div>
          <div className="flex-1">
            <div className="text-[12px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Thailand Traffic</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{formatPercent(audienceStats.thaiPercent)}</span>
              <span className="text-[13px] text-slate-500">({formatNumber(audienceStats.thaiViews)} views)</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/60 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
            <Plane size={24} className="text-indigo-600" />
          </div>
          <div className="flex-1">
            <div className="text-[12px] text-slate-500 font-semibold uppercase tracking-wider mb-1">International Traffic</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-indigo-700">{formatPercent(audienceStats.interPercent)}</span>
              <span className="text-[13px] text-slate-500">({formatNumber(audienceStats.interViews)} views)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Country Dashboard */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/60 flex flex-col h-[340px]">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="text-slate-900 font-semibold text-[15px] flex items-center gap-2">
              <Globe size={18} className="text-emerald-600" /> Top Countries
            </h3>
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 bg-slate-100 px-2 py-1 rounded-md">GA4 + GSC</span>
          </div>
          <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-white sticky top-0 z-10">
                <tr>
                  <th className="py-2 font-semibold text-slate-500 border-b border-slate-100">Country</th>
                  <th className="py-2 font-semibold text-slate-500 text-right border-b border-slate-100">Views</th>
                  <th className="py-2 font-semibold text-slate-500 text-right border-b border-slate-100">% Total</th>
                </tr>
              </thead>
              <tbody>
                {topCountries.length > 0 ? topCountries.map((c, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 capitalize truncate max-w-[120px] font-medium text-slate-700" title={c.country}>{c.country === 'all' ? 'Unknown' : c.country}</td>
                    <td className="py-2.5 text-right tabular-nums text-slate-600">{formatNumber(c.views)}</td>
                    <td className="py-2.5 text-right tabular-nums text-emerald-600 font-medium">{formatPercent(c.viewPercent)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={3} className="py-6 text-center text-slate-400 text-xs">No Data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Keyword Dashboard */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/60 flex flex-col h-[340px]">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="text-slate-900 font-semibold text-[15px] flex items-center gap-2">
              <Key size={18} className="text-indigo-600" /> Top Keywords
            </h3>
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 bg-slate-100 px-2 py-1 rounded-md">GSC</span>
          </div>
          <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-white sticky top-0 z-10">
                <tr>
                  <th className="py-2 font-semibold text-slate-500 border-b border-slate-100">Keyword</th>
                  <th className="py-2 font-semibold text-slate-500 text-right border-b border-slate-100">Clicks</th>
                  <th className="py-2 font-semibold text-slate-500 text-right border-b border-slate-100">Imp.</th>
                </tr>
              </thead>
              <tbody>
                {topKeywords.length > 0 ? topKeywords.map((k, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 truncate max-w-[140px] font-medium text-slate-700" title={k.query}>{k.query}</td>
                    <td className="py-2.5 text-right tabular-nums text-indigo-600 font-semibold">{formatNumber(k.clicks)}</td>
                    <td className="py-2.5 text-right tabular-nums text-slate-500">{formatNumber(k.impressions)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={3} className="py-6 text-center text-slate-400 text-xs">No Data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* AIO Dashboard */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/60 flex flex-col h-[340px]">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="text-slate-900 font-semibold text-[15px] flex items-center gap-2">
              <Bot size={18} className="text-purple-600" /> Top AIO Queries
            </h3>
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 bg-slate-100 px-2 py-1 rounded-md">GSC</span>
          </div>
          <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-white sticky top-0 z-10">
                <tr>
                  <th className="py-2 font-semibold text-slate-500 border-b border-slate-100">AIO Query</th>
                  <th className="py-2 font-semibold text-slate-500 text-right border-b border-slate-100">Clicks</th>
                  <th className="py-2 font-semibold text-slate-500 text-right border-b border-slate-100">Imp.</th>
                </tr>
              </thead>
              <tbody>
                {topAIO.length > 0 ? topAIO.map((k, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 truncate max-w-[140px] font-medium text-slate-700" title={k.query}>{k.query}</td>
                    <td className="py-2.5 text-right tabular-nums text-purple-600 font-semibold">{formatNumber(k.clicks)}</td>
                    <td className="py-2.5 text-right tabular-nums text-slate-500">{formatNumber(k.impressions)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={3} className="py-6 text-center text-slate-400 text-xs">No Data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
