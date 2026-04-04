import React, { useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DataRow } from '../types';

interface ChartsSectionProps {
  data: DataRow[];
}

export function ChartsSection({ data }: ChartsSectionProps) {
  const chartData = useMemo(() => {
    const byD = new Map<string, { date: string; u: number; s: number; i: number; c: number }>();
    data.forEach(r => {
      if (!byD.has(r.date)) byD.set(r.date, { date: r.date, u: 0, s: 0, i: 0, c: 0 });
      const v = byD.get(r.date)!;
      v.u += r.users; v.s += r.sessions; v.i += r.impressions; v.c += r.clicks;
    });
    return Array.from(byD.values()).sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
  }, [data]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4.5 mb-5">
      <div className="bg-white rounded-xl p-4.5 shadow-sm">
        <h3 className="text-[13px] text-indigo-900 font-bold mb-3 flex items-center gap-1.5">
          📈 Users & Sessions รายวัน <span className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded text-[9px] font-bold">GA</span>
        </h3>
        <div className="h-[210px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} tickMargin={5} minTickGap={20} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Line type="monotone" dataKey="u" name="Users" stroke="#ff6f00" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="s" name="Sessions" stroke="#1565c0" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-xl p-4.5 shadow-sm">
        <h3 className="text-[13px] text-indigo-900 font-bold mb-3 flex items-center gap-1.5">
          🔎 Impressions & Clicks รายวัน <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[9px] font-bold">GSC</span>
        </h3>
        <div className="h-[210px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} tickMargin={5} minTickGap={20} />
              <YAxis yAxisId="left" tick={{ fontSize: 9 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Bar yAxisId="left" dataKey="i" name="Impressions" fill="rgba(21,101,192,0.5)" radius={[2, 2, 0, 0]} />
              <Bar yAxisId="right" dataKey="c" name="Clicks" fill="rgba(46,125,50,0.7)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
