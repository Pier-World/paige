import React from 'react';
import { Clock, CheckCircle2, AlertCircle, User } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'awaiting_human' | 'completed' | 'failed';
  assigned_agent?: string;
  requires_human?: boolean;
  created_at: string;
  due_date?: string;
  priority?: number;
}

interface TaskCardProps {
  task: Task;
  variant?: 'compact' | 'detailed';
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: Clock },
  awaiting_human: { label: 'Needs Review', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, variant = 'detailed' }) => {
  const StatusIcon = statusConfig[task.status]?.icon || Clock;
  const statusLabel = statusConfig[task.status]?.label || task.status;
  const statusColor = statusConfig[task.status]?.color || 'bg-gray-100 text-gray-800';

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

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
    return formatDate(dateString);
  };

  if (variant === 'compact') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">{task.title}</h4>
            {task.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">{task.description}</p>
            )}
          </div>
          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${statusColor} flex items-center gap-1`}>
            <StatusIcon className="w-3 h-3" />
            {statusLabel}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
          )}
        </div>
        <span className={`ml-4 px-3 py-1 rounded-full text-xs font-medium ${statusColor} flex items-center gap-1`}>
          <StatusIcon className="w-3 h-3" />
          {statusLabel}
        </span>
      </div>

      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
        {task.assigned_agent && (
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span className="capitalize">{task.assigned_agent}</span>
          </div>
        )}
        {task.due_date && (
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>Due {formatDate(task.due_date)}</span>
          </div>
        )}
        <span>{timeAgo(task.created_at)}</span>
      </div>

      {task.requires_human && (
        <div className="mt-3 px-3 py-2 bg-orange-50 border border-orange-200 rounded-md">
          <div className="flex items-center gap-2 text-orange-800">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Needs Review</span>
          </div>
        </div>
      )}
    </div>
  );
};

