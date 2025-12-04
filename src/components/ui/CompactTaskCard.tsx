import React from 'react';
import { Clock, CheckCircle2, AlertCircle, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'awaiting_human' | 'completed' | 'failed';
  assigned_agent?: string;
  created_at: string;
}

interface CompactTaskCardProps {
  task: Task;
  onClick?: () => void;
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-accent/10 text-accent', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-accent/10 text-accent', icon: Clock },
  awaiting_human: { label: 'Needs Review', color: 'bg-accent/10 text-accent', icon: AlertCircle },
  completed: { label: 'Completed', color: 'bg-green-500/10 text-green-400', icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'bg-red-500/10 text-red-400', icon: AlertCircle },
};

export const CompactTaskCard: React.FC<CompactTaskCardProps> = ({ task, onClick }) => {
  const StatusIcon = statusConfig[task.status]?.icon || Clock;
  const statusLabel = statusConfig[task.status]?.label || task.status;
  const statusColor = statusConfig[task.status]?.color || 'bg-gray-100 text-gray-800';

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const content = (
    <div className="bg-surface border border-border rounded-lg p-3 hover:border-accent/50 transition-all cursor-pointer group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusIcon className={`w-3.5 h-3.5 ${statusColor.includes('text-accent') ? 'text-accent' : statusColor.includes('text-green') ? 'text-green-400' : statusColor.includes('text-red') ? 'text-red-400' : 'text-text-secondary'}`} />
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`} style={{ fontSize: '11px', fontWeight: 400 }}>
              {statusLabel}
            </span>
          </div>
          <h4 className="text-text-primary truncate group-hover:text-accent transition-colors" style={{ fontSize: '13px', fontWeight: 400 }}>
            {task.title}
          </h4>
          {task.assigned_agent && (
            <div className="flex items-center gap-1 mt-1">
              <User className="w-3 h-3 text-text-tertiary" />
              <span className="text-text-tertiary capitalize" style={{ fontSize: '11px', fontWeight: 300 }}>
                {task.assigned_agent}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-text-tertiary" style={{ fontSize: '11px', fontWeight: 300 }}>
            {timeAgo(task.created_at)}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-text-tertiary group-hover:text-accent transition-colors" />
        </div>
      </div>
    </div>
  );

  if (onClick) {
    return <div onClick={onClick}>{content}</div>;
  }

  return (
    <Link to={`/conversation/${task.id}`}>
      {content}
    </Link>
  );
};

