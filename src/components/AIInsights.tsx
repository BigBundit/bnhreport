import React, { useState } from 'react';
import { Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { DataRow, PageQuery } from '../types';
import { isAIOQuery } from '../utils';

interface AIInsightsProps {
  data: DataRow[];
  pageQueries: Record<string, PageQuery[]>;
  geminiKey: string;
}

export function AIInsights({ data, pageQueries, geminiKey }: AIInsightsProps) {
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const generateInsight = async () => {
    if (!geminiKey) {
      setError('กรุณาระบุ Gemini API Key ในส่วน Data Connection ก่อน');
      setIsOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsOpen(true);

    try {
      // Prepare aggregated AIO data for Gemini
      const topPages = [...data].sort((a, b) => b.views - a.views).slice(0, 10);
      const aioData = topPages.map(page => {
        const queries = pageQueries[page.page] || [];
        const aioQueries = queries.filter(q => isAIOQuery(q.query)).sort((a, b) => b.impressions - a.impressions).slice(0, 5);
        
        return {
          path: page.page,
          views: page.views,
          clicks: page.clicks,
          impressions: page.impressions,
          aio_keywords: aioQueries.map(q => ({ query: q.query, clicks: q.clicks, impressions: q.impressions }))
        };
      }).filter(p => p.aio_keywords.length > 0);

      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiKey, data: aioData })
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to generate insight');

      setInsight(resData.text);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to safely render markdown-like text simply
  const formatText = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.trim() === '') return null;
      
      const processBold = (str: string) => {
        return str.split(/(\*\*.*?\*\*|\*.*?\*)/g).map((part, idx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={idx} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith('*') && part.endsWith('*')) {
            return <strong key={idx} className="font-semibold text-slate-900">{part.slice(1, -1)}</strong>;
          }
          return part;
        });
      };

      if (line.startsWith('### ')) return <h4 key={i} className="text-[14px] font-bold text-slate-800 mt-4 mb-2">{processBold(line.replace(/###/g, '').trim())}</h4>;
      if (line.startsWith('## ')) return <h3 key={i} className="text-[15px] font-bold text-slate-800 mt-4 mb-2">{processBold(line.replace(/##/g, '').trim())}</h3>;
      if (line.startsWith('# ')) return <h2 key={i} className="text-[17px] font-bold text-indigo-700 mt-5 mb-3">{processBold(line.replace(/#/g, '').trim())}</h2>;
      if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-5 mb-1.5 list-disc text-slate-700 leading-relaxed">{processBold(line.substring(2).trim())}</li>;
      
      // Handle numbered lists
      if (/^\d+\.\s/.test(line)) {
        const match = line.match(/^\d+\.\s(.*)/);
        if (match) return <li key={i} className="ml-5 mb-1.5 list-decimal text-slate-700 leading-relaxed">{processBold(match[1])}</li>;
      }
      
      return <p key={i} className="mb-3 text-slate-600 leading-relaxed">{processBold(line.trim())}</p>;
    });
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 shadow-sm border border-indigo-100/50 mb-6 relative overflow-hidden transition-all">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles size={100} />
      </div>
      
      <div className="flex items-center justify-between relative z-10">
        <div>
          <h2 className="text-[16px] text-indigo-900 font-bold flex items-center gap-2">
            <Sparkles size={20} className="text-indigo-600" /> 
            AI Insights: AIO Optimization
          </h2>
          <p className="text-[12px] text-indigo-600/70 mt-1">วิเคราะห์ศักยภาพของเว็บไซต์สำหรับการตอบคำถาม AI (AIO)</p>
        </div>
        
        <div className="flex gap-2">
          {!insight && !isLoading && !error && (
             <button 
               onClick={generateInsight}
               className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[13px] font-semibold transition-all shadow-md hover:shadow-indigo-600/20 flex items-center gap-2"
             >
               <Sparkles size={16} /> Generate Insight
             </button>
          )}
          {(insight || error) && (
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 bg-white/50 hover:bg-white/80 rounded-xl text-indigo-600 transition-colors"
            >
              {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="mt-5 relative z-10 bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-white/50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-indigo-600">
              <Loader2 size={32} className="animate-spin mb-3" />
              <p className="text-[13px] font-medium animate-pulse">กำลังให้ Gemini วิเคราะห์ข้อมูล AIO...</p>
            </div>
          ) : error ? (
            <div className="text-red-600 text-[13px] font-medium flex flex-col items-center py-4">
              <span className="text-2xl mb-2">⚠️</span>
              {error}
              <button onClick={generateInsight} className="mt-3 px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">ลองอีกครั้ง</button>
            </div>
          ) : insight ? (
            <div className="text-[13px] prose-sm max-w-none">
              {formatText(insight)}
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={generateInsight}
                  className="text-[11px] font-medium text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition-colors"
                >
                  <Sparkles size={12} /> Regenerate
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
