import { Activity, Download, Moon, Sun } from 'lucide-react';
import { toPng } from 'html-to-image';
import { useState, useEffect } from 'react';

export function Header() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);
  const handleExport = () => {
    const node = document.getElementById('dashboard-content');
    if (!node) return;
    toPng(node, { cacheBust: true, backgroundColor: '#f8fafc' })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `BNH_Dashboard_${new Date().toISOString().split('T')[0]}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Failed to export dashboard', err);
        alert('Failed to export dashboard');
      });
  };

  return (
    <header className="bg-white border-b border-slate-200/60 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm">
            <Activity size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-slate-900 dark:text-white leading-tight">BNH Hospital Analytics</h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">GA4 + GSC Integration</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <div className="text-right">
            <div className="text-[12px] font-medium text-slate-900 dark:text-white">bnhhospital.com</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Property ID: 283309066</div>
          </div>
          
          <button 
            onClick={() => setIsDark(!isDark)}
            className="p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Toggle Dark Mode"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button 
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors"
            title="Export Dashboard as Image"
          >
            <Download size={14} /> Export
          </button>
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 text-xs font-bold">
            BN
          </div>
        </div>
      </div>
    </header>
  );
}
