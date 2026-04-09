export interface DataRow {
  date: string;
  page: string;
  pageTitle?: string;
  country: string;
  users: number;
  sessions: number;
  views: number;
  engTime: number;
  engRate: number;
  keyEvents: number;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

export interface PageQuery {
  query: string;
  clicks: number;
  impressions: number;
  country?: string;
}

export interface PageListEntry {
  path: string;
  title: string;
  type: 'url' | 'keyword';
}

export interface FilterState {
  country: string;
  dateFrom: string;
  dateTo: string;
}

export interface SortState {
  field: keyof DataRow;
  dir: 1 | -1;
}

export interface StatusState {
  msg: string;
  type: 'info' | 'success' | 'warn' | 'error';
  visible: boolean;
}
