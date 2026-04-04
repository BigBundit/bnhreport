import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DataRow, PageQuery } from '../types';
import { formatNumber, formatPercent, formatTime, formatPosition, getTitle, isAIOQuery } from '../utils';

interface TokenModalProps {
  onClose: () => void;
}

export function TokenModal({ onClose }: TokenModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-[640px] w-full max-h-[88vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-indigo-900 text-base font-bold">🔐 วิธีรับ OAuth Access Token</h2>
          <button onClick={onClose} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-all">✕</button>
        </div>
        <ol className="list-decimal pl-5 leading-loose text-[13px]">
          <li>เปิด <a href="https://developers.google.com/oauthplayground" target="_blank" rel="noreferrer" className="text-blue-700 font-semibold hover:underline">Google OAuth Playground</a></li>
          <li>ในช่อง "Input your own scopes" ใส่:<br/>
            <div className="font-mono text-[11px] bg-slate-50 p-2 rounded-md my-1.5 leading-relaxed break-all border border-slate-100">
              https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly
            </div>
          </li>
          <li>คลิก <strong>"Authorize APIs"</strong> → เลือก Google account</li>
          <li>เลือก scope ทั้งหมด → คลิก <strong>"ดำเนินการต่อ"</strong></li>
          <li>คลิก <strong>"Exchange authorization code for tokens"</strong></li>
          <li>Copy <strong>Access token</strong> (ya29.xxx...) ใส่ในช่อง Access Token</li>
        </ol>
        <p className="mt-2.5 text-[11px] text-slate-500">⚠️ Token หมดอายุใน 1 ชั่วโมง</p>
        <div className="mt-4 flex gap-2.5">
          <a href="https://developers.google.com/oauthplayground" target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-indigo-900 text-white rounded-lg text-xs font-semibold hover:bg-indigo-800 transition-all">เปิด OAuth Playground</a>
          <button onClick={onClose} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-all">ปิด</button>
        </div>
      </div>
    </div>
  );
}

interface PageDetailModalProps {
  path: string;
  isKeyword: boolean;
  pageListActive: boolean;
  data: DataRow[];
  pageQueries?: Record<string, PageQuery[]>;
  onClose: () => void;
}

export function PageDetailModal({ path, isKeyword, pageListActive, data, pageQueries, onClose }: PageDetailModalProps) {
  const rows = useMemo(() => {
    return data.filter(r => {
      if (isKeyword) {
        return r.page.toLowerCase().includes(path.toLowerCase());
      } else if (pageListActive) {
        const np = path.toLowerCase().replace(/\/+$/, '');
        const npath = r.page.toLowerCase().replace(/\/+$/, '');
        return npath === np || npath.includes(np) || np.includes(npath);
      } else {
        return r.page === path;
      }
    });
  }, [data, path, isKeyword, pageListActive]);
  
  const title = isKeyword ? `[Keyword] ${path}` : (rows.length > 0 ? (rows[0].pageTitle || getTitle(path)) : getTitle(path));

  const chartData = useMemo(() => {
    const byD = new Map<string, any>();
    rows.forEach(r => {
      if (!byD.has(r.date)) byD.set(r.date, { date: r.date, u: 0, s: 0, v: 0, et: 0, er: 0, ke: 0, i: 0, c: 0, ct: 0, pos: 0, _ec: 0, _pc: 0, _erc: 0 });
      const v = byD.get(r.date)!;
      v.u += r.users; v.s += r.sessions; v.v += r.views; v.ke += r.keyEvents; v.i += r.impressions; v.c += r.clicks;
      if (r.engTime > 0) { v.et += r.engTime; v._ec++; }
      if (r.position > 0) { v.pos += r.position; v._pc++; }
      if (r.engRate > 0) { v.er += r.engRate; v._erc++; }
    });
    return Array.from(byD.values()).map(v => {
      if (v._ec > 0) v.et /= v._ec;
      if (v._pc > 0) v.pos /= v._pc;
      if (v._erc > 0) v.er /= v._erc;
      if (v.i > 0) v.ct = v.c / v.i;
      return v;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [rows]);

  const { keywords, aioQueries } = useMemo(() => {
    if (!pageQueries) return { keywords: [], aioQueries: [] };
    
    let kwList: PageQuery[] = [];
    if (isKeyword || pageListActive) {
      const kwMap = new Map<string, PageQuery>();
      rows.forEach(r => {
        const kws = pageQueries[r.page] || [];
        kws.forEach(kw => {
          if (!kwMap.has(kw.query)) {
            kwMap.set(kw.query, { query: kw.query, clicks: 0, impressions: 0 });
          }
          const v = kwMap.get(kw.query)!;
          v.clicks += kw.clicks;
          v.impressions += kw.impressions;
        });
      });
      kwList = Array.from(kwMap.values());
    } else {
      kwList = pageQueries[path] || [];
    }

    const kws: PageQuery[] = [];
    const aios: PageQuery[] = [];
    kwList.forEach(kw => {
      if (isAIOQuery(kw.query)) aios.push(kw);
      else kws.push(kw);
    });

    return {
      keywords: kws.sort((a, b) => b.clicks - a.clicks),
      aioQueries: aios.sort((a, b) => b.clicks - a.clicks)
    };
  }, [pageQueries, path, isKeyword, rows]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-[1400px] w-[95vw] max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h2 className="text-indigo-900 text-[14px] font-bold">📄 {title}</h2>
          <button onClick={onClose} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-all">✕ ปิด</button>
        </div>
        
        <div className="h-[180px] mb-4 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} tickMargin={5} minTickGap={15} />
              <YAxis yAxisId="left" tick={{ fontSize: 9 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Line yAxisId="left" type="monotone" dataKey="v" name="Views" stroke="#2e7d32" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
              <Line yAxisId="right" type="monotone" dataKey="c" name="Clicks" stroke="#1565c0" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 min-h-0">
          <div className="lg:col-span-2 overflow-y-auto border border-slate-100 rounded-lg custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-indigo-900 text-white sticky top-0 z-10">
                <tr>
                  <th className="p-2 font-bold text-[10px] uppercase tracking-wide whitespace-nowrap">วันที่</th>
                  <th className="p-2 font-bold text-[10px] uppercase tracking-wide text-right whitespace-nowrap">Users (GA4)</th>
                  <th className="p-2 font-bold text-[10px] uppercase tracking-wide text-right whitespace-nowrap">Sessions (GA4)</th>
                  <th className="p-2 font-bold text-[10px] uppercase tracking-wide text-right whitespace-nowrap">Views (GA4)</th>
                  <th className="p-2 font-bold text-[10px] uppercase tracking-wide text-right whitespace-nowrap">Eng.Time (GA4)</th>
                  <th className="p-2 font-bold text-[10px] uppercase tracking-wide text-right whitespace-nowrap">Eng.Rate (GA4)</th>
                  <th className="p-2 font-bold text-[10px] uppercase tracking-wide text-right whitespace-nowrap">Impressions (GSC)</th>
                  <th className="p-2 font-bold text-[10px] uppercase tracking-wide text-right whitespace-nowrap">Clicks (GSC)</th>
                  <th className="p-2 font-bold text-[10px] uppercase tracking-wide text-right whitespace-nowrap">CTR (GSC)</th>
                  <th className="p-2 font-bold text-[10px] uppercase tracking-wide text-right whitespace-nowrap">Avg Pos. (GSC)</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((r, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-1.5 whitespace-nowrap">{r.date}</td>
                    <td className="p-1.5 text-right tabular-nums">{r.u === 0 ? '–' : formatNumber(r.u)}</td>
                    <td className="p-1.5 text-right tabular-nums">{r.s === 0 ? '–' : formatNumber(r.s)}</td>
                    <td className="p-1.5 text-right tabular-nums">{r.v === 0 ? '–' : formatNumber(r.v)}</td>
                    <td className="p-1.5 text-right tabular-nums">{r.et === 0 ? '–' : formatTime(r.et)}</td>
                    <td className="p-1.5 text-right tabular-nums">{r.er === 0 ? '–' : formatPercent(r.er)}</td>
                    <td className="p-1.5 text-right tabular-nums">{r.i === 0 ? '–' : formatNumber(r.i)}</td>
                    <td className="p-1.5 text-right tabular-nums">{r.c === 0 ? '–' : formatNumber(r.c)}</td>
                    <td className="p-1.5 text-right tabular-nums">{r.ct === 0 ? '–' : formatPercent(r.ct)}</td>
                    <td className="p-1.5 text-right tabular-nums">{r.pos === 0 ? '–' : formatPosition(r.pos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lg:col-span-1 overflow-y-auto border border-slate-100 rounded-lg bg-slate-50 flex flex-col min-h-[200px] custom-scrollbar">
            <div className="bg-indigo-900 text-white p-2 font-bold text-[10px] uppercase tracking-wide sticky top-0 flex justify-between z-10">
              <span>Top Keywords</span>
              <span className="bg-blue-50 text-blue-600 px-1.5 rounded">GSC</span>
            </div>
            {keywords.length > 0 ? (
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 text-slate-600 sticky top-[32px] z-10">
                  <tr>
                    <th className="p-2 font-semibold text-[10px]">Keyword</th>
                    <th className="p-2 font-semibold text-[10px] text-right">Clicks</th>
                    <th className="p-2 font-semibold text-[10px] text-right">Imp.</th>
                  </tr>
                </thead>
                <tbody>
                  {keywords.map((kw, i) => (
                    <tr key={i} className="border-b border-slate-200 hover:bg-white">
                      <td className="p-1.5 truncate max-w-[140px]" title={kw.query}>{kw.query}</td>
                      <td className="p-1.5 text-right tabular-nums font-medium text-indigo-700">{formatNumber(kw.clicks)}</td>
                      <td className="p-1.5 text-right tabular-nums text-slate-500">{formatNumber(kw.impressions)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-4 text-center text-slate-400 text-xs">No Data</div>
            )}
          </div>

          <div className="lg:col-span-1 overflow-y-auto border border-slate-100 rounded-lg bg-slate-50 flex flex-col min-h-[200px] custom-scrollbar">
            <div className="bg-indigo-900 text-white p-2 font-bold text-[10px] uppercase tracking-wide sticky top-0 flex justify-between z-10">
              <span>Top AIO Queries</span>
              <span className="bg-purple-50 text-purple-600 px-1.5 rounded">GSC</span>
            </div>
            {aioQueries.length > 0 ? (
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 text-slate-600 sticky top-[32px] z-10">
                  <tr>
                    <th className="p-2 font-semibold text-[10px]">AIO Query</th>
                    <th className="p-2 font-semibold text-[10px] text-right">Clicks</th>
                    <th className="p-2 font-semibold text-[10px] text-right">Imp.</th>
                  </tr>
                </thead>
                <tbody>
                  {aioQueries.map((kw, i) => (
                    <tr key={i} className="border-b border-slate-200 hover:bg-white">
                      <td className="p-1.5 truncate max-w-[140px]" title={kw.query}>{kw.query}</td>
                      <td className="p-1.5 text-right tabular-nums font-medium text-purple-700">{formatNumber(kw.clicks)}</td>
                      <td className="p-1.5 text-right tabular-nums text-slate-500">{formatNumber(kw.impressions)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-4 text-center text-slate-400 text-xs">No Data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
