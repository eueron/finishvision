'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, loadUser, logout } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-900 text-white flex flex-col">
        <div className="px-6 py-5 border-b border-brand-700">
          <h1 className="text-xl font-bold">FinishVision</h1>
          <p className="text-xs text-brand-200 mt-1">{user?.companyName}</p>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <Link
            href="/dashboard"
            className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/projects"
            className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Projects
          </Link>
          <Link
            href="/dashboard/settings"
            className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Settings
          </Link>
        </nav>

        <div className="px-4 py-4 border-t border-brand-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-sm font-bold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="text-sm">
              <p className="font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-brand-200">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full text-left text-sm text-brand-200 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
