import { useEffect, useState } from 'react';
import { Header } from '../components/layout';
import { api } from '../api/client';
import type { Provider } from '../api/client';

export function Providers() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    loadProviders();
  }, []);

  async function loadProviders() {
    try {
      const data = await api.providers.list();
      setProviders(data);
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSync(providerId: string) {
    setSyncing(providerId);
    try {
      await api.providers.sync(providerId);
      await loadProviders();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(null);
    }
  }

  async function handleTest(providerId: string) {
    try {
      const result = await api.providers.test(providerId);
      alert(result.healthy ? 'Connection successful!' : 'Connection failed');
    } catch (error) {
      alert('Connection test failed');
    }
  }

  const providerIcons: Record<string, string> = {
    discord: '💬',
    slack: '📱',
    github: '🐙',
    twitter: '🐦',
    support: '🎫',
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-slate-100 text-slate-600',
    error: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <Header
        title="Providers"
        subtitle="Manage your feedback sources"
      />

      <div className="p-6">
        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading providers...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
              <div key={provider.id} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{providerIcons[provider.type] || '📌'}</span>
                    <div>
                      <h3 className="font-semibold text-lg">{provider.name}</h3>
                      <p className="text-sm text-slate-500 capitalize">{provider.type}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[provider.status]}`}>
                    {provider.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Feedback Items</span>
                    <span className="font-medium">{provider.feedback_count || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Last Sync</span>
                    <span className="font-medium">
                      {provider.last_sync_at
                        ? new Date(provider.last_sync_at).toLocaleString()
                        : 'Never'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleSync(provider.id)}
                    disabled={syncing === provider.id}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {syncing === provider.id ? 'Syncing...' : 'Sync Now'}
                  </button>
                  <button
                    onClick={() => handleTest(provider.id)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
                  >
                    Test
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
