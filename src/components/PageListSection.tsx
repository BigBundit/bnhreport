import React, { useState, useRef } from 'react';
import { List, Plus, Trash2, UploadCloud, FileSpreadsheet, Search, Link as LinkIcon, X } from 'lucide-react';
import { PageListEntry } from '../types';

interface PageListSectionProps {
  pageList: PageListEntry[];
  setPageList: React.Dispatch<React.SetStateAction<PageListEntry[]>>;
  pageListActive: boolean;
  onApplyFilter: () => void;
  onClearFilter: () => void;
  onShowStatus: (msg: string, type: 'info' | 'success' | 'warn' | 'error') => void;
}

export function PageListSection({
  pageList, setPageList, pageListActive, onApplyFilter, onClearFilter, onShowStatus
}: PageListSectionProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'csv' | 'manage'>('text');
  const [textInput, setTextInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvData, setCsvData] = useState<{headers: string[], rows: string[][]} | null>(null);
  const [csvColIdx, setCsvColIdx] = useState(0);
  const [csvTitleIdx, setCsvTitleIdx] = useState(-1);
  const [csvFileName, setCsvFileName] = useState('');

  const normalizeEntry = (raw: string): PageListEntry | null => {
    raw = raw.trim();
    if (!raw) return null;
    let path = raw;
    let type: 'url' | 'keyword' = 'keyword';
    try {
      const u = new URL(raw);
      path = u.pathname + (u.search || '');
      type = 'url';
    } catch (e) {
      if (raw.startsWith('/')) {
        path = raw;
        type = 'url';
      }
    }
    if (type === 'url' && path.length > 1 && path.endsWith('/')) {
      path = path.replace(/\/+$/, '');
    }
    return { path, title: '', type };
  };

  const isDuplicate = (list: PageListEntry[], entry: PageListEntry) => {
    return list.some(x => 
      x.type === entry.type && 
      x.path.toLowerCase().replace(/\/+$/, '') === entry.path.toLowerCase().replace(/\/+$/, '')
    );
  };

  const handleImportText = () => {
    if (!textInput.trim()) {
      alert('Please enter URL or keyword first');
      return;
    }
    const parts = textInput.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    let added = 0;
    const newList = [...pageList];
    parts.forEach(p => {
      const entry = normalizeEntry(p);
      if (!entry) return;
      if (!isDuplicate(newList, entry)) { newList.push(entry); added++; }
    });
    setPageList(newList);
    setTextInput('');
    onShowStatus(`✅ Added ${added} items to Page List (Total: ${newList.length})`, 'success');
    setActiveTab('manage');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      let text = ev.target?.result as string;
      if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
      parseCSV(text, file.name);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const parseCSV = (text: string, filename: string) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (!lines.length) {
      onShowStatus('❌ Empty file', 'error');
      return;
    }
    const sep = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';
    const parseRow = (row: string) => {
      const result = []; let cur = '', inQ = false;
      for (let c of row) {
        if (c === '"') inQ = !inQ;
        else if (c === sep && !inQ) { result.push(cur.trim()); cur = ''; }
        else cur += c;
      }
      result.push(cur.trim());
      return result;
    };
    const headers = parseRow(lines[0]);
    const rows = lines.slice(1).map(l => parseRow(l)).filter(r => r.some(c => c));
    setCsvData({ headers, rows });
    setCsvFileName(filename);
    
    let defaultUrlIdx = headers.findIndex(h => h.toLowerCase().includes('url') || h.toLowerCase().includes('link') || h.toLowerCase().includes('path'));
    if (defaultUrlIdx === -1) defaultUrlIdx = 0;
    setCsvColIdx(defaultUrlIdx);
    
    let defaultTitleIdx = headers.findIndex(h => h.toLowerCase().includes('title') || h.toLowerCase().includes('name') || h.toLowerCase().includes('ชื่อ'));
    setCsvTitleIdx(defaultTitleIdx);
  };

  const handleImportCSV = () => {
    if (!csvData) return;
    let added = 0;
    const newList = [...pageList];
    csvData.rows.forEach(row => {
      const rawPath = row[csvColIdx] || '';
      if (!rawPath.trim()) return;
      const entry = normalizeEntry(rawPath);
      if (!entry) return;
      if (csvTitleIdx >= 0 && row[csvTitleIdx]) entry.title = row[csvTitleIdx].trim();
      if (!isDuplicate(newList, entry)) { newList.push(entry); added++; }
    });
    setPageList(newList);
    onShowStatus(`✅ Imported ${added} items from CSV (Total: ${newList.length})`, 'success');
    setActiveTab('manage');
    setCsvData(null);
  };

  const handleRemoveEntry = (idx: number) => {
    const newList = [...pageList];
    newList.splice(idx, 1);
    setPageList(newList);
  };

  const handleExportList = () => {
    if (!pageList.length) { alert('Page List is empty'); return; }
    const rows = [['Type', 'Path/Keyword', 'Title'], ...pageList.map(p => [p.type, p.path, p.title || ''])];
    const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'BNH_PageList_' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 mb-6">
      <h2 className="text-[15px] text-slate-900 mb-4 flex items-center gap-2 font-semibold">
        <List size={18} className="text-indigo-600" /> Page List Configuration
        {pageListActive && (
          <span className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-700 rounded-full px-2.5 py-0.5 text-[11px] font-bold ml-2">
            {pageList.length} Pages Active
            <X size={12} className="cursor-pointer opacity-70 hover:opacity-100" onClick={onClearFilter} />
          </span>
        )}
      </h2>

      <div className="flex gap-2 border-b border-slate-200 mb-5">
        <button className={`px-4 py-2.5 text-[13px] font-semibold border-b-2 -mb-[1px] transition-colors ${activeTab === 'text' ? 'text-indigo-600 border-indigo-600' : 'text-slate-500 border-transparent hover:text-slate-800'}`} onClick={() => setActiveTab('text')}>✏️ Manual Entry</button>
        <button className={`px-4 py-2.5 text-[13px] font-semibold border-b-2 -mb-[1px] transition-colors ${activeTab === 'csv' ? 'text-indigo-600 border-indigo-600' : 'text-slate-500 border-transparent hover:text-slate-800'}`} onClick={() => setActiveTab('csv')}>📂 Import CSV</button>
        <button className={`px-4 py-2.5 text-[13px] font-semibold border-b-2 -mb-[1px] transition-colors ${activeTab === 'manage' ? 'text-indigo-600 border-indigo-600' : 'text-slate-500 border-transparent hover:text-slate-800'}`} onClick={() => setActiveTab('manage')}>🗂️ Manage List</button>
      </div>

      {activeTab === 'text' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="mb-3">
            <label className="text-[11px] text-slate-500 font-semibold block mb-1.5 uppercase tracking-wider">Enter URLs or Keywords (one per line or comma-separated)</label>
            <textarea 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono resize-y"
              rows={4}
              placeholder="/th/article/pms-symptoms-before-period&#10;/th/health-acticle/preterm-birth/&#10;https://www.bnhhospital.com/th/article/what-is-hpv-symptoms-treatment-prevention&#10;HPV, Lady Ready, Cancer"
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
            />
            <div className="text-[11px] text-slate-400 mt-1.5">Supports: full URL, path (/th/...), or search keyword</div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleImportText} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[13px] font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-all flex items-center gap-2 shadow-sm">
              <Plus size={16} /> Add to List
            </button>
            <button onClick={() => setTextInput('')} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[13px] font-semibold hover:bg-slate-200 transition-all flex items-center gap-2">
              <Trash2 size={16} /> Clear
            </button>
          </div>
        </div>
      )}

      {activeTab === 'csv' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div 
            className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center cursor-pointer transition-all bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50 group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <UploadCloud size={24} className="text-indigo-500" />
            </div>
            <p className="text-[14px] text-slate-700 mb-1 font-medium">Click to select CSV file</p>
            <p className="text-[12px] text-slate-400">Supports .csv and .txt | UTF-8 encoding</p>
          </div>
          <input type="file" ref={fileInputRef} accept=".csv,.txt" className="hidden" onChange={handleFileChange} />
          
          {csvData && (
            <div className="mt-5 bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-500 font-semibold uppercase">URL/Path Column</label>
                  <select className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-indigo-500 min-w-[160px]" value={csvColIdx} onChange={e => setCsvColIdx(+e.target.value)}>
                    {csvData.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-500 font-semibold uppercase">Title Column (Optional)</label>
                  <select className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-indigo-500 min-w-[160px]" value={csvTitleIdx} onChange={e => setCsvTitleIdx(+e.target.value)}>
                    <option value="-1">— No Title —</option>
                    {csvData.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1 mt-auto">
                  <button onClick={handleImportCSV} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm">
                    <Plus size={16} /> Import Data
                  </button>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3 text-[12px] font-mono text-slate-600 max-h-[120px] overflow-y-auto whitespace-pre-wrap break-all custom-scrollbar">
                <div className="text-slate-400 mb-1 text-[10px] uppercase font-sans tracking-wider">Preview: {csvFileName}</div>
                {csvData.headers.join(csvData.headers.length > 1 ? ',' : '')}{'\n'}
                {csvData.rows.slice(0, 3).map(r => r.join(',')).join('\n')}
                {csvData.rows.length > 3 && `\n...(${csvData.rows.length - 3} more rows)`}
              </div>
              <div className="text-[12px] text-emerald-600 font-medium mt-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Found {csvData.rows.length} rows, {csvData.headers.length} columns
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-wrap gap-2 min-h-[40px] max-h-[200px] overflow-y-auto py-2 custom-scrollbar pr-2">
            {pageList.length === 0 ? (
              <div className="w-full py-8 text-center text-slate-400 text-[13px] bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                No items in list. Add them via "Manual Entry" or "Import CSV".
              </div>
            ) : (
              pageList.map((p, i) => {
                const label = p.title || (p.type === 'keyword' ? `🔑 ${p.path}` : p.path);
                const isUrl = p.type === 'url';
                return (
                  <span key={i} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium border shadow-sm transition-colors ${isUrl ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'}`} title={p.path}>
                    {isUrl ? <LinkIcon size={14} className="opacity-70" /> : <Search size={14} className="opacity-70" />}
                    <span className="max-w-[250px] truncate">{label}</span>
                    <button onClick={() => handleRemoveEntry(i)} className={`ml-1 p-0.5 rounded-full hover:bg-white/50 transition-colors ${isUrl ? 'text-emerald-600 hover:text-emerald-900' : 'text-indigo-600 hover:text-indigo-900'}`}>
                      <X size={14} />
                    </button>
                  </span>
                );
              })
            )}
          </div>
          
          {pageList.length > 0 && (
            <>
              <div className="text-[13px] text-slate-500 mt-3 mb-4 font-medium">
                Total: <strong className="text-slate-900">{pageList.length}</strong> items
              </div>
              <div className="flex gap-2 flex-wrap pt-4 border-t border-slate-100">
                <button onClick={onApplyFilter} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[13px] font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-all flex items-center gap-2 shadow-sm">
                  <Search size={16} /> Filter by List
                </button>
                <button onClick={() => { setPageList([]); onClearFilter(); }} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[13px] font-semibold hover:bg-slate-200 transition-all flex items-center gap-2">
                  <Trash2 size={16} /> Clear List
                </button>
                <button onClick={handleExportList} className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[13px] font-semibold hover:bg-emerald-100 transition-all flex items-center gap-2 ml-auto">
                  <FileSpreadsheet size={16} /> Export CSV
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
