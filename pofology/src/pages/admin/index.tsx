import { NextPage } from 'next';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { isValidAuthToken, getAuthToken } from '@/lib/auth';
import AppLayout from '@/layouts/AppLayout';

const Dashboard: NextPage = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication on client side
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('admin_auth_token');
      if (token && isValidAuthToken(token)) {
        setIsAuthenticated(true);
      } else {
        router.push('/admin/login');
      }
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('admin_auth_token');
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <AppLayout title="Admin">
        <div className="flex min-h-screen items-center justify-center">
          <p>Đang tải...</p>
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppLayout title="Admin Dashboard">
      <div className="container mx-auto py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          >
            Đăng xuất
          </button>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
          <p className="mb-4 text-gray-600 dark:text-gray-300">Chào mừng đến với trang quản trị!</p>
          <Link href="/admin/statistics">
            <a className="inline-block rounded bg-primary-500 px-6 py-2 text-white hover:bg-primary-600">
              Xem Thống Kê Truy Cập
            </a>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
