import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line, CartesianGrid
} from 'recharts';
import { Header } from '../components/layout';
import { api } from '../api/client';
import type { DashboardOverview, SeverityData, TrendData } from '../api/client';

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

export function Dashboard() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [severity, setSeverity] = useState<SeverityData[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [overviewData, severityData, trendsData] = await Promise.all([
        api.dashboard.getOverview(),
        api.dashboard.getSeverity(),
        api.dashboard.getTrends(),
      ]);
      setOverview(overviewData);
      setSeverity(severityData);
      setTrends(trendsData);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await api.feedback.ingest();
      await loadData();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle="Overview of feedback and issues"
        actions={
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : 'Sync & Process'}
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-4 gap-4">
          <MetricCard
            label="Total Issues"
            value={overview?.metrics.totalIssues || 0}
            color="blue"
          />
          <MetricCard
            label="Open Issues"
            value={overview?.metrics.openIssues || 0}
            color="yellow"
          />
          <MetricCard
            label="Critical"
            value={overview?.metrics.criticalIssues || 0}
            color="red"
          />
          <MetricCard
            label="Total Feedback"
            value={overview?.metrics.totalFeedback || 0}
            color="green"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-6">
          {/* Severity Distribution */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Issue Priority Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severity as unknown as Array<Record<string, unknown>>}
                    dataKey="count"
                    nameKey="priority"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ payload }) => `${payload.priority}: ${payload.count}`}
                  >
                    {severity.map((entry) => (
                      <Cell
                        key={entry.priority}
                        fill={PRIORITY_COLORS[entry.priority] || '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Feedback Trends */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Feedback Trends (30 days)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(d) => new Date(d).toLocaleDateString()}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Issues & Providers */}
        <div className="grid grid-cols-2 gap-6">
          {/* Top Issues */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Top Issues by Severity</h3>
            <div className="space-y-3">
              {overview?.topIssues.slice(0, 5).map((issue) => (
                <Link
                  key={issue.id}
                  to={`/issues/${issue.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-slate-100"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{issue.title}</p>
                    <p className="text-sm text-slate-500">{issue.category}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <SeverityBadge severity={issue.current_severity} priority={issue.priority} />
                  </div>
                </Link>
              ))}
              {(!overview?.topIssues || overview.topIssues.length === 0) && (
                <p className="text-slate-500 text-center py-4">No issues yet. Click "Sync & Process" to get started.</p>
              )}
            </div>
          </div>

          {/* Provider Status */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Provider Status</h3>
            <div className="space-y-3">
              {overview?.providers.map((provider) => (
                <div
                  key={provider.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <ProviderIcon type={provider.type} />
                    <div>
                      <p className="font-medium text-slate-900">{provider.name}</p>
                      <p className="text-sm text-slate-500">
                        {provider.feedback_count || 0} items
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={provider.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    green: 'bg-green-50 text-green-600 border-green-200',
  };

  return (
    <div className={`rounded-xl p-6 border ${colorClasses[color]}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

function SeverityBadge({ severity, priority }: { severity: number; priority: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[priority] || 'bg-slate-100'}`}>
      {severity.toFixed(1)}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-slate-100 text-slate-600',
    error: 'bg-red-100 text-red-700',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || 'bg-slate-100'}`}>
      {status}
    </span>
  );
}

function ProviderIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    discord: '💬',
    slack: '📱',
    github: '🐙',
    twitter: '🐦',
    support: '🎫',
  };

  return (
    <span className="text-2xl">{icons[type] || '📌'}</span>
  );
}
