import React from 'react';
import { DataRow } from '../types';
import { formatNumber } from '../utils';
import { Users, Clock, Eye, MousePointerClick, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

interface SummaryCardsProps {
  data: DataRow[];
  prevData?: DataRow[];
}

export function SummaryCards({ data, prevData = [] }: SummaryCardsProps) {
  let u = 0, s = 0, v = 0, i = 0, c = 0;
  data.forEach(r => { u += r.users; s += r.sessions; v += r.views; i += r.impressions; c += r.clicks; });

  let pu = 0, ps = 0, pv = 0, pi = 0, pc = 0;
  prevData.forEach(r => { pu += r.users; ps += r.sessions; pv += r.views; pi += r.impressions; pc += r.clicks; });

  const getTrend = (current: number, previous: number) => {
    if (previous === 0 && current === 0) return { val: 0, text: '0%', isPos: true };
    if (previous === 0) return { val: 100, text: '+100%', isPos: true };
    const pct = ((current - previous) / previous) * 100;
    return {
      val: pct,
      text: `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`,
      isPos: pct >= 0
    };
  };

  const cards = [
    { label: 'Users', value: u, prev: pu, source: 'GA4', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Sessions', value: s, prev: ps, source: 'GA4', icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Views', value: v, prev: pv, source: 'GA4', icon: Eye, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Impressions', value: i, prev: pi, source: 'GSC', icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Clicks', value: c, prev: pc, source: 'GSC', icon: MousePointerClick, color: 'text-pink-600', bg: 'bg-pink-50' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {cards.map((card, idx) => {
        const trend = getTrend(card.value, card.prev);
        return (
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
              <div className="flex items-end gap-2">
                <div className="text-2xl font-bold text-slate-900 tracking-tight">{formatNumber(card.value)}</div>
                {prevData.length > 0 && (
                  <div className={`flex items-center text-[11px] font-semibold mb-1 ${trend.isPos ? 'text-emerald-600' : 'text-red-500'}`}>
                    {trend.isPos ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />}
                    {trend.text}
                  </div>
                )}
              </div>
              <div className="text-[13px] font-medium text-slate-500 mt-0.5">{card.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
