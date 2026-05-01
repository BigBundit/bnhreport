import React from 'react';
import { Key, Play, Database, Info } from 'lucide-react';

interface AuthSectionProps {
  propId: string;
  setPropId: (v: string) => void;
  siteUrl: string;
  setSiteUrl: (v: string) => void;
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onLoadData: () => void;
  onShowTokenHelp: () => void;
  geminiKey: string;
  setGeminiKey: (v: string) => void;
}

export function AuthSection({
  propId, setPropId, siteUrl, setSiteUrl,
  isAuthenticated, onLogin, onLogout,
  onLoadData, onShowTokenHelp,
  geminiKey, setGeminiKey
}: AuthSectionProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[15px] text-slate-900 font-semibold flex items-center gap-2">
          <Database size={18} className="text-indigo-600" /> 
          Data Connection
        </h2>
        <button onClick={onShowTokenHelp} className="text-[12px] text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1.5 transition-colors">
          <Info size={14} /> OAuth Setup Instructions
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[11px] text-slate-500 font-semibold block mb-1.5 uppercase tracking-wider">GA4 Property ID</label>
            <input 
              type="text" 
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              value={propId} 
              onChange={e => setPropId(e.target.value)} 
            />
            <div className="text-[10px] text-slate-400 mt-1.5">Admin → Property Settings → Property ID</div>
          </div>
          <div>
            <label className="text-[11px] text-slate-500 font-semibold block mb-1.5 uppercase tracking-wider">Gemini API Key (AI Insights)</label>
            <input 
              type="password" 
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              value={geminiKey} 
              onChange={e => setGeminiKey(e.target.value)} 
              placeholder="AIzaSy..."
            />
          </div>
        </div>
        <div>
          <label className="text-[11px] text-slate-500 font-semibold block mb-1.5 uppercase tracking-wider">GSC Site URL(s)</label>
          <div className="flex flex-col gap-1.5 mb-2 border border-slate-200/60 rounded-xl p-2.5 bg-slate-50/50">
            <label className="flex items-center gap-2 cursor-pointer text-[12px] text-slate-700">
              <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-600" checked={siteUrl.includes('https://www.bnhhospital.com/')} onChange={(e) => {
                 let urls = siteUrl.split(',').map(u=>u.trim()).filter(Boolean);
                 if (e.target.checked) urls.push('https://www.bnhhospital.com/');
                 else urls = urls.filter(u => u !== 'https://www.bnhhospital.com/');
                 setSiteUrl(Array.from(new Set(urls)).join(', '));
              }} />
              BNH (www.bnhhospital.com)
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-[12px] text-slate-700">
              <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-600" checked={siteUrl.includes('https://mbrace.bnhhospital.com/')} onChange={(e) => {
                 let urls = siteUrl.split(',').map(u=>u.trim()).filter(Boolean);
                 if (e.target.checked) urls.push('https://mbrace.bnhhospital.com/');
                 else urls = urls.filter(u => u !== 'https://mbrace.bnhhospital.com/');
                 setSiteUrl(Array.from(new Set(urls)).join(', '));
              }} />
              MBrace (mbrace.bnhhospital.com)
            </label>
          </div>
          <input 
            type="text" 
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
            value={siteUrl} 
            onChange={e => setSiteUrl(e.target.value)} 
            placeholder="Comma-separated URLs"
          />
        </div>
        <div>
          <label className="text-[11px] text-slate-500 font-semibold block mb-1.5 uppercase tracking-wider">Authentication</label>
          <div className="flex gap-2">
            {!isAuthenticated ? (
              <button 
                onClick={onLogin} 
                className="w-full px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-[13px] font-semibold hover:bg-slate-50 active:bg-slate-100 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" referrerPolicy="no-referrer" />
                Login with Google
              </button>
            ) : (
              <div className="flex gap-2 w-full">
                <button 
                  onClick={onLoadData} 
                  className="flex-1 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[13px] font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-all flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
                >
                  <Play size={16} fill="currentColor" /> Load Data
                </button>
                <button 
                  onClick={onLogout} 
                  className="px-3 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[13px] font-semibold hover:bg-slate-200 transition-all"
                  title="Logout"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 mt-1.5">
            {isAuthenticated ? '✅ Authenticated' : '❌ Not Logged In'}
          </div>
        </div>
      </div>
    </div>
  );
}
