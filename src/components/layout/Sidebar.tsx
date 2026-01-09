import { Link, useLocation } from 'react-router-dom';
import { useSync } from '../../context/SyncContext';
import { SyncStatus } from '../SyncStatus';
import { UnreadCountBadge } from '../NewBadge';

export function Sidebar() {
  const location = useLocation();
  const { newIssueIds, newFeedbackIds } = useSync();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊', badge: 0 },
    { path: '/issues', label: 'Issues', icon: '🎫', badge: newIssueIds.size },
    { path: '/feedback', label: 'Feedback', icon: '💬', badge: newFeedbackIds.size },
    { path: '/providers', label: 'Providers', icon: '🔌', badge: 0 },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white h-screen sticky top-0 flex flex-col">
      <div className="p-4 pb-0 mb-4">
        <h1 className="text-xl font-bold">Feedback Hub</h1>
        <p className="text-slate-400 text-sm">PM Dashboard</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              <UnreadCountBadge count={item.badge} />
            </Link>
          );
        })}
      </nav>

      <div className="p-4 pt-4 border-t border-slate-700 flex-shrink-0">
        <SyncStatus />
      </div>
    </aside>
  );
}
