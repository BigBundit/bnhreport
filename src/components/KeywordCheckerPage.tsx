import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Download, FileSearch, ExternalLink, Eye, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { getTitle, formatNumber, formatPercent, formatPosition, exportToCSV } from '../utils';

interface KwPageRow {
  pageUrl: string;
  page: string;
  title: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  site: string;
}

interface KwResult {
  keyword: string;
  rows: KwPageRow[];
  error?: string;
}

interface KeywordCheckerPageProps {
  siteUrl: string;
  proxyFetch: (service: string, url: string, method?: string, body?: any) => Promise<any>;
  onBack: () => void;
}

const CONCURRENCY = 4;
const MAX_KEYWORDS = 500;

interface SortState {
  field: string;
  dir: 1 | -1;
}

// Text columns start ascending, numeric columns start descending; clicking again flips.
function toggleSort(s: SortState, field: string, textFields: string[]): SortState {
  if (s.field === field) return { field, dir: s.dir === 1 ? -1 : 1 };
  return { field, dir: textFields.includes(field) ? 1 : -1 };
}

function sortBy<T>(rows: T[], sort: SortState): T[] {
  return [...rows].sort((a: any, b: any) => {
    const av = a[sort.field];
    const bv = b[sort.field];
    if (typeof av === 'string' || typeof bv === 'string') {
      return sort.dir * String(av ?? '').localeCompare(String(bv ?? ''), 'th');
    }
    return sort.dir * ((av ?? 0) - (bv ?? 0));
  });
}

function SortableTh({ label, field, sort, onSort, align = 'left' }: {
  label: string;
  field: string;
  sort: SortState;
  onSort: (field: string) => void;
  align?: 'left' | 'right';
}) {
  const active = sort.field === field;
  return (
    <th className={`px-4 py-2 font-semibold ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-1 uppercase tracking-wider transition-colors hover:text-indigo-600 cursor-pointer ${active ? 'text-indigo-600' : ''}`}
        title={`เรียงตาม ${label}`}
      >
        {label}
        {active
          ? (sort.dir === 1 ? <ChevronUp size={11} className="shrink-0" /> : <ChevronDown size={11} className="shrink-0" />)
          : <ChevronsUpDown size={11} className="shrink-0 opacity-40" />}
      </button>
    </th>
  );
}

export function KeywordCheckerPage({ siteUrl, proxyFetch, onBack }: KeywordCheckerPageProps) {
  const today = new Date();
  const start = new Date(today);
  start.setMonth(start.getMonth() - 3);

  const [keywordsText, setKeywordsText] = useState('');
  const [dateFrom, setDateFrom] = useState(start.toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(today.toISOString().split('T')[0]);
  const [matchMode, setMatchMode] = useState<'equals' | 'contains'>('equals');
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<KwResult[] | null>(null);
  const [detailPage, setDetailPage] = useState<KwPageRow | null>(null);
  const [sort, setSort] = useState<SortState>({ field: 'clicks', dir: -1 });

  const handleSort = (field: string) => setSort(s => toggleSort(s, field, ['title', 'page']));

  const keywordCount = keywordsText.split('\n').map(k => k.trim()).filter(Boolean).length;

  const handleSearch = async () => {
    const keywords: string[] = Array.from(new Set(keywordsText.split('\n').map(k => k.trim().toLowerCase()).filter(k => k.length > 0)));
    if (!keywords.length) {
      alert('กรุณาใส่คีย์เวิร์ดอย่างน้อย 1 คำ (บรรทัดละ 1 คำ)');
      return;
    }
    if (keywords.length > MAX_KEYWORDS) {
      alert(`รองรับสูงสุด ${MAX_KEYWORDS} คีย์เวิร์ดต่อครั้ง (ใส่มา ${keywords.length} คำ)`);
      return;
    }
    const sites = siteUrl.split(',').map(u => u.trim()).filter(Boolean);
    if (!sites.length) {
      alert('ไม่พบ GSC Site URL กรุณากลับไปตั้งค่าที่หน้าหลัก');
      return;
    }

    setIsSearching(true);
    setResults(null);
    setProgress({ done: 0, total: keywords.length });

    const out: KwResult[] = new Array(keywords.length);
    let nextIdx = 0;

    const worker = async () => {
      while (true) {
        const i = nextIdx++;
        if (i >= keywords.length) break;
        const kw = keywords[i];
        const rows: KwPageRow[] = [];
        let error: string | undefined;

        for (const site of sites) {
          try {
            const data = await proxyFetch('GSC-KwCheck', `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`, 'POST', {
              startDate: dateFrom,
              endDate: dateTo,
              dimensions: ['page'],
              dimensionFilterGroups: [{
                filters: [{ dimension: 'query', operator: matchMode, expression: kw }]
              }],
              rowLimit: 100
            });

            const B = site.replace(/\/$/, '');
            (data.rows || []).forEach((r: any) => {
              const full = r.keys?.[0] || '';
              let path = full;
              if (path.startsWith(B)) path = path.slice(B.length) || '/';
              rows.push({
                pageUrl: full,
                page: path,
                title: getTitle(path),
                clicks: r.clicks || 0,
                impressions: r.impressions || 0,
                ctr: r.ctr || 0,
                position: r.position || 0,
                site
              });
            });
          } catch (e: any) {
            error = e.message;
          }
        }

        rows.sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
        out[i] = { keyword: kw, rows, error };
        setProgress(p => ({ ...p, done: p.done + 1 }));
      }
    };

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, keywords.length) }, worker));
    setResults(out);
    setIsSearching(false);
  };

  const handleExport = () => {
    if (!results) return;
    const data: any[][] = [];
    results.forEach(r => {
      if (!r.rows.length) {
        data.push([r.keyword, r.error ? `Error: ${r.error}` : 'ไม่พบ', '', '', '', '', '']);
      } else {
        sortBy<KwPageRow>(r.rows, sort).forEach(row => {
          data.push([r.keyword, row.title, row.pageUrl, row.clicks, row.impressions, (row.ctr * 100).toFixed(2) + '%', row.position.toFixed(1)]);
        });
      }
    });
    exportToCSV(
      `BNH_Keyword_Check_${dateFrom}_${dateTo}`,
      ['Keyword', 'Page Title', 'Page URL', 'Total Clicks', 'Total Impressions', 'Avg CTR', 'Avg Position'],
      data
    );
  };

  const foundCount = results?.filter(r => r.rows.length > 0).length || 0;
  const notFoundCount = results ? results.length - foundCount : 0;

  const summarize = (rows: KwPageRow[]) => {
    const clicks = rows.reduce((s, r) => s + r.clicks, 0);
    const impressions = rows.reduce((s, r) => s + r.impressions, 0);
    const posWeight = rows.reduce((s, r) => s + r.position * r.impressions, 0);
    return {
      clicks,
      impressions,
      ctr: impressions > 0 ? clicks / impressions : 0,
      position: impressions > 0 ? posWeight / impressions : 0
    };
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-[13px] font-semibold hover:bg-slate-50 transition-all shadow-sm"
        >
          <ArrowLeft size={16} /> กลับหน้าหลัก
        </button>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <FileSearch size={20} className="text-emerald-600" /> Keyword Checker (GSC)
        </h2>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 mb-6">
        <p className="text-[13px] text-slate-500 mb-4 leading-relaxed">
          วางคีย์เวิร์ดจำนวนมาก (บรรทัดละ 1 คำ) เพื่อตรวจสอบจาก Google Search Console ว่าคำเหล่านั้นติดอันดับที่หน้าไหนของเว็บไซต์บ้าง
          พร้อมข้อมูล Clicks, Impressions, CTR และ Position ของแต่ละหน้า
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2">
            <label className="text-[11px] text-slate-500 font-semibold block mb-1.5 uppercase tracking-wider">
              Keywords ({keywordCount.toLocaleString()} คำ)
            </label>
            <textarea
              className="w-full h-48 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-y font-mono"
              value={keywordsText}
              onChange={e => setKeywordsText(e.target.value)}
              placeholder={'วัยทอง อาการ\nhpv คืออะไร\nตรวจมะเร็งปากมดลูก ราคา\n...'}
              disabled={isSearching}
            />
          </div>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 font-semibold block mb-1.5 uppercase tracking-wider">จากวันที่</label>
                <input
                  type="date"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition-all"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  disabled={isSearching}
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-semibold block mb-1.5 uppercase tracking-wider">ถึงวันที่</label>
                <input
                  type="date"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition-all"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  disabled={isSearching}
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-semibold block mb-1.5 uppercase tracking-wider">รูปแบบการจับคู่</label>
              <select
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition-all"
                value={matchMode}
                onChange={e => setMatchMode(e.target.value as 'equals' | 'contains')}
                disabled={isSearching}
              >
                <option value="equals">ตรงทุกคำ (Exact match)</option>
                <option value="contains">มีคำนี้อยู่ในคำค้น (Contains)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-semibold block mb-1.5 uppercase tracking-wider">เว็บไซต์ (จากหน้าหลัก)</label>
              <div className="text-[12px] text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono break-all">
                {siteUrl || '–'}
              </div>
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="w-full px-5 py-3 bg-emerald-600 text-white rounded-xl text-[14px] font-bold hover:bg-emerald-700 active:bg-emerald-800 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search size={16} />
              {isSearching ? `กำลังค้นหา... (${progress.done}/${progress.total})` : 'ค้นหาใน Search Console'}
            </button>
          </div>
        </div>

        {isSearching && (
          <div className="mt-5">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {results && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <h3 className="text-[15px] font-semibold text-slate-900">ผลการค้นหา</h3>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[11px] font-bold">ติดอันดับ {foundCount} คำ</span>
              {notFoundCount > 0 && (
                <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[11px] font-bold">ไม่พบ {notFoundCount} คำ</span>
              )}
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>

          <div className="flex flex-col gap-5">
            {results.map(r => {
              const sum = r.rows.length ? summarize(r.rows) : null;
              return (
                <div key={r.keyword} className="border border-slate-200/60 rounded-xl overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200/60">
                    <div className="font-semibold text-[13px] text-slate-800 flex items-center gap-2">
                      <Search size={13} className="text-emerald-600 shrink-0" />
                      {r.keyword}
                    </div>
                    {sum ? (
                      <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium">
                        <span>{r.rows.length} หน้า</span>
                        <span>Clicks: <b className="text-slate-700">{formatNumber(sum.clicks)}</b></span>
                        <span>Impressions: <b className="text-slate-700">{formatNumber(sum.impressions)}</b></span>
                        <span>CTR: <b className="text-slate-700">{formatPercent(sum.ctr)}</b></span>
                        <span>Position: <b className="text-slate-700">{formatPosition(sum.position)}</b></span>
                      </div>
                    ) : (
                      <span className="text-[11px] font-semibold text-orange-500">
                        {r.error ? `เกิดข้อผิดพลาด: ${r.error}` : 'ไม่พบหน้าที่ติดอันดับสำหรับคำนี้'}
                      </span>
                    )}
                  </div>
                  {r.rows.length > 0 && (
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="text-[10px] text-slate-400">
                          <SortableTh label="Page Title" field="title" sort={sort} onSort={handleSort} />
                          <SortableTh label="Page (URL)" field="page" sort={sort} onSort={handleSort} />
                          <SortableTh label="Total Clicks" field="clicks" sort={sort} onSort={handleSort} align="right" />
                          <SortableTh label="Total Impressions" field="impressions" sort={sort} onSort={handleSort} align="right" />
                          <SortableTh label="Avg CTR" field="ctr" sort={sort} onSort={handleSort} align="right" />
                          <SortableTh label="Avg Position" field="position" sort={sort} onSort={handleSort} align="right" />
                        </tr>
                      </thead>
                      <tbody>
                        {sortBy<KwPageRow>(r.rows, sort).map((row, i) => (
                          <tr key={`${row.pageUrl}-${i}`} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                            <td className="px-4 py-2.5 max-w-[280px]">
                              <button
                                onClick={() => setDetailPage(row)}
                                className="text-slate-800 font-medium truncate w-full text-left hover:text-indigo-600 hover:underline cursor-pointer"
                                title={`${row.title} – คลิกเพื่อดู keywords ทั้งหมดของหน้านี้`}
                              >
                                {row.title}
                              </button>
                            </td>
                            <td className="px-4 py-2.5 max-w-[340px]">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => setDetailPage(row)}
                                  className="text-indigo-600 hover:text-indigo-700 hover:underline font-mono text-[11px] truncate text-left cursor-pointer"
                                  title={`${row.pageUrl} – คลิกเพื่อดู keywords ทั้งหมดของหน้านี้`}
                                >
                                  {row.page}
                                </button>
                                <a
                                  href={row.pageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-slate-400 hover:text-indigo-600 shrink-0 transition-colors"
                                  title="เปิดหน้าเว็บจริง"
                                >
                                  <ExternalLink size={11} />
                                </a>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{formatNumber(row.clicks)}</td>
                            <td className="px-4 py-2.5 text-right text-slate-600">{formatNumber(row.impressions)}</td>
                            <td className="px-4 py-2.5 text-right text-slate-600">{formatPercent(row.ctr)}</td>
                            <td className="px-4 py-2.5 text-right text-slate-600">{formatPosition(row.position)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {detailPage && (
        <PageKeywordsModal
          row={detailPage}
          dateFrom={dateFrom}
          dateTo={dateTo}
          proxyFetch={proxyFetch}
          searchedKeywords={new Set((results || []).map(r => r.keyword))}
          onClose={() => setDetailPage(null)}
        />
      )}
    </>
  );
}

interface PageKwRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface PageKeywordsModalProps {
  row: KwPageRow;
  dateFrom: string;
  dateTo: string;
  proxyFetch: (service: string, url: string, method?: string, body?: any) => Promise<any>;
  searchedKeywords: Set<string>;
  onClose: () => void;
}

function PageKeywordsModal({ row, dateFrom, dateTo, proxyFetch, searchedKeywords, onClose }: PageKeywordsModalProps) {
  const [rows, setRows] = useState<PageKwRow[] | null>(null);
  const [error, setError] = useState('');
  const [sort, setSort] = useState<SortState>({ field: 'clicks', dir: -1 });

  const handleSort = (field: string) => setSort(s => toggleSort(s, field, ['query']));
  const sortedRows = rows ? sortBy<PageKwRow>(rows, sort) : null;

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError('');
    (async () => {
      try {
        const data = await proxyFetch('GSC-PageKw', `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(row.site)}/searchAnalytics/query`, 'POST', {
          startDate: dateFrom,
          endDate: dateTo,
          dimensions: ['query'],
          dimensionFilterGroups: [{
            filters: [{ dimension: 'page', operator: 'equals', expression: row.pageUrl }]
          }],
          rowLimit: 1000
        });
        if (cancelled) return;
        const kwRows: PageKwRow[] = (data.rows || []).map((r: any) => ({
          query: r.keys?.[0] || '',
          clicks: r.clicks || 0,
          impressions: r.impressions || 0,
          ctr: r.ctr || 0,
          position: r.position || 0
        }));
        kwRows.sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
        setRows(kwRows);
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      }
    })();
    return () => { cancelled = true; };
  }, [row.pageUrl, row.site, dateFrom, dateTo]);

  const totals = rows && rows.length ? {
    clicks: rows.reduce((s, r) => s + r.clicks, 0),
    impressions: rows.reduce((s, r) => s + r.impressions, 0)
  } : null;
  const avgCtr = totals && totals.impressions > 0 ? totals.clicks / totals.impressions : 0;
  const avgPos = rows && rows.length
    ? rows.reduce((s, r) => s + r.position * r.impressions, 0) / Math.max(1, rows.reduce((s, r) => s + r.impressions, 0))
    : 0;

  const handleExport = () => {
    if (!rows) return;
    exportToCSV(
      `BNH_Page_Keywords_${row.page.replace(/[^a-z0-9ก-๙]+/gi, '_').slice(0, 60)}_${dateFrom}_${dateTo}`,
      ['Keyword', 'Total Clicks', 'Total Impressions', 'Avg CTR', 'Avg Position'],
      sortBy<PageKwRow>(rows, sort).map(r => [r.query, r.clicks, r.impressions, (r.ctr * 100).toFixed(2) + '%', r.position.toFixed(1)])
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-[900px] w-full max-h-[88vh] shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-1 shrink-0 gap-3">
          <div className="min-w-0">
            <h2 className="text-indigo-900 text-[15px] font-bold truncate" title={row.title}>📄 {row.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-[11px] text-slate-500 truncate" title={row.pageUrl}>{row.page}</span>
              <a
                href={row.pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-semibold hover:bg-indigo-100 transition-all shrink-0"
              >
                <Eye size={12} /> ดูหน้าเว็บจริง
              </a>
            </div>
          </div>
          <button onClick={onClose} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-all shrink-0">✕</button>
        </div>
        <div className="text-[11px] text-slate-400 mb-4 shrink-0">Keywords ที่ติดอันดับในหน้านี้ • ช่วงวันที่ {dateFrom} ถึง {dateTo}</div>

        {!rows && !error && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-[13px]">
            <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
            กำลังโหลด keywords จาก Search Console...
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-[12px] font-medium">เกิดข้อผิดพลาด: {error}</div>
        )}

        {rows && rows.length === 0 && (
          <div className="text-center py-16 text-slate-400 text-[13px]">ไม่พบ keyword ที่ติดอันดับในหน้านี้ในช่วงวันที่เลือก</div>
        )}

        {rows && rows.length > 0 && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3 shrink-0">
              <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium">
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-bold">{rows.length.toLocaleString()} keywords</span>
                <span>Clicks: <b className="text-slate-700">{formatNumber(totals!.clicks)}</b></span>
                <span>Impressions: <b className="text-slate-700">{formatNumber(totals!.impressions)}</b></span>
                <span>CTR: <b className="text-slate-700">{formatPercent(avgCtr)}</b></span>
                <span>Position: <b className="text-slate-700">{formatPosition(avgPos)}</b></span>
              </div>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <Download size={14} /> Export CSV
              </button>
            </div>

            <div className="overflow-y-auto border border-slate-200/60 rounded-xl">
              <table className="w-full text-[12px]">
                <thead className="sticky top-0 bg-slate-50 z-10">
                  <tr className="text-[10px] text-slate-400">
                    <SortableTh label="Keyword" field="query" sort={sort} onSort={handleSort} />
                    <SortableTh label="Total Clicks" field="clicks" sort={sort} onSort={handleSort} align="right" />
                    <SortableTh label="Total Impressions" field="impressions" sort={sort} onSort={handleSort} align="right" />
                    <SortableTh label="Avg CTR" field="ctr" sort={sort} onSort={handleSort} align="right" />
                    <SortableTh label="Avg Position" field="position" sort={sort} onSort={handleSort} align="right" />
                  </tr>
                </thead>
                <tbody>
                  {sortedRows!.map((r, i) => (
                    <tr key={`${r.query}-${i}`} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-2 text-slate-800 font-medium">
                        <span className="flex items-center gap-2">
                          {r.query}
                          {searchedKeywords.has(r.query.toLowerCase()) && (
                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold shrink-0" title="อยู่ในรายการที่ค้นหา">ค้นหา</span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-slate-800">{formatNumber(r.clicks)}</td>
                      <td className="px-4 py-2 text-right text-slate-600">{formatNumber(r.impressions)}</td>
                      <td className="px-4 py-2 text-right text-slate-600">{formatPercent(r.ctr)}</td>
                      <td className="px-4 py-2 text-right text-slate-600">{formatPosition(r.position)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
