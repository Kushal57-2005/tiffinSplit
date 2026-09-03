import React, { useState, useEffect } from 'react';
import { History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import { EmptyState } from '../components/UI/EmptyState';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';

import { formatActivityAction, formatActivityMessage } from '../utils/activity';

export function Activity() {
  const { activeWorkspaceId, apiFetch } = useAuth();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeWorkspaceId) {
      setLoading(false);
      return;
    }

    const fetchLogs = async () => {
      setLoading(true);
      try {
        const data = await apiFetch(`/workspaces/${activeWorkspaceId}/activity?limit=100`);
        setLogs(data);
      } catch (err) {
        console.error('Failed to fetch activity logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [activeWorkspaceId]);

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h1>Household Activity History</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
          Chronological audit trail of all workspace actions for transparency and accountability
        </p>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching activity timeline..." />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={History}
          title="No activity recorded yet"
          description="Actions performed by household members will appear here automatically."
        />
      ) : (
        <Card title="Activity Timeline">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {logs.map((log) => {
              const dateStr = new Date(log.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric'
              });
              const timeStr = new Date(log.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });
              const actionText = formatActivityAction(log.action, log.message);
              const variant = log.action?.includes('REJECTED')
                ? 'danger'
                : log.action?.includes('REPORTED')
                ? 'warning'
                : log.action?.includes('VERIFIED')
                ? 'success'
                : 'neutral';

              return (
                <div key={log.id} className="timeline-item activity-timeline-item">
                  <div className="activity-item-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div className="timeline-dot" style={{ marginTop: 0 }} />
                      <strong style={{ fontSize: '0.88rem', fontWeight: '600' }}>
                        {log.user ? log.user.name : 'System'}
                      </strong>
                    </div>

                    <div className="activity-right-group">
                      <span className="timeline-time text-util" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {dateStr} {timeStr}
                      </span>
                      <Badge variant={variant} className="activity-flag-badge">
                        {actionText}
                      </Badge>
                    </div>
                  </div>

                  <div style={{ paddingLeft: '1.25rem', marginTop: '0.15rem' }}>
                    <p className="text-break" style={{ fontSize: '0.88rem', color: 'var(--text)', margin: 0, lineHeight: 1.4 }}>
                      {formatActivityMessage(log.message)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
