import React from 'react';
import { DataRow } from '../types';
import { formatNumber } from '../utils';
import { Users, Clock, Eye, MousePointerClick, BarChart3 } from 'lucide-react';

interface SummaryCardsProps {
  data: DataRow[];
}

export function SummaryCards({ data }: SummaryCardsProps) {
  let u = 0, s = 0, v = 0, i = 0, c = 0;
  data.forEach(r => { u += r.users; s += r.sessions; v += r.views; i += r.impressions; c += r.clicks; });

  const cards = [
    { label: 'Users', value: u, source: 'GA4', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Sessions', value: s, source: 'GA4', icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Views', value: v, source: 'GA4', icon: Eye, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Impressions', value: i, source: 'GSC', icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Clicks', value: c, source: 'GSC', icon: MousePointerClick, color: 'text-pink-600', bg: 'bg-pink-50' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/60 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.bg} ${card.color} transition-transform group-hover:scale-110`}>
              <card.icon size={20} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
              {card.source}
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">{formatNumber(card.value)}</div>
            <div className="text-[13px] font-medium text-slate-500 mt-0.5">{card.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
