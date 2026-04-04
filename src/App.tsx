import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { AuthSection } from './components/AuthSection';
import { PageListSection } from './components/PageListSection';
import { FilterSection } from './components/FilterSection';
import { SummaryCards } from './components/SummaryCards';
import { ChartsSection } from './components/ChartsSection';
import { GlobalDashboards } from './components/GlobalDashboards';
import { DataTable } from './components/DataTable';
import { TokenModal, PageDetailModal } from './components/Modals';
import { DataRow, PageListEntry, FilterState, StatusState, PageQuery } from './types';
import { getTitle } from './utils';

export default function App() {
  const [allData, setAllData] = useState<DataRow[]>([]);
  const [pageQueries, setPageQueries] = useState<Record<string, PageQuery[]>>({});
  const [filteredData, setFilteredData] = useState<DataRow[]>([]);
  const [prevFilteredData, setPrevFilteredData] = useState<DataRow[]>([]);
  const [tableData, setTableData] = useState<DataRow[]>([]);
  
  const [propId, setPropId] = useState('283309066');
  const [siteUrl, setSiteUrl] = useState('https://www.bnhhospital.com/');
  const [token, setToken] = useState('');
  
  const [pageList, setPageList] = useState<PageListEntry[]>([]);
  const [pageListActive, setPageListActive] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    country: 'all',
    dateFrom: '',
    dateTo: ''
  });
  
  const [status, setStatus] = useState<StatusState>({ msg: '', type: 'info', visible: false });
  const [modals, setModals] = useState({ tokenHelp: false, pageDetail: null as string | null });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);

  const availableCountries = useMemo(() => {
    const set = new Set<string>();
    allData.forEach(r => {
      if (r.country && r.country !== 'Unknown') set.add(r.country);
    });
    return Array.from(set).sort();
  }, [allData]);

  useEffect(() => {
    const today = new Date();
    const to = today.toISOString().split('T')[0];
    const s = new Date(today);
    s.setMonth(s.getMonth() - 1);
    const from = s.toISOString().split('T')[0];
    setFilters(f => ({ ...f, dateFrom: from, dateTo: to }));
  }, []);

  const showStatus = (msg: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    setStatus({ msg, type, visible: true });
  };

  const matchPageList = useCallback((path: string) => {
    if (!pageListActive || !pageList.length) return true;
    return pageList.some(p => {
      if (p.type === 'url') {
        const np = p.path.toLowerCase().replace(/\/+$/, '') || '/';
        const npath = path.toLowerCase().replace(/\/+$/, '') || '/';
        return npath === np;
      } else {
        return path.toLowerCase().includes(p.path.toLowerCase());
      }
    });
  }, [pageList, pageListActive]);

  const applyFilters = useCallback(() => {
    const { country, dateFrom, dateTo } = filters;
    
    let prevDateFromStr = '';
    let prevDateToStr = '';
    if (dateFrom && dateTo) {
      const dFrom = new Date(dateFrom);
      const dTo = new Date(dateTo);
      const diffTime = Math.abs(dTo.getTime() - dFrom.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const pTo = new Date(dFrom);
      pTo.setDate(pTo.getDate() - 1);
      
      const pFrom = new Date(pTo);
      pFrom.setDate(pFrom.getDate() - diffDays);
      
      prevDateFromStr = pFrom.toISOString().split('T')[0];
      prevDateToStr = pTo.toISOString().split('T')[0];
    }

    const filterLogic = (r: DataRow, from: string, to: string) => {
      if (from && r.date < from) return false;
      if (to && r.date > to) return false;
      if (country === 'all') return true;
      const isTh = r.country === 'Thailand' || r.country === 'TH' || r.country === 'th';
      if (country === 'intl') return !isTh;
      if (country === 'th') return isTh;
      return r.country === country;
    };

    // 1. Filter by time and country
    const timeFiltered = allData.filter(r => filterLogic(r, dateFrom, dateTo));
    const prevTimeFiltered = allData.filter(r => filterLogic(r, prevDateFromStr, prevDateToStr));

    // 2. Filter by page list for charts and summary
    const pageFiltered = timeFiltered.filter(r => matchPageList(r.page));
    const prevPageFiltered = prevTimeFiltered.filter(r => matchPageList(r.page));
    
    setFilteredData(pageFiltered);
    setPrevFilteredData(prevPageFiltered);

    // 3. Aggregate for table
    const agg = new Map<string, DataRow & { _ec: number; _pc: number; _erc: number }>();

    if (pageListActive && pageList.length > 0) {
      pageList.forEach(p => {
        const k = p.type === 'keyword' ? `keyword:${p.path.toLowerCase()}` : `url:${p.path.toLowerCase().replace(/\/+$/, '') || '/'}`;
        if (!agg.has(k)) {
          agg.set(k, {
            date: '', 
            page: p.path,
            pageTitle: p.title || (p.type === 'keyword' ? `[Keyword] ${p.path}` : getTitle(p.path)),
            country: 'all',
            users: 0, sessions: 0, views: 0, engTime: 0, engRate: 0, keyEvents: 0,
            impressions: 0, clicks: 0, ctr: 0, position: 0, _ec: 0, _pc: 0, _erc: 0
          });
        }
      });

      timeFiltered.forEach(r => {
        pageList.forEach(p => {
          let isMatch = false;
          if (p.type === 'url') {
            const np = p.path.toLowerCase().replace(/\/+$/, '') || '/';
            const npath = r.page.toLowerCase().replace(/\/+$/, '') || '/';
            isMatch = npath === np;
          } else {
            isMatch = r.page.toLowerCase().includes(p.path.toLowerCase());
          }

          if (isMatch) {
            const k = p.type === 'keyword' ? `keyword:${p.path.toLowerCase()}` : `url:${p.path.toLowerCase().replace(/\/+$/, '') || '/'}`;
            const v = agg.get(k)!;
            v.users += r.users; v.sessions += r.sessions; v.views += r.views; v.keyEvents += r.keyEvents;
            v.impressions += r.impressions; v.clicks += r.clicks;
            if (r.engTime > 0) { v.engTime += r.engTime; v._ec++; }
            if (r.position > 0) { v.position += r.position; v._pc++; }
            if (r.engRate > 0) { v.engRate += r.engRate; v._erc++; }
          }
        });
      });
    } else {
      pageFiltered.forEach(r => {
        const k = r.page;
        if (!agg.has(k)) {
          agg.set(k, {
            date: '',
            page: r.page,
            pageTitle: r.pageTitle || getTitle(r.page),
            country: 'all',
            users: 0, sessions: 0, views: 0, engTime: 0, engRate: 0, keyEvents: 0,
            impressions: 0, clicks: 0, ctr: 0, position: 0, _ec: 0, _pc: 0, _erc: 0
          });
        }
        const v = agg.get(k)!;
        v.users += r.users; v.sessions += r.sessions; v.views += r.views; v.keyEvents += r.keyEvents;
        v.impressions += r.impressions; v.clicks += r.clicks;
        if (r.engTime > 0) { v.engTime += r.engTime; v._ec++; }
        if (r.position > 0) { v.position += r.position; v._pc++; }
        if (r.engRate > 0) { v.engRate += r.engRate; v._erc++; }
      });
    }

    const finalTableData = Array.from(agg.values()).map(v => {
      if (v._ec > 0) v.engTime /= v._ec;
      if (v._pc > 0) v.position /= v._pc;
      if (v._erc > 0) v.engRate /= v._erc;
      if (v.impressions > 0) v.ctr = v.clicks / v.impressions;
      return v;
    });

    setTableData(finalTableData);
  }, [allData, filters, matchPageList]);

  useEffect(() => {
    applyFilters();
  }, [allData, filters, pageListActive, applyFilters]);

  const handleLoadData = async () => {
    if (!token.trim()) {
      showStatus('⚠️ กรุณากรอก Access Token', 'warn');
      return;
    }
    setIsLoading(true);
    setLoadingProgress(10);
    setLoadingMsg('กำลังโหลดข้อมูล GA4...');
    showStatus('⏳ กำลังโหลดข้อมูล GA4...', 'info');
    try {
      const today = new Date();
      const start = new Date(today);
      start.setMonth(start.getMonth() - 6);
      const sDate = start.toISOString().split('T')[0];
      const eDate = today.toISOString().split('T')[0];

      const gaRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propId}:runReport`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRanges: [{ startDate: sDate, endDate: eDate }],
          dimensions: [{ name: 'date' }, { name: 'pagePath' }, { name: 'country' }],
          metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }, { name: 'averageSessionDuration' }, { name: 'engagementRate' }, { name: 'keyEvents' }],
          limit: 50000
        })
      });
      if (!gaRes.ok) throw new Error(`GA4: ${(await gaRes.json()).error?.message || gaRes.status}`);
      const gaData = await gaRes.json();
      const gaRows = (gaData.rows || []).map((r: any) => {
        const [yr, mo, dy] = r.dimensionValues[0].value.match(/(.{4})(.{2})(.{2})/).slice(1);
        return {
          date: `${yr}-${mo}-${dy}`, page: r.dimensionValues[1].value, country: r.dimensionValues[2].value,
          users: +r.metricValues[0].value, sessions: +r.metricValues[1].value, views: +r.metricValues[2].value,
          engTime: +r.metricValues[3].value, engRate: +r.metricValues[4].value, keyEvents: +r.metricValues[5].value,
          impressions: 0, clicks: 0, ctr: 0, position: 0
        };
      });

      setLoadingProgress(40);
      setLoadingMsg(`กำลังโหลด Search Console... (GA4: ${gaRows.length.toLocaleString()} rows)`);
      showStatus(`⏳ กำลังโหลด Search Console... (GA4: ${gaRows.length.toLocaleString()} rows)`, 'info');

      const gscRes = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: sDate, endDate: eDate,
          dimensions: ['date', 'page', 'country'], rowLimit: 25000
        })
      });
      if (!gscRes.ok) throw new Error(`GSC: ${(await gscRes.json()).error?.message || gscRes.status}`);
      const gscData = await gscRes.json();
      const B = siteUrl.replace(/\/$/, '');
      const gscRows = (gscData.rows || []).map((r: any) => {
        let pg = r.keys[1] || '';
        if (pg.startsWith(B)) pg = pg.slice(B.length) || '/';
        return {
          date: r.keys[0], page: pg, country: (r.keys[2] || '').toLowerCase(),
          impressions: r.impressions || 0, clicks: r.clicks || 0, ctr: r.ctr || 0, position: r.position || 0
        };
      });

      const map = new Map<string, DataRow>();
      gaRows.forEach((r: any) => map.set(`${r.date}|${r.page}|${r.country}`, { ...r }));
      gscRows.forEach((r: any) => {
        const pk = `${r.date}|${r.page}`;
        let found = false;
        for (let [k, v] of map) {
          if (k.startsWith(pk)) {
            v.impressions += r.impressions; v.clicks += r.clicks;
            if (v.impressions > 0) v.ctr = v.clicks / v.impressions;
            if (r.position > 0) v.position = v.position ? ((v.position + r.position) / 2) : r.position;
            found = true; break;
          }
        }
        if (!found) map.set(`${pk}|${r.country}_g`, {
          date: r.date, page: r.page, country: r.country,
          users: 0, sessions: 0, views: 0, engTime: 0, engRate: 0, keyEvents: 0,
          impressions: r.impressions, clicks: r.clicks, ctr: r.ctr, position: r.position
        });
      });

      const merged = Array.from(map.values());
      setAllData(merged);

      setLoadingProgress(70);
      setLoadingMsg(`กำลังโหลด Keywords จาก Search Console...`);
      showStatus(`⏳ กำลังโหลด Keywords จาก Search Console...`, 'info');
      const gscKwRes = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: sDate, endDate: eDate,
          dimensions: ['page', 'query'], rowLimit: 25000
        })
      });
      if (!gscKwRes.ok) throw new Error(`GSC Keywords: ${(await gscKwRes.json()).error?.message || gscKwRes.status}`);
      const gscKwData = await gscKwRes.json();
      const kwMap: Record<string, PageQuery[]> = {};
      (gscKwData.rows || []).forEach((r: any) => {
        let pg = r.keys[0] || '';
        if (pg.startsWith(B)) pg = pg.slice(B.length) || '/';
        if (!kwMap[pg]) kwMap[pg] = [];
        kwMap[pg].push({ query: r.keys[1], clicks: r.clicks || 0, impressions: r.impressions || 0 });
      });
      setPageQueries(kwMap);

      setLoadingProgress(100);
      showStatus(`✅ โหลดสำเร็จ ${merged.length.toLocaleString()} รายการ (GA4+GSC)`, 'success');
      
      // Small delay to show 100% before hiding
      setTimeout(() => {
        setIsLoading(false);
        setLoadingProgress(0);
      }, 500);
    } catch (e: any) {
      showStatus(`❌ ${e.message}`, 'error');
      console.error(e);
      setIsLoading(false);
      setLoadingProgress(0);
    }
  };

  const statusColors = {
    info: 'bg-blue-50 text-blue-800',
    success: 'bg-green-50 text-green-800',
    warn: 'bg-orange-50 text-orange-800',
    error: 'bg-red-50 text-red-800'
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-10">
      <Header />
      
      <div className="p-6 md:px-8 max-w-[1600px] mx-auto">
        <AuthSection 
          propId={propId} setPropId={setPropId}
          siteUrl={siteUrl} setSiteUrl={setSiteUrl}
          token={token} setToken={setToken}
          onLoadData={handleLoadData}
          onShowTokenHelp={() => setModals(m => ({ ...m, tokenHelp: true }))}
        />

        {status.visible && (
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold mb-4 ${statusColors[status.type]}`}>
            <div className="w-2 h-2 rounded-full bg-current shrink-0" />
            {status.msg}
          </div>
        )}

        <PageListSection 
          pageList={pageList} setPageList={setPageList}
          pageListActive={pageListActive}
          onApplyFilter={() => {
            if (!pageList.length) { alert('กรุณาเพิ่ม URL หรือ keyword ใน Page List ก่อน'); return; }
            setPageListActive(true);
            showStatus(`📋 กรองข้อมูลตาม Page List ${pageList.length} รายการ`, 'info');
          }}
          onClearFilter={() => {
            setPageListActive(false);
            showStatus('🗑️ ล้าง Page List แล้ว', 'warn');
          }}
          onShowStatus={showStatus}
          onShowPage={(path) => setModals(m => ({ ...m, pageDetail: path }))}
        />

        <FilterSection filters={filters} setFilters={setFilters} onApply={applyFilters} availableCountries={availableCountries} />
        
        <SummaryCards data={filteredData} prevData={prevFilteredData} />
        
        <ChartsSection data={filteredData} />
        <GlobalDashboards data={filteredData} prevData={prevFilteredData} pageQueries={pageQueries} />
        
        <DataTable 
          data={tableData} 
          pageListActive={pageListActive} 
          pageQueries={pageQueries}
          onShowPage={path => setModals(m => ({ ...m, pageDetail: path }))} 
          onRemoveItem={(path, isKeyword) => {
            setPageList(prev => prev.filter(p => !(p.path === path && (p.type === 'keyword') === isKeyword)));
            showStatus(`🗑️ ลบ ${path} ออกจาก List แล้ว`, 'warn');
          }}
        />
      </div>

      {modals.tokenHelp && <TokenModal onClose={() => setModals(m => ({ ...m, tokenHelp: false }))} />}
      {modals.pageDetail && <PageDetailModal path={modals.pageDetail} isKeyword={modals.pageDetail.startsWith('[Keyword]')} pageListActive={pageListActive} data={allData} pageQueries={pageQueries} siteUrl={siteUrl} onClose={() => setModals(m => ({ ...m, pageDetail: null }))} />}
      
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-sm w-full mx-4 border border-slate-100">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <div className="text-lg font-bold text-indigo-900 mb-1">กำลังนำเข้าข้อมูล...</div>
            <div className="text-sm font-medium text-slate-500 mb-6 text-center h-5">{loadingMsg}</div>
            
            <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden">
              <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${loadingProgress}%` }}></div>
            </div>
            <div className="text-xs font-bold text-slate-400 text-right w-full">{loadingProgress}%</div>
          </div>
        </div>
      )}
    </div>
  );
}
