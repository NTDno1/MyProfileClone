import { NextPage } from 'next';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { AnalyticsStats, TimeRange } from '@/types/analytics';
import { isValidAuthToken } from '@/lib/auth';
import Head from 'next/head';

const Statistics: NextPage = () => {
  const router = useRouter();
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('day');
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  const fetchStats = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const response = await fetch(`/api/analytics/stats?range=${timeRange}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStats(data);
      if (mounted) {
        setLastUpdate(new Date().toLocaleString());
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set empty stats on error
      setStats({
        totalVisitors: 0,
        totalPageViews: 0,
        uniqueVisitors: 0,
        averageTimeOnPage: 0,
        topPages: [],
        topCountries: [],
        topDevices: [],
        topBrowsers: [],
        visitorsByDate: [],
      });
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [timeRange, mounted]);

  useEffect(() => {
    setMounted(true);
    // Check authentication
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('admin_auth_token');
      if (!token || !isValidAuthToken(token)) {
        router.push('/admin/login');
      }
    }
  }, [router]);

  useEffect(() => {
    if (mounted) {
      fetchStats(true); // Show loading on initial load
      // Auto refresh every 5 seconds for real-time updates (silent refresh)
      const interval = setInterval(() => {
        fetchStats(false); // Silent refresh without loading indicator
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [fetchStats, mounted]);

  const StatCard: React.FC<{ title: string; value: string | number; icon?: string }> = ({
    title,
    value,
    icon,
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
        </div>
        {icon && (
          <div className="text-4xl text-blue-500">{icon}</div>
        )}
      </div>
    </div>
  );

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    if (!mounted) return dateString;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatNumber = (num: number) => {
    if (!mounted) return num.toString();
    return num.toLocaleString('en-US');
  };

  return (
    <>
      <Head>
        <title>Analytics Statistics | Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Analytics Statistics
            </h1>
            <div className="flex items-center gap-4">
              {mounted && lastUpdate && (
                <p className="text-gray-600 dark:text-gray-400">
                  Last updated: {lastUpdate}
                </p>
              )}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Auto-refreshing every 5s
                </span>
              </div>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="mb-6 flex flex-wrap gap-2">
            {(['day', 'week', 'month', 'year'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
            <button
              onClick={() => fetchStats(true)}
              className="px-4 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading statistics...</p>
            </div>
          ) : stats && stats.totalPageViews > 0 ? (
            <>
              {/* Main Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="Total Visitors"
                  value={formatNumber(stats.totalVisitors)}
                  icon="👥"
                />
                <StatCard
                  title="Total Page Views"
                  value={formatNumber(stats.totalPageViews)}
                  icon="👁️"
                />
                <StatCard
                  title="Unique Visitors"
                  value={formatNumber(stats.uniqueVisitors)}
                  icon="🔢"
                />
                <StatCard
                  title="Avg. Time on Page"
                  value={formatTime(stats.averageTimeOnPage)}
                  icon="⏱️"
                />
              </div>

              {/* Top Pages */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Top Pages
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">
                          Page
                        </th>
                        <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">
                          Views
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topPages.map((item, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="py-3 px-4 text-gray-900 dark:text-white">
                            {item.page}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                            {formatNumber(item.views)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Top Countries */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Top Countries
                  </h2>
                  <div className="space-y-3">
                    {stats.topCountries.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        <span className="text-gray-900 dark:text-white">{item.country}</span>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                          {formatNumber(item.visitors)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Devices */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Top Devices
                  </h2>
                  <div className="space-y-3">
                    {stats.topDevices.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        <span className="text-gray-900 dark:text-white capitalize">
                          {item.device}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                          {formatNumber(item.count)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Browsers */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Top Browsers
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.topBrowsers.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <span className="text-gray-900 dark:text-white">{item.browser}</span>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        {formatNumber(item.count)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visitors by Date Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Visitors by Date
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">
                          Date
                        </th>
                        <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">
                          Visitors
                        </th>
                        <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">
                          Page Views
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.visitorsByDate.map((item, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="py-3 px-4 text-gray-900 dark:text-white">
                            {formatDate(item.date)}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                            {formatNumber(item.visitors)}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                            {formatNumber(item.pageViews)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : stats && stats.totalPageViews === 0 ? (
            <div className="text-center py-12">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  No Analytics Data Available
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                  There is no tracking data for the selected time range. This could be because:
                </p>
                <ul className="text-left text-yellow-700 dark:text-yellow-300 space-y-2 mb-4">
                  <li>• MongoDB connection is not established (check IP whitelist)</li>
                  <li>• No visitors have accessed the site yet</li>
                  <li>• The selected time range has no data</li>
                </ul>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Data will appear here once visitors start accessing your site and MongoDB is connected.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default Statistics;

