import { useSync } from '../context/SyncContext';

export function SyncStatus() {
  const {
    isAutoSyncEnabled,
    isSyncing,
    lastSyncAt,
    syncInterval,
    newItemsCount,
    toggleAutoSync,
    setSyncInterval,
    triggerSync,
    markAllAsRead,
  } = useSync();

  return (
    <div className="bg-slate-800 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white">Live Sync</span>
        <button
          onClick={toggleAutoSync}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            isAutoSyncEnabled ? 'bg-green-500' : 'bg-slate-600'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
              isAutoSyncEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {isAutoSyncEnabled && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Interval:</span>
            <select
              value={syncInterval}
              onChange={(e) => setSyncInterval(Number(e.target.value))}
              className="bg-slate-700 text-white text-xs rounded px-2 py-1 border-none"
            >
              <option value={15}>15s</option>
              <option value={30}>30s</option>
              <option value={60}>1m</option>
              <option value={300}>5m</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            {isSyncing ? (
              <>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span>
                  Last: {lastSyncAt ? formatTimeAgo(lastSyncAt) : 'Never'}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => triggerSync()}
        disabled={isSyncing}
        className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
      >
        {isSyncing ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Syncing...
          </>
        ) : (
          <>
            <span>↻</span>
            Sync Now
          </>
        )}
      </button>

      {newItemsCount > 0 && (
        <div className="flex items-center justify-between bg-blue-600/20 rounded-lg px-3 py-2">
          <span className="text-sm text-blue-300">
            {newItemsCount} new item{newItemsCount > 1 ? 's' : ''}
          </span>
          <button
            onClick={markAllAsRead}
            className="text-xs text-blue-400 hover:text-blue-300 underline"
          >
            Mark all read
          </button>
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return date.toLocaleDateString();
}
