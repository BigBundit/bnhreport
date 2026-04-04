import React from 'react';
import { DataRow } from '../types';
import { formatNumber } from '../utils';

interface SummaryCardsProps {
  data: DataRow[];
}

export function SummaryCards({ data }: SummaryCardsProps) {
  let u = 0, s = 0, v = 0, i = 0, c = 0;
  data.forEach(r => { u += r.users; s += r.sessions; v += r.views; i += r.impressions; c += r.clicks; });

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-5">
      <div className="bg-white rounded-xl p-4 shadow-sm border-t-4 border-orange-600">
        <h3 className="text-[10px] text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
          Users <span className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded text-[9px] font-bold">GA</span>
        </h3>
        <div className="text-2xl font-bold text-orange-600 leading-none">{formatNumber(u)}</div>
        <div className="text-[10px] text-slate-400 mt-1">ผู้ใช้งาน</div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border-t-4 border-blue-700">
        <h3 className="text-[10px] text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
          Sessions <span className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded text-[9px] font-bold">GA</span>
        </h3>
        <div className="text-2xl font-bold text-blue-700 leading-none">{formatNumber(s)}</div>
        <div className="text-[10px] text-slate-400 mt-1">เซสชัน</div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border-t-4 border-green-800">
        <h3 className="text-[10px] text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
          Views <span className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded text-[9px] font-bold">GA</span>
        </h3>
        <div className="text-2xl font-bold text-green-800 leading-none">{formatNumber(v)}</div>
        <div className="text-[10px] text-slate-400 mt-1">การดูหน้า</div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border-t-4 border-purple-800">
        <h3 className="text-[10px] text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
          Impressions <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[9px] font-bold">GSC</span>
        </h3>
        <div className="text-2xl font-bold text-purple-800 leading-none">{formatNumber(i)}</div>
        <div className="text-[10px] text-slate-400 mt-1">การแสดงผล</div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border-t-4 border-teal-800">
        <h3 className="text-[10px] text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
          Clicks <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[9px] font-bold">GSC</span>
        </h3>
        <div className="text-2xl font-bold text-teal-800 leading-none">{formatNumber(c)}</div>
        <div className="text-[10px] text-slate-400 mt-1">คลิก</div>
      </div>
    </div>
  );
}
