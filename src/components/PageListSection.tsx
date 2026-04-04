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
      alert('กรุณาใส่ URL หรือ keyword ก่อน');
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
    onShowStatus(`✅ เพิ่ม ${added} รายการใน Page List (รวม ${newList.length})`, 'success');
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
      onShowStatus('❌ ไฟล์ว่างเปล่า', 'error');
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
    onShowStatus(`✅ นำเข้า ${added} รายการจาก CSV (รวม ${newList.length})`, 'success');
    setActiveTab('manage');
    setCsvData(null);
  };

  const handleRemoveEntry = (idx: number) => {
    const newList = [...pageList];
    newList.splice(idx, 1);
    setPageList(newList);
  };

  const handleExportList = () => {
    if (!pageList.length) { alert('ไม่มีรายการใน Page List'); return; }
    const rows = [['Type', 'Path/Keyword', 'Title'], ...pageList.map(p => [p.type, p.path, p.title || ''])];
    const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'BNH_PageList_' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm mb-5">
      <h2 className="text-[15px] text-indigo-900 mb-4 flex items-center gap-2 font-bold">
        <List size={18} /> กำหนด Page List ที่ต้องการดู
        {pageListActive && (
          <span className="inline-flex items-center gap-1.5 bg-indigo-900 text-white rounded-full px-2.5 py-0.5 text-[11px] font-semibold ml-2">
            {pageList.length} หน้า
            <X size={12} className="cursor-pointer opacity-70 hover:opacity-100" onClick={onClearFilter} />
          </span>
        )}
      </h2>

      <div className="flex gap-0 border-b-2 border-slate-200 mb-4">
        <button className={`px-4 py-2 text-[13px] font-semibold border-b-2 -mb-[2px] transition-colors ${activeTab === 'text' ? 'text-indigo-900 border-indigo-900' : 'text-slate-500 border-transparent hover:text-indigo-900'}`} onClick={() => setActiveTab('text')}>✏️ พิมพ์/วาง URL</button>
        <button className={`px-4 py-2 text-[13px] font-semibold border-b-2 -mb-[2px] transition-colors ${activeTab === 'csv' ? 'text-indigo-900 border-indigo-900' : 'text-slate-500 border-transparent hover:text-indigo-900'}`} onClick={() => setActiveTab('csv')}>📂 นำเข้าไฟล์ CSV</button>
        <button className={`px-4 py-2 text-[13px] font-semibold border-b-2 -mb-[2px] transition-colors ${activeTab === 'manage' ? 'text-indigo-900 border-indigo-900' : 'text-slate-500 border-transparent hover:text-indigo-900'}`} onClick={() => setActiveTab('manage')}>🗂️ จัดการรายการ</button>
      </div>

      {activeTab === 'text' && (
        <div>
          <div className="mb-2.5">
            <label className="text-[11px] text-slate-500 font-bold block mb-1 uppercase tracking-wide">วาง URL หรือ Path หลายรายการ (ทีละบรรทัด หรือคั่นด้วย comma)</label>
            <textarea 
              className="w-full px-3 py-2 border-1.5 border-slate-200 rounded-lg text-[13px] outline-none focus:border-indigo-900 transition-colors font-mono"
              rows={5}
              placeholder="/th/article/pms-symptoms-before-period&#10;/th/health-acticle/preterm-birth/&#10;https://www.bnhhospital.com/th/article/what-is-hpv-symptoms-treatment-prevention&#10;HPV, Lady Ready, มะเร็ง"
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
            />
            <div className="text-[10px] text-slate-400 mt-1">รองรับ: full URL, path (/th/...), หรือ keyword ค้นหา — คั่นด้วย Enter หรือ comma</div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleImportText} className="px-3 py-1.5 bg-indigo-900 text-white rounded-lg text-xs font-semibold hover:bg-indigo-800 transition-all flex items-center gap-1.5">
              <Plus size={14} /> เพิ่มใน List
            </button>
            <button onClick={() => setTextInput('')} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-all flex items-center gap-1.5">
              <Trash2 size={14} /> ล้าง
            </button>
          </div>
        </div>
      )}

      {activeTab === 'csv' && (
        <div>
          <div 
            className="border-2 border-dashed border-indigo-200 rounded-xl p-6 text-center cursor-pointer transition-colors bg-white hover:border-indigo-900 hover:bg-indigo-50"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud size={32} className="mx-auto mb-2 text-indigo-400" />
            <p className="text-[13px] text-slate-600 mb-1"><strong>คลิกเพื่อเลือกไฟล์</strong></p>
            <p className="text-[11px] text-slate-400">รองรับ .csv และ .txt | UTF-8 หรือ UTF-8 BOM</p>
          </div>
          <input type="file" ref={fileInputRef} accept=".csv,.txt" className="hidden" onChange={handleFileChange} />
          
          {csvData && (
            <div className="mt-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <label className="text-xs text-slate-600 font-semibold">คอลัมน์ URL/Path:</label>
                <select className="px-3 py-1.5 border-1.5 border-slate-200 rounded-lg text-xs bg-slate-50 outline-none focus:border-indigo-900 min-w-[160px]" value={csvColIdx} onChange={e => setCsvColIdx(+e.target.value)}>
                  {csvData.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                </select>
                <label className="text-xs text-slate-600 font-semibold">คอลัมน์ Title (ถ้ามี):</label>
                <select className="px-3 py-1.5 border-1.5 border-slate-200 rounded-lg text-xs bg-slate-50 outline-none focus:border-indigo-900 min-w-[160px]" value={csvTitleIdx} onChange={e => setCsvTitleIdx(+e.target.value)}>
                  <option value="-1">— ไม่มี Title —</option>
                  {csvData.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                </select>
                <button onClick={handleImportCSV} className="px-3 py-1.5 bg-indigo-900 text-white rounded-lg text-xs font-semibold hover:bg-indigo-800 transition-all flex items-center gap-1.5">
                  <Plus size={14} /> นำเข้า
                </button>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-[11px] font-mono text-slate-500 max-h-[120px] overflow-y-auto mt-2.5 whitespace-pre-wrap break-all">
                ไฟล์: {csvFileName}{'\n'}
                {csvData.headers.join(csvData.headers.length > 1 ? ',' : '')}{'\n'}
                {csvData.rows.slice(0, 3).map(r => r.join(',')).join('\n')}
                {csvData.rows.length > 3 && `\n...(${csvData.rows.length - 3} แถว)`}
              </div>
              <div className="text-xs text-slate-600 mt-2">✅ พบ {csvData.rows.length} แถว, {csvData.headers.length} คอลัมน์</div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'manage' && (
        <div>
          <div className="flex flex-wrap gap-1.5 min-h-[30px] max-h-[150px] overflow-y-auto py-1">
            {pageList.length === 0 ? (
              <span className="text-xs text-slate-400">ยังไม่มีรายการ — เพิ่มจากแท็บ "พิมพ์/วาง URL" หรือ "นำเข้าไฟล์ CSV"</span>
            ) : (
              pageList.map((p, i) => {
                const label = p.title || (p.type === 'keyword' ? `🔑 ${p.path}` : p.path);
                const isUrl = p.type === 'url';
                return (
                  <span key={i} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${isUrl ? 'bg-green-50 text-green-800 border-green-200' : 'bg-indigo-50 text-indigo-900 border-indigo-200'}`} title={p.path}>
                    {isUrl ? <LinkIcon size={12} /> : <Search size={12} />}
                    <span className="max-w-[200px] truncate">{label}</span>
                    <X size={14} className={`cursor-pointer ${isUrl ? 'text-green-500 hover:text-red-600' : 'text-indigo-400 hover:text-red-600'}`} onClick={() => handleRemoveEntry(i)} />
                  </span>
                );
              })
            )}
          </div>
          <div className="text-xs text-slate-600 mt-2 mb-3">
            รวม: <strong className="text-indigo-900">{pageList.length}</strong> รายการ
          </div>
          <hr className="border-t border-slate-100 my-3" />
          <div className="flex gap-2 flex-wrap">
            <button onClick={onApplyFilter} className="px-3 py-1.5 bg-indigo-900 text-white rounded-lg text-xs font-semibold hover:bg-indigo-800 transition-all flex items-center gap-1.5">
              <Search size={14} /> กรองข้อมูลตาม List นี้
            </button>
            <button onClick={() => { setPageList([]); onClearFilter(); }} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-all flex items-center gap-1.5">
              <Trash2 size={14} /> ล้าง List ทั้งหมด
            </button>
            <button onClick={handleExportList} className="px-3 py-1.5 bg-green-800 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-all flex items-center gap-1.5">
              <FileSpreadsheet size={14} /> Export List เป็น CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
