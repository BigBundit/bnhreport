import React from 'react';
import { Activity } from 'lucide-react';

export function Header() {
  return (
    <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 text-white px-8 py-5 flex items-center gap-4 shadow-md">
      <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center text-indigo-900 shrink-0">
        <Activity size={24} />
      </div>
      <div>
        <h1 className="text-xl font-bold">BNH Hospital – Content Analytics Dashboard</h1>
        <p className="text-xs opacity-75 mt-0.5">GA4 + Google Search Console | bnhhospital.com | Property ID: 283309066</p>
      </div>
    </div>
  );
}
