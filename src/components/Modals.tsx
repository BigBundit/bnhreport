import React, { useMemo, useState, useEffect } from 'react';
import { ExternalLink, Eye, Activity, RefreshCw, Monitor, Smartphone, Tablet, Globe } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DataRow, PageQuery } from '../types';
import { formatNumber, formatPercent, formatTime, formatPosition, getTitle, isAIOQuery } from '../utils';

interface TokenModalProps {
  onClose: () => void;
}

export function TokenModal({ onClose }: TokenModalProps) {
  const appUrl = window.location.origin;
  const callbackUrl = `${appUrl}/auth/callback`;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-[640px] w-full max-h-[88vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-indigo-900 text-base font-bold">🛠️ การตั้งค่า Google OAuth (ถาวร)</h2>
          <button onClick={onClose} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-all">✕</button>
        </div>
        
        <div className="space-y-4 text-[13px] text-slate-700 leading-relaxed">
          <p>เพื่อให้แอปสามารถดึงข้อมูลได้ตลอดเวลาโดยไม่ต้องกรอก Token ใหม่ทุกชั่วโมง คุณต้องตั้งค่า <strong>OAuth Client ID</strong> ใน Google Cloud Console:</p>
          
          <ol className="list-decimal pl-5 space-y-2">
            <li>ไปที่ <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-blue-600 font-semibold hover:underline">Google Cloud Console</a></li>
            <li>คลิก <strong>"Create Credentials"</strong> → <strong>"OAuth client ID"</strong></li>
            <li>เลือก Application type เป็น <strong>"Web application"</strong></li>
            <li>ในส่วน <strong>"Authorized redirect URIs"</strong> ให้เพิ่ม URL นี้:<br/>
              <code className="block bg-slate-50 p-2 rounded border border-slate-200 mt-1 font-mono text-[11px] break-all select-all">{callbackUrl}</code>
            </li>
            <li>คลิก <strong>"Create"</strong> แล้วคุณจะได้ <strong>Client ID</strong> และ <strong>Client Secret</strong></li>
            <li>นำค่าที่ได้ไปใส่ใน <strong>Environment Variables</strong> ของแอปนี้ (ในเมนู Settings):
              <ul className="list-disc pl-5 mt-1 text-slate-500">
                <li><code>GOOGLE_CLIENT_ID</code></li>
                <li><code>GOOGLE_CLIENT_SECRET</code></li>
              </ul>
            </li>
          </ol>

          <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-[12px] text-amber-800">
            <strong>หมายเหตุ:</strong> หลังจากตั้งค่าเสร็จแล้ว ให้กดปุ่ม <strong>"Login with Google"</strong> เพื่อเริ่มใช้งานครั้งแรก ระบบจะจำสิทธิ์ไว้ตลอดไปครับ
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-all shadow-sm">เข้าใจแล้ว</button>
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
  pageQueries: Record<string, PageQuery[]>;
  countryFilter?: string;
  siteUrl: string;
  onClose: () => void;
}

export function PageDetailModal({ path, isKeyword, pageListActive, data, pageQueries, countryFilter = 'all', siteUrl, onClose }: PageDetailModalProps) {
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
      if (!byD.has(r.date)) byD.set(r.date, { date: r.date, u: 0, s: 0, v: 0, et: 0, er: 0, i: 0, c: 0, ct: 0, pos: 0, _ec: 0, _pc: 0, _erc: 0 });
      const v = byD.get(r.date)!;
      v.u += r.users; v.s += r.sessions; v.v += r.views; v.i += r.impressions; v.c += r.clicks;
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

  const trafficData = useMemo(() => {
    const map = new Map<string, any>();
    rows.forEach(r => {
      if (!r.source && !r.medium && !r.campaign) return;
      const key = `${r.source || '(not set)'} / ${r.medium || '(not set)'} / ${r.campaign || '(not set)'}`;
      if (!map.has(key)) {
        map.set(key, { key, users: 0, views: 0, sessions: 0, engTime: 0, _ec: 0 });
      }
      const v = map.get(key)!;
      v.users += r.users;
      v.views += r.views;
      v.sessions += r.sessions;
      if (r.engTime > 0) { v.engTime += r.engTime; v._ec++; }
    });
    return Array.from(map.values())
      .map(v => {
        if (v._ec > 0) v.engTime /= v._ec;
        return v;
      })
      .filter(v => v.users > 0 || v.views > 0 || v.sessions > 0)
      .sort((a, b) => b.users - a.users);
  }, [rows]);

  const { keywords, aioQueries } = useMemo(() => {
    if (!pageQueries) return { keywords: [], aioQueries: [] };
    
    let kwList: PageQuery[] = [];
    if (isKeyword || pageListActive) {
      const kwMap = new Map<string, PageQuery>();
      rows.forEach(r => {
        const kws = pageQueries[r.page] || [];
        kws.forEach(kw => {
          if (countryFilter !== 'all') {
            const c = (kw.country || '').toLowerCase();
            const isThai = c === 'th' || c === 'thailand' || c === 'ไทย' || c === 'tha';
            if (countryFilter === 'th' && !isThai) return;
            if (countryFilter === 'intl' && isThai) return;
            if (countryFilter !== 'th' && countryFilter !== 'intl' && c !== countryFilter) return;
          }
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
      const kws = pageQueries[path] || [];
      const kwMap = new Map<string, PageQuery>();
      kws.forEach(kw => {
        if (countryFilter !== 'all') {
          const c = (kw.country || '').toLowerCase();
          const isThai = c === 'th' || c === 'thailand' || c === 'ไทย' || c === 'tha';
          if (countryFilter === 'th' && !isThai) return;
          if (countryFilter === 'intl' && isThai) return;
          if (countryFilter !== 'th' && countryFilter !== 'intl' && c !== countryFilter) return;
        }
        if (!kwMap.has(kw.query)) {
          kwMap.set(kw.query, { query: kw.query, clicks: 0, impressions: 0 });
        }
        const v = kwMap.get(kw.query)!;
        v.clicks += kw.clicks;
        v.impressions += kw.impressions;
      });
      kwList = Array.from(kwMap.values());
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
  }, [pageQueries, path, isKeyword, rows, countryFilter]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-[1400px] w-[95vw] max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-indigo-900 text-[14px] font-bold">📄 {title}</h2>
            {!isKeyword && (
              <a 
                href={`${siteUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : '/' + path}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-all"
                title="เปิดหน้าเว็บนี้"
              >
                <Eye size={14} /> ดูหน้าเว็บจริง
              </a>
            )}
          </div>
          <button onClick={onClose} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-all">✕ ปิด</button>
        </div>
        
        <div className="h-[180px] mb-4 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} tickMargin={5} minTickGap={15} />
              <YAxis yAxisId="left" tick={{ fontSize: 9 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value: number) => value.toLocaleString()} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Line yAxisId="left" type="monotone" dataKey="v" name="Views" stroke="#2e7d32" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
              <Line yAxisId="right" type="monotone" dataKey="c" name="Clicks" stroke="#1565c0" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="overflow-y-auto border border-slate-100 rounded-lg custom-scrollbar min-h-[160px] max-h-[240px] mb-5 shrink-0">
          <div className="bg-emerald-900 text-white p-2 font-bold text-[10px] uppercase tracking-wide sticky top-0 z-10 flex justify-between">
            <span>Traffic source | Session source / medium / campaign</span>
            <span className="bg-emerald-800 text-emerald-100 px-1.5 rounded">GA4</span>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 text-slate-600 sticky top-[32px] z-10">
              <tr>
                <th className="p-2 font-semibold text-[10px]">Source / Medium / Campaign</th>
                <th className="p-2 font-semibold text-[10px] text-right">Active Users</th>
                <th className="p-2 font-semibold text-[10px] text-right">Views</th>
                <th className="p-2 font-semibold text-[10px] text-right">Sessions</th>
                <th className="p-2 font-semibold text-[10px] text-right">Avg. Eng. Time / User</th>
              </tr>
            </thead>
            <tbody>
              {trafficData.map((d, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="p-1.5 whitespace-nowrap font-medium text-slate-700">{d.key}</td>
                  <td className="p-1.5 text-right tabular-nums text-emerald-700 font-medium">{formatNumber(d.users)}</td>
                  <td className="p-1.5 text-right tabular-nums">{formatNumber(d.views)}</td>
                  <td className="p-1.5 text-right tabular-nums">{formatNumber(d.sessions)}</td>
                  <td className="p-1.5 text-right tabular-nums">{formatTime(d.engTime)}</td>
                </tr>
              ))}
              {trafficData.length === 0 && (
                <tr><td colSpan={5} className="p-4 text-center text-slate-400 text-[11px]">No Traffic Data</td></tr>
              )}
            </tbody>
          </table>
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

interface RealtimeModalProps {
  propId: string;
  isAuthenticated: boolean;
  onClose: () => void;
}

export function RealtimeModal({ propId, isAuthenticated, onClose }: RealtimeModalProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = async () => {
    if (!isAuthenticated) {
      setError('กรุณาเข้าสู่ระบบก่อน');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/fetch-data/GA4-Realtime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: `https://analyticsdata.googleapis.com/v1beta/properties/${propId}:runRealtimeReport`,
          method: 'POST',
          body: {
            dimensions: [{ name: 'unifiedScreenName' }, { name: 'deviceCategory' }, { name: 'country' }],
            metrics: [{ name: 'activeUsers' }]
          }
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || res.statusText);
      }
      const json = await res.json();
      const rows = (json.rows || []).map((r: any) => ({
        page: r.dimensionValues[0].value,
        device: r.dimensionValues[1].value,
        country: r.dimensionValues[2].value,
        users: parseInt(r.metricValues[0].value, 10)
      })).sort((a: any, b: any) => b.users - a.users);
      setData(rows);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [propId, isAuthenticated]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-[800px] w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Activity size={20} />
            </div>
            <div>
              <h2 className="text-slate-900 text-[16px] font-bold flex items-center gap-2">
                ผู้ใช้งานที่กำลังออนไลน์
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                อัปเดตล่าสุด: {lastUpdated.toLocaleTimeString()}
                <button onClick={fetchData} className="hover:text-indigo-600 transition-colors ml-1" title="รีเฟรช">
                  <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                </button>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-all">✕ ปิด</button>
        </div>

        <div className="overflow-y-auto border border-slate-100 rounded-lg custom-scrollbar min-h-[300px] relative">
          {loading && data.length === 0 ? (
             <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
               <RefreshCw size={24} className="animate-spin text-rose-500" />
             </div>
          ) : error ? (
             <div className="p-8 text-center text-rose-600 text-[13px]">{error}</div>
          ) : data.length === 0 ? (
             <div className="p-8 text-center text-slate-400 text-[13px]">ไม่มีผู้ใช้งานออนไลน์ในขณะนี้</div>
          ) : (
            <table className="w-full text-left border-collapse text-[13px] table-fixed">
              <thead className="bg-slate-50 text-slate-600 sticky top-0 z-10 border-b border-slate-200 shadow-sm">
                <tr>
                  <th className="p-3 font-semibold text-[11px] uppercase tracking-wider">หน้าเว็บ (Page Title)</th>
                  <th className="p-3 font-semibold text-[11px] uppercase tracking-wider w-[110px]">อุปกรณ์</th>
                  <th className="p-3 font-semibold text-[11px] uppercase tracking-wider w-[130px]">ประเทศ</th>
                  <th className="p-3 font-semibold text-[11px] uppercase tracking-wider text-right w-[100px]">Active Users</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-800 font-medium">
                      <div className="line-clamp-2" title={r.page}>{r.page}</div>
                    </td>
                    <td className="p-3 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        {r.device.toLowerCase() === 'desktop' ? <Monitor size={14} className="shrink-0" /> : r.device.toLowerCase() === 'mobile' ? <Smartphone size={14} className="shrink-0" /> : <Tablet size={14} className="shrink-0" />}
                        <span className="capitalize truncate">{r.device}</span>
                      </div>
                    </td>
                    <td className="p-3 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Globe size={14} className="shrink-0" />
                        <span className="truncate" title={r.country}>{r.country}</span>
                      </div>
                    </td>
                    <td className="p-3 text-right tabular-nums font-bold text-rose-600">{r.users}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
