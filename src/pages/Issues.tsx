import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/layout';
import { api } from '../api/client';
import type { Issue } from '../api/client';
import { useSync } from '../context/SyncContext';
import { NewBadge } from '../components/NewBadge';

export function Issues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    sortBy: 'current_severity',
    sortOrder: 'DESC',
  });

  useEffect(() => {
    loadIssues();
  }, [filters]);

  async function loadIssues() {
    try {
      const result = await api.issues.list(filters);
      setIssues(result.issues);
    } catch (error) {
      console.error('Failed to load issues:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Header
        title="Issues"
        subtitle={`${issues.length} issues found`}
      />

      <div className="p-6">
        {/* Filters */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex gap-4 flex-wrap">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="">All Status</option>
              <option value="new">New</option>
              <option value="triaged">Triaged</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="">All Priority</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="">All Categories</option>
              <option value="bug">Bug</option>
              <option value="feature_request">Feature Request</option>
              <option value="complaint">Complaint</option>
              <option value="question">Question</option>
              <option value="praise">Praise</option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="current_severity">Sort by Severity</option>
              <option value="created_at">Sort by Date</option>
              <option value="feedback_count">Sort by Feedback Count</option>
            </select>

            <select
              value={filters.sortOrder}
              onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value })}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="DESC">Descending</option>
              <option value="ASC">Ascending</option>
            </select>
          </div>
        </div>

        {/* Issues List */}
        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading issues...</div>
        ) : issues.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No issues found. Try syncing feedback from the Dashboard.
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {issues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
            <NewItemsFloatingIndicator />
          </>
        )}
      </div>
    </div>
  );
}

function IssueCard({ issue }: { issue: Issue }) {
  const { isIssueNew, markIssueAsRead } = useSync();
  const isNew = isIssueNew(issue.id);

  const priorityColors: Record<string, string> = {
    critical: 'border-l-red-500 bg-red-50',
    high: 'border-l-orange-500 bg-orange-50',
    medium: 'border-l-yellow-500 bg-yellow-50',
    low: 'border-l-green-500 bg-green-50',
  };

  const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    triaged: 'bg-purple-100 text-purple-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-slate-100 text-slate-600',
  };

  const categoryIcons: Record<string, string> = {
    bug: '🐛',
    feature_request: '✨',
    complaint: '😤',
    question: '❓',
    praise: '🎉',
  };

  return (
    <Link
      to={`/issues/${issue.id}`}
      onClick={() => markIssueAsRead(issue.id)}
      className={`block bg-white rounded-xl p-4 shadow-sm border-l-4 hover:shadow-md transition-shadow ${priorityColors[issue.priority] || ''} ${isNew ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span>{categoryIcons[issue.category || ''] || '📋'}</span>
            <h3 className="font-semibold text-slate-900 truncate">{issue.title}</h3>
            {isNew && <NewBadge />}
          </div>
          <p className="text-sm text-slate-600 line-clamp-2">{issue.summary || issue.description}</p>
          <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
            <span>📊 {issue.feedback_count} feedback</span>
            <span>📅 {new Date(issue.created_at).toLocaleDateString()}</span>
            {issue.sentiment && (
              <span>
                {issue.sentiment === 'negative' ? '😠' : issue.sentiment === 'positive' ? '😊' : '😐'}
                {' '}{issue.sentiment}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 ml-4">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[issue.status] || 'bg-slate-100'}`}>
              {issue.status.replace('_', ' ')}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-bold ${
              issue.priority === 'critical' ? 'bg-red-600 text-white' :
              issue.priority === 'high' ? 'bg-orange-500 text-white' :
              issue.priority === 'medium' ? 'bg-yellow-500 text-white' :
              'bg-green-500 text-white'
            }`}>
              {issue.current_severity.toFixed(1)}
            </span>
          </div>
          <span className="text-xs text-slate-500 uppercase">{issue.priority}</span>
        </div>
      </div>
    </Link>
  );
}

function NewItemsFloatingIndicator() {
  const { newIssueIds } = useSync();
  const count = newIssueIds.size;

  if (count === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg animate-bounce">
      <span className="font-semibold">{count} new issue{count > 1 ? 's' : ''}</span>
    </div>
  );
}
