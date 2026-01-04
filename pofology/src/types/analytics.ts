export interface AnalyticsData {
  _id?: string;
  ip: string;
  country?: string;
  city?: string;
  device: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  browserVersion?: string;
  os?: string;
  page: string;
  referrer?: string;
  userAgent: string;
  timestamp: Date;
  sessionId: string;
  timeOnPage?: number; // in seconds
  isNewVisitor: boolean;
}

export interface AnalyticsStats {
  totalVisitors: number;
  totalPageViews: number;
  uniqueVisitors: number;
  averageTimeOnPage: number;
  topPages: Array<{ page: string; views: number }>;
  topCountries: Array<{ country: string; visitors: number }>;
  topDevices: Array<{ device: string; count: number }>;
  topBrowsers: Array<{ browser: string; count: number }>;
  visitorsByDate: Array<{ date: string; visitors: number; pageViews: number }>;
}

export type TimeRange = 'day' | 'week' | 'month' | 'year';

