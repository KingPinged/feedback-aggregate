import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { api } from '../api/client';
import type { ToastMessage } from '../components/Toast';

interface SyncState {
  isAutoSyncEnabled: boolean;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  newIssueIds: Set<string>;
  newFeedbackIds: Set<string>;
  syncInterval: number; // in seconds
}

interface SyncContextType extends SyncState {
  toggleAutoSync: () => void;
  setSyncInterval: (seconds: number) => void;
  triggerSync: () => Promise<void>;
  markIssueAsRead: (id: string) => void;
  markFeedbackAsRead: (id: string) => void;
  markAllAsRead: () => void;
  isIssueNew: (id: string) => boolean;
  isFeedbackNew: (id: string) => boolean;
  newItemsCount: number;
}

interface SyncProviderProps {
  children: React.ReactNode;
  onToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

const SyncContext = createContext<SyncContextType | null>(null);

export function SyncProvider({ children, onToast }: SyncProviderProps) {
  const [state, setState] = useState<SyncState>({
    isAutoSyncEnabled: true,
    isSyncing: false,
    lastSyncAt: null,
    newIssueIds: new Set(),
    newFeedbackIds: new Set(),
    syncInterval: 30, // 30 seconds default
  });

  const intervalRef = useRef<number | null>(null);
  const isInitialLoadRef = useRef(true);
  const knownIssueIdsRef = useRef<Set<string>>(new Set());
  const knownFeedbackIdsRef = useRef<Set<string>>(new Set());

  const triggerSync = useCallback(async () => {
    if (state.isSyncing) return;

    setState((prev) => ({ ...prev, isSyncing: true }));

    try {
      // Run the full pipeline
      const result = await api.feedback.ingest();

      // Get current data
      const [issuesData, feedbackData] = await Promise.all([
        api.issues.list({ limit: 100 }),
        api.feedback.list({ limit: 100 }),
      ]);

      const currentIssueIds = new Set(issuesData.issues.map((i) => i.id));
      const currentFeedbackIds = new Set(feedbackData.feedback.map((f) => f.id));

      if (!isInitialLoadRef.current) {
        // Find genuinely new items (not seen before)
        const genuinelyNewIssueIds = issuesData.issues
          .filter((issue) => !knownIssueIdsRef.current.has(issue.id))
          .map((issue) => issue.id);

        const genuinelyNewFeedbackIds = feedbackData.feedback
          .filter((fb) => !knownFeedbackIdsRef.current.has(fb.id))
          .map((fb) => fb.id);

        // Only update state and notify if there are genuinely new items
        if (genuinelyNewIssueIds.length > 0 || genuinelyNewFeedbackIds.length > 0) {
          setState((prev) => ({
            ...prev,
            newIssueIds: new Set([...prev.newIssueIds, ...genuinelyNewIssueIds]),
            newFeedbackIds: new Set([...prev.newFeedbackIds, ...genuinelyNewFeedbackIds]),
          }));

          // Show toast notification only for genuinely new items
          if (genuinelyNewIssueIds.length > 0) {
            onToast({
              type: 'info',
              title: `${genuinelyNewIssueIds.length} New Issue${genuinelyNewIssueIds.length > 1 ? 's' : ''} Created`,
              message: `${result.processed} feedback items processed`,
              duration: 6000,
            });
          } else if (genuinelyNewFeedbackIds.length > 0) {
            onToast({
              type: 'success',
              title: `${genuinelyNewFeedbackIds.length} New Feedback Synced`,
              message: 'Processing with AI...',
              duration: 4000,
            });
          }
        }
        // No toast for "no new items" - less noisy
      } else {
        isInitialLoadRef.current = false;
        onToast({
          type: 'success',
          title: 'Initial Sync Complete',
          message: `${issuesData.total} issues, ${feedbackData.feedback.length} feedback items`,
          duration: 3000,
        });
      }

      // Update known IDs
      knownIssueIdsRef.current = currentIssueIds;
      knownFeedbackIdsRef.current = currentFeedbackIds;

      setState((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncAt: new Date(),
      }));
    } catch (error) {
      console.error('Sync failed:', error);
      onToast({
        type: 'error',
        title: 'Sync Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000,
      });
      setState((prev) => ({ ...prev, isSyncing: false }));
    }
  }, [state.isSyncing, onToast]);

  // Auto-sync effect
  useEffect(() => {
    if (state.isAutoSyncEnabled) {
      // Initial sync
      triggerSync();

      // Set up interval
      intervalRef.current = window.setInterval(() => {
        triggerSync();
      }, state.syncInterval * 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.isAutoSyncEnabled, state.syncInterval]);

  const toggleAutoSync = useCallback(() => {
    setState((prev) => {
      const newEnabled = !prev.isAutoSyncEnabled;
      if (!newEnabled && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return { ...prev, isAutoSyncEnabled: newEnabled };
    });
  }, []);

  const setSyncInterval = useCallback((seconds: number) => {
    setState((prev) => ({ ...prev, syncInterval: seconds }));
  }, []);

  const markIssueAsRead = useCallback((id: string) => {
    setState((prev) => {
      const newSet = new Set(prev.newIssueIds);
      newSet.delete(id);
      return { ...prev, newIssueIds: newSet };
    });
  }, []);

  const markFeedbackAsRead = useCallback((id: string) => {
    setState((prev) => {
      const newSet = new Set(prev.newFeedbackIds);
      newSet.delete(id);
      return { ...prev, newFeedbackIds: newSet };
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setState((prev) => ({
      ...prev,
      newIssueIds: new Set(),
      newFeedbackIds: new Set(),
    }));
  }, []);

  const isIssueNew = useCallback(
    (id: string) => state.newIssueIds.has(id),
    [state.newIssueIds]
  );

  const isFeedbackNew = useCallback(
    (id: string) => state.newFeedbackIds.has(id),
    [state.newFeedbackIds]
  );

  const newItemsCount = state.newIssueIds.size + state.newFeedbackIds.size;

  return (
    <SyncContext.Provider
      value={{
        ...state,
        toggleAutoSync,
        setSyncInterval,
        triggerSync,
        markIssueAsRead,
        markFeedbackAsRead,
        markAllAsRead,
        isIssueNew,
        isFeedbackNew,
        newItemsCount,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}
