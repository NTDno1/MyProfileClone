export interface AnalyticsData {
  _id?: string;
  ip: string;
  country?: string;
  city?: string;
  isp?: string;
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
  fbclid?: string;
  isFacebook?: boolean;
  isFacebookApp?: boolean;
  appType?: string;
  trafficSource?: string;
}

export interface VisitorLogItem {
  id?: string;
  _id?: string;
  timestamp: string | Date;
  ip: string;
  city?: string;
  country?: string;
  isp?: string;
  device: string;
  os?: string;
  browser: string;
  appType?: string;
  isFacebook?: boolean;
  isFacebookApp?: boolean;
  fbclid?: string;
  trafficSource?: string;
  page: string;
  timeOnPage?: number;
  referrer?: string;
}

export interface FacebookAnalyticsSummary {
  totalFacebookVisits: number;
  uniqueFacebookVisitors: number;
  inAppBrowserCount: number;
  externalBrowserCount: number;
  fbclidCount: number;
  topFacebookPages: Array<{ page: string; views: number }>;
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
  facebookSummary?: FacebookAnalyticsSummary;
  recentVisitors?: VisitorLogItem[];
}

export type TimeRange = 'day' | 'week' | 'month' | 'year';

