import { useEffect, useState } from 'react';
import { Header } from '../components/layout';
import { api } from '../api/client';
import type { Feedback as FeedbackType, Provider } from '../api/client';
import { useSync } from '../context/SyncContext';
import { NewBadge } from '../components/NewBadge';

export function Feedback() {
  const [feedback, setFeedback] = useState<FeedbackType[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState('');
  const { isFeedbackNew, markFeedbackAsRead, newFeedbackIds } = useSync();

  useEffect(() => {
    loadData();
  }, [selectedProvider]);

  async function loadData() {
    try {
      const [feedbackData, providersData] = await Promise.all([
        api.feedback.list({ providerId: selectedProvider || undefined }),
        api.providers.list(),
      ]);
      setFeedback(feedbackData.feedback);
      setProviders(providersData);
    } catch (error) {
      console.error('Failed to load feedback:', error);
    } finally {
      setLoading(false);
    }
  }

  const providerIcons: Record<string, string> = {
    discord: '💬',
    slack: '📱',
    github: '🐙',
    twitter: '🐦',
    support: '🎫',
  };

  const sentimentColors: Record<string, string> = {
    positive: 'bg-green-100 text-green-700',
    negative: 'bg-red-100 text-red-700',
    neutral: 'bg-slate-100 text-slate-700',
    mixed: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div>
      <Header
        title="Feedback"
        subtitle={`${feedback.length} items from all sources`}
      />

      <div className="p-6">
        {/* Filter by Provider */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedProvider('')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !selectedProvider ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200'
              }`}
            >
              All Sources
            </button>
            {providers.map((provider) => (
              <button
                key={provider.id}
                onClick={() => setSelectedProvider(provider.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  selectedProvider === provider.id ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200'
                }`}
              >
                <span>{providerIcons[provider.type] || '📌'}</span>
                <span>{provider.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Feedback List */}
        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading feedback...</div>
        ) : feedback.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No feedback found. Try syncing from the Dashboard.
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {feedback.map((item) => {
                const provider = providers.find(p => p.id === item.provider_id);
                const isNew = isFeedbackNew(item.id);
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-xl p-5 shadow-sm cursor-pointer transition-all ${isNew ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                    onClick={() => markFeedbackAsRead(item.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{providerIcons[provider?.type || ''] || '📌'}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{item.author_name || 'Anonymous'}</p>
                            {isNew && <NewBadge />}
                          </div>
                          <p className="text-sm text-slate-500">{provider?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.sentiment && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${sentimentColors[item.sentiment]}`}>
                            {item.sentiment}
                          </span>
                        )}
                        {item.category && (
                          <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium">
                            {item.category}
                          </span>
                        )}
                      </div>
                    </div>

                    {item.title && (
                      <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                    )}

                    <p className="text-slate-700 whitespace-pre-wrap">{item.content}</p>

                    <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-slate-500">
                      <span>
                        {new Date(item.source_created_at || item.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            {newFeedbackIds.size > 0 && (
              <div className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg animate-bounce">
                <span className="font-semibold">{newFeedbackIds.size} new feedback</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
