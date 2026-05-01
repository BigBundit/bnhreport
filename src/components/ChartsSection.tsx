import React, { useMemo, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DataRow } from '../types';

interface ChartsSectionProps {
  data: DataRow[];
  deviceData?: { device: string; users: number; views: number }[];
}

type Granularity = 'daily' | 'weekly' | 'monthly' | 'yearly';

const getGroupKey = (dateStr: string, granularity: Granularity) => {
  if (granularity === 'daily') return dateStr;
  if (granularity === 'monthly') return dateStr.substring(0, 7);
  if (granularity === 'yearly') return dateStr.substring(0, 4);
  if (granularity === 'weekly') {
    const d = new Date(dateStr);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().substring(0, 10);
  }
  return dateStr;
};

export function ChartsSection({ data, deviceData = [] }: ChartsSectionProps) {
  const [granularity, setGranularity] = useState<Granularity>('daily');

  const chartData = useMemo(() => {
    const byD = new Map<string, { date: string; u: number; s: number; v: number; i: number; c: number }>();
    data.forEach(r => {
      const key = getGroupKey(r.date, granularity);
      if (!byD.has(key)) byD.set(key, { date: key, u: 0, s: 0, v: 0, i: 0, c: 0 });
      const val = byD.get(key)!;
      val.u += r.users; val.s += r.sessions; val.v += r.views; val.i += r.impressions; val.c += r.clicks;
    });
    return Array.from(byD.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [data, granularity]);

  const titleSuffix = granularity === 'daily' ? 'รายวัน' : granularity === 'weekly' ? 'รายสัปดาห์' : granularity === 'monthly' ? 'รายเดือน' : 'รายปี';

  return (
    <div className="mb-5">
      <div className="flex justify-end mb-3">
        <select 
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-sm font-medium"
          value={granularity}
          onChange={(e) => setGranularity(e.target.value as Granularity)}
        >
          <option value="daily">📅 รายวัน (Daily)</option>
          <option value="weekly">📅 รายสัปดาห์ (Weekly)</option>
          <option value="monthly">📅 รายเดือน (Monthly)</option>
          <option value="yearly">📅 รายปี (Yearly)</option>
        </select>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4.5">
        <div className="bg-white rounded-xl p-4.5 shadow-sm">
          <h3 className="text-[13px] text-indigo-900 font-bold mb-3 flex items-center gap-1.5">
            📈 Traffic {titleSuffix} <span className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded text-[9px] font-bold">GA</span>
          </h3>
          <div className="h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickMargin={5} minTickGap={20} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value: number) => value.toLocaleString()} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="v" name="Traffic" stroke="#2e7d32" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4.5 shadow-sm">
          <h3 className="text-[13px] text-indigo-900 font-bold mb-3 flex items-center gap-1.5">
            🔎 Impressions & Clicks {titleSuffix} <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[9px] font-bold">GSC</span>
          </h3>
          <div className="h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickMargin={5} minTickGap={20} />
                <YAxis yAxisId="left" tick={{ fontSize: 9 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value: number) => value.toLocaleString()} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar yAxisId="left" dataKey="i" name="Impressions" fill="rgba(21,101,192,0.5)" radius={[2, 2, 0, 0]} />
                <Bar yAxisId="right" dataKey="c" name="Clicks" fill="rgba(46,125,50,0.7)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4.5 shadow-sm">
          <h3 className="text-[13px] text-indigo-900 dark:text-indigo-100 font-bold mb-3 flex items-center gap-1.5">
            📱 Devices <span className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded text-[9px] font-bold">GA4</span>
          </h3>
          <div className="h-[210px] flex items-center justify-center">
            {deviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="users"
                    nameKey="device"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {deviceData.map((entry, index) => {
                      const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Pie>
                  <Tooltip formatter={(value: number) => value.toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-xs">No device data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
