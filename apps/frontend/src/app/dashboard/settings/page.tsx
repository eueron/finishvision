'use client';

import { useEffect, useState } from 'react';
import { companyApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res: any = await companyApi.get();
        setCompany(res.data);
      } catch (err) {
        console.error('Failed to fetch company', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await companyApi.update({
        name: company.name,
        address: company.address,
        phone: company.phone,
        website: company.website,
        defaultMarkup: parseFloat(company.defaultMarkup) || 0,
        defaultTaxRate: parseFloat(company.defaultTaxRate) || 0,
      });
      setMessage('Settings saved successfully.');
    } catch (err) {
      setMessage('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Company Settings</h1>
      <p className="text-gray-500 mb-8">Manage your company profile and default values.</p>

      {message && (
        <div className={`px-4 py-3 rounded-lg mb-6 text-sm ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input
              value={company?.name || ''}
              onChange={(e) => setCompany({ ...company, name: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              value={company?.address || ''}
              onChange={(e) => setCompany({ ...company, address: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                value={company?.phone || ''}
                onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                value={company?.website || ''}
                onChange={(e) => setCompany({ ...company, website: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Default Values</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Markup (%)</label>
              <input
                type="number"
                step="0.01"
                value={company?.defaultMarkup || 0}
                onChange={(e) => setCompany({ ...company, defaultMarkup: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Tax Rate</label>
              <input
                type="number"
                step="0.0001"
                value={company?.defaultTaxRate || 0}
                onChange={(e) => setCompany({ ...company, defaultTaxRate: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Subscription</h2>
          <p className="text-sm text-gray-500">
            Current plan: <span className="font-semibold text-brand-600">{company?.subscriptionTier}</span>
          </p>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Your Account</h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Name: {user?.firstName} {user?.lastName}</p>
            <p>Email: {user?.email}</p>
            <p>Role: {user?.role}</p>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
