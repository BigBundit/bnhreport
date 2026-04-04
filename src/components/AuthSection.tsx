import React from 'react';
import { Key, Play, FileText } from 'lucide-react';

interface AuthSectionProps {
  propId: string;
  setPropId: (v: string) => void;
  siteUrl: string;
  setSiteUrl: (v: string) => void;
  token: string;
  setToken: (v: string) => void;
  onLoadData: () => void;
  onShowTokenHelp: () => void;
}

export function AuthSection({
  propId, setPropId, siteUrl, setSiteUrl, token, setToken,
  onLoadData, onShowTokenHelp
}: AuthSectionProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm mb-5">
      <h2 className="text-[15px] text-indigo-900 mb-4 flex items-center gap-2 font-bold">
        <Key size={18} /> การตั้งค่า API
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-[11px] text-slate-500 font-bold block mb-1 uppercase tracking-wide">GA4 Property ID</label>
          <input 
            type="text" 
            className="w-full px-3 py-2 border-1.5 border-slate-200 rounded-lg text-[13px] outline-none focus:border-indigo-900 transition-colors"
            value={propId} 
            onChange={e => setPropId(e.target.value)} 
          />
          <div className="text-[10px] text-slate-400 mt-1">Admin → Property Settings → Property ID</div>
        </div>
        <div>
          <label className="text-[11px] text-slate-500 font-bold block mb-1 uppercase tracking-wide">GSC Site URL</label>
          <input 
            type="text" 
            className="w-full px-3 py-2 border-1.5 border-slate-200 rounded-lg text-[13px] outline-none focus:border-indigo-900 transition-colors"
            value={siteUrl} 
            onChange={e => setSiteUrl(e.target.value)} 
          />
          <div className="text-[10px] text-slate-400 mt-1">URL ที่ verify ใน Search Console</div>
        </div>
        <div>
          <label className="text-[11px] text-slate-500 font-bold block mb-1 uppercase tracking-wide">Google OAuth Access Token</label>
          <input 
            type="password" 
            className="w-full px-3 py-2 border-1.5 border-slate-200 rounded-lg text-[13px] outline-none focus:border-indigo-900 transition-colors"
            placeholder="ya29.xxxx... (จาก OAuth Playground)"
            value={token} 
            onChange={e => setToken(e.target.value)} 
          />
          <div className="text-[10px] text-slate-400 mt-1">ใช้ได้ 1 ชั่วโมง</div>
        </div>
      </div>
      <div className="flex gap-2.5 mt-4 flex-wrap items-center">
        <button onClick={onLoadData} className="px-4 py-2 bg-indigo-900 text-white rounded-lg text-[13px] font-semibold hover:bg-indigo-800 transition-all flex items-center gap-2">
          <Play size={16} /> โหลดข้อมูลจริง
        </button>
        <button onClick={onShowTokenHelp} className="px-4 py-2 bg-green-800 text-white rounded-lg text-[13px] font-semibold hover:bg-green-700 transition-all flex items-center gap-2">
          <Key size={16} /> วิธีรับ Token
        </button>
      </div>
    </div>
  );
}
