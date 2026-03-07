'use client';

import { useAuthStore } from '@/stores/auth-store';

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Welcome back, {user?.firstName}
      </h1>
      <p className="text-gray-500 mb-8">
        Here&apos;s an overview of your recent activity.
      </p>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <p className="text-sm font-medium text-gray-500">Active Projects</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-gray-500">Pending Bids</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-gray-500">AI Sheets Processed</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
        </div>
      </div>

      {/* Empty state */}
      <div className="card p-12 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Create your first project
        </h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Upload a blueprint PDF and let FinishVision&apos;s AI count your doors,
          windows, and trim items automatically.
        </p>
        <a href="/dashboard/projects" className="btn-primary inline-block">
          New Project
        </a>
      </div>
    </div>
  );
}
