import { DataRow, PageQuery } from './types';

export function formatNumber(n: number | null | undefined): string {
  if (n == null || isNaN(n) || (n === 0 && n !== 0)) return n === 0 ? '0' : '–';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.round(n).toLocaleString();
}

export function formatPercent(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '–';
  return (n * 100).toFixed(1) + '%';
}

export function formatTime(s: number | null | undefined): string {
  if (!s && s !== 0) return '–';
  if (s === 0) return '0s';
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

export function formatPosition(n: number | null | undefined): string {
  if (!n && n !== 0) return '–';
  return (+n).toFixed(1);
}

export function getTitle(path: string): string {
  const known = [
    { p: 'pms-symptoms', t: 'PMS อาการก่อนมีประจำเดือน' },
    { p: 'preterm-birth', t: 'Preterm Birth' },
    { p: 'prp_bnh', t: 'Restoring Youth PRP' },
    { p: 'hpv', t: 'HPV คืออะไร? อาการ สาเหตุ' },
    { p: 'hm_menopause', t: 'ฮอร์โมน วัยทองวัยรุ่น' },
    { p: 'who_is_menopause', t: 'วัยทองคือใคร?' },
    { p: 'lady-ready-1', t: 'Lady Ready 1' },
    { p: 'lady-ready-2', t: 'Lady Ready 2' },
    { p: 'lady-ready-3', t: 'Lady Ready 3' },
    { p: 'non-surgical-carotid', t: 'Non-Surgical Carotid Artery Treatment' },
    { p: 'breast-cancer', t: 'Breast Cancer Treatment' },
    { p: 'cervical-cancer', t: 'Cervical Cancer' },
    { p: 'cotest', t: 'Cotest Cancer' },
    { p: 'ovarian', t: 'Ovarian Cancer' },
    { p: 'menstrual', t: 'Menstrual Disorder' },
    { p: 'fertility', t: 'Fertility Treatment' },
    { p: 'osteoporosis', t: 'Osteoporosis' },
    { p: 'thyroid', t: 'Thyroid Disease' }
  ];
  const found = known.find(x => path.toLowerCase().includes(x.p));
  if (found) return found.t;
  const seg = path.split('/').filter(Boolean).pop() || path;
  return seg.replace(/-/g, ' ').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).substring(0, 50) || path;
}

export function isAIOQuery(query: string): boolean {
  if (!query) return false;
  const q = query.toLowerCase();
  // Proxy for AIO: Long-tail queries (>= 4 words) or contains question/intent keywords
  if (q.split(' ').length >= 4) return true;
  const aioKeywords = ['อะไร', 'ไหม', 'ทำไม', 'วิธี', 'คือ', 'ใคร', 'เท่าไหร่', 'how', 'what', 'why', 'when', 'where', 'who', 'guide', 'best', 'ดีไหม', 'pantip', 'รีวิว', 'อาการ', 'รักษา', 'สาเหตุ'];
  return aioKeywords.some(kw => q.includes(kw));
}
