import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/layout';
import { api } from '../api/client';
import type { IssueDetail as IssueDetailType, User, Action } from '../api/client';

export function IssueDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [issue, setIssue] = useState<IssueDetailType | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadIssue();
      loadUsers();
    }
  }, [id]);

  async function loadIssue() {
    try {
      const data = await api.issues.get(id!);
      setIssue(data);
    } catch (error) {
      console.error('Failed to load issue:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    try {
      const data = await api.users.list();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }

  async function handleStatusChange(status: string) {
    if (!id) return;
    setActionLoading(true);
    try {
      await api.issues.updateStatus(id, status);
      await loadIssue();
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAssign(userId: string) {
    if (!id) return;
    setActionLoading(true);
    try {
      await api.issues.assign(id, userId);
      await loadIssue();
      setShowAssignModal(false);
    } catch (error) {
      console.error('Failed to assign:', error);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCreateTicket(data: { title: string; description: string; priority: string }) {
    if (!id) return;
    setActionLoading(true);
    try {
      const result = await api.actions.createTicket(id, data);
      alert(`JIRA ticket created: ${result.ticketId}\n${result.ticketUrl}`);
      await loadIssue();
      setShowTicketModal(false);
    } catch (error) {
      console.error('Failed to create ticket:', error);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResolve(resolution: string) {
    if (!id) return;
    setActionLoading(true);
    try {
      await api.actions.resolve(id, resolution);
      await loadIssue();
      setShowResolveModal(false);
    } catch (error) {
      console.error('Failed to resolve:', error);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!issue) {
    return <div className="p-6">Issue not found</div>;
  }

  const priorityColors: Record<string, string> = {
    critical: 'bg-red-600',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  };

  return (
    <div>
      <Header
        title={issue.title}
        subtitle={`${issue.category} • Created ${new Date(issue.created_at).toLocaleDateString()}`}
        actions={
          <button
            onClick={() => navigate('/issues')}
            className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Back to Issues
          </button>
        }
      />

      <div className="p-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Summary</h2>
              <p className="text-slate-700">{issue.summary || issue.description}</p>

              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
                <div>
                  <p className="text-sm text-slate-500">Severity Score</p>
                  <p className="text-2xl font-bold">{issue.current_severity.toFixed(1)}</p>
                  <p className="text-xs text-slate-400">Base: {issue.base_severity.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Sentiment</p>
                  <p className="text-lg font-semibold capitalize">{issue.sentiment || 'Unknown'}</p>
                  {issue.sentiment_score !== null && (
                    <p className="text-xs text-slate-400">Score: {issue.sentiment_score.toFixed(2)}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-500">Feedback Count</p>
                  <p className="text-2xl font-bold">{issue.feedback_count}</p>
                </div>
              </div>
            </div>

            {/* Feedback Items */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Related Feedback ({issue.feedback.length})</h2>
              <div className="space-y-4">
                {issue.feedback.map((fb) => (
                  <div key={fb.id} className="border border-slate-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{fb.author_name || 'Anonymous'}</span>
                      <span className="text-sm text-slate-500">
                        {new Date(fb.source_created_at || fb.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-700">{fb.content}</p>
                    <div className="flex gap-2 mt-2">
                      {fb.category && (
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{fb.category}</span>
                      )}
                      {fb.sentiment && (
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{fb.sentiment}</span>
                      )}
                    </div>
                  </div>
                ))}
                {issue.feedback.length === 0 && (
                  <p className="text-slate-500 text-center py-4">No feedback linked to this issue</p>
                )}
              </div>
            </div>

            {/* Action History */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Action History</h2>
              <div className="space-y-3">
                {issue.actions.map((action) => (
                  <ActionItem key={action.id} action={action} />
                ))}
                {issue.actions.length === 0 && (
                  <p className="text-slate-500 text-center py-4">No actions taken yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Priority</span>
                  <span className={`px-3 py-1 rounded text-white text-sm font-medium ${priorityColors[issue.priority]}`}>
                    {issue.priority.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Status</span>
                  <select
                    value={issue.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={actionLoading}
                    className="px-3 py-1 border rounded text-sm"
                  >
                    <option value="new">New</option>
                    <option value="triaged">Triaged</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                    <option value="wont_fix">Won't Fix</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Assigned To</span>
                  <span className="text-sm">
                    {issue.assignedUser?.name || 'Unassigned'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Assign to User
                </button>
                <button
                  onClick={() => setShowTicketModal(true)}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Create JIRA Ticket
                </button>
                <button
                  onClick={() => setShowResolveModal(true)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Mark Resolved
                </button>
              </div>
            </div>

            {/* Timeline Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Timeline</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">First Reported</span>
                  <span>{issue.first_reported_at ? new Date(issue.first_reported_at).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Created</span>
                  <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Updated</span>
                  <span>{new Date(issue.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAssignModal && (
        <Modal title="Assign Issue" onClose={() => setShowAssignModal(false)}>
          <div className="space-y-4">
            <p className="text-slate-600">Select a user to assign this issue to:</p>
            <div className="space-y-2">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleAssign(user.id)}
                  disabled={actionLoading}
                  className="w-full p-3 text-left border rounded-lg hover:bg-slate-50"
                >
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-slate-500">{user.email} • {user.role}</p>
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {showTicketModal && (
        <Modal title="Create JIRA Ticket" onClose={() => setShowTicketModal(false)}>
          <TicketForm
            issue={issue}
            onSubmit={handleCreateTicket}
            loading={actionLoading}
          />
        </Modal>
      )}

      {showResolveModal && (
        <Modal title="Resolve Issue" onClose={() => setShowResolveModal(false)}>
          <ResolveForm onSubmit={handleResolve} loading={actionLoading} />
        </Modal>
      )}
    </div>
  );
}

function ActionItem({ action }: { action: Action }) {
  const typeIcons: Record<string, string> = {
    jira_ticket: '🎫',
    assignment: '👤',
    status_change: '🔄',
    resolution: '✅',
    comment: '💬',
  };

  return (
    <div className="flex items-start gap-3 p-3 border border-slate-100 rounded-lg">
      <span className="text-xl">{typeIcons[action.type] || '📌'}</span>
      <div className="flex-1">
        <p className="font-medium capitalize">{action.type.replace('_', ' ')}</p>
        {action.external_url && (
          <a href={action.external_url} target="_blank" rel="noopener" className="text-blue-600 text-sm">
            {action.external_id}
          </a>
        )}
        <p className="text-xs text-slate-500 mt-1">
          {new Date(action.created_at).toLocaleString()}
          {action.performed_by_name && ` • ${action.performed_by_name}`}
        </p>
      </div>
      <span className={`px-2 py-0.5 rounded text-xs ${
        action.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-slate-100'
      }`}>
        {action.status}
      </span>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function TicketForm({
  issue,
  onSubmit,
  loading
}: {
  issue: IssueDetailType;
  onSubmit: (data: { title: string; description: string; priority: string }) => void;
  loading: boolean;
}) {
  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(issue.summary || issue.description || '');
  const [priority, setPriority] = useState(issue.priority === 'critical' ? 'Highest' : 'High');

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ title, description, priority }); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Priority</label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="Highest">Highest</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Ticket'}
      </button>
    </form>
  );
}

function ResolveForm({ onSubmit, loading }: { onSubmit: (resolution: string) => void; loading: boolean }) {
  const [resolution, setResolution] = useState('');

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(resolution); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Resolution Notes</label>
        <textarea
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          rows={4}
          placeholder="Describe how this issue was resolved..."
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>
      <button
        type="submit"
        disabled={loading || !resolution.trim()}
        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Resolving...' : 'Mark as Resolved'}
      </button>
    </form>
  );
}
