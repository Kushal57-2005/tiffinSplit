import React, { useState, useEffect } from 'react';
import { History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import { EmptyState } from '../components/UI/EmptyState';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {logs.map((log) => {
              const dateStr = new Date(log.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric'
              });
              const timeStr = new Date(log.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div key={log.id} className="timeline-item" style={{ flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                    <div className="timeline-dot" />
                    <strong style={{ fontSize: '0.88rem', fontWeight: '600' }}>
                      {log.user ? log.user.name : 'System'}
                    </strong>
                    <span className="timeline-time text-util" style={{ fontSize: '0.78rem', marginLeft: 'auto' }}>
                      {dateStr} {timeStr}
                    </span>
                    <Badge variant="neutral" style={{ fontSize: '0.7rem' }}>
                      {log.action.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div style={{ paddingLeft: '1.25rem' }}>
                    <p className="text-break" style={{ fontSize: '0.88rem', color: 'var(--text)', margin: 0, lineHeight: 1.4 }}>
                      {log.message}
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
