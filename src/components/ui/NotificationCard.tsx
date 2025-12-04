import React from 'react';
import { Info, AlertCircle, CheckCircle, XCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: 'info' | 'alert' | 'success' | 'error';
  action_url?: string;
  action_label?: string;
  read_at?: string;
  created_at: string;
}

interface NotificationCardProps {
  notification: Notification;
  onMarkRead?: (id: string) => void;
}

const typeConfig = {
  info: { icon: Info, color: 'bg-accent/10 text-accent border-accent/20' },
  alert: { icon: AlertCircle, color: 'bg-accent/10 text-accent border-accent/20' },
  success: { icon: CheckCircle, color: 'bg-accent/10 text-accent border-accent/20' },
  error: { icon: XCircle, color: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

export const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onMarkRead }) => {
  const TypeIcon = typeConfig[notification.notification_type]?.icon || Info;
  const typeColor = typeConfig[notification.notification_type]?.color || typeConfig.info.color;
  const isUnread = !notification.read_at;

  const handleMarkRead = async () => {
    if (notification.read_at) return;

    try {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notification.id);

      onMarkRead?.(notification.id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <div className={`bg-surface border rounded-xl p-4 transition-all ${
      isUnread ? `border-accent/40` : 'border-border'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${typeColor} flex items-center justify-center border`}>
          <TypeIcon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-text-primary" style={{ fontSize: '14px', fontWeight: 400 }}>
                {notification.title}
              </h4>
              <p className="text-text-secondary mt-1" style={{ fontSize: '13px', fontWeight: 300 }}>
                {notification.message}
              </p>
            </div>
            {isUnread && (
              <button
                onClick={handleMarkRead}
                className="ml-2 text-text-tertiary hover:text-text-primary transition-colors"
                aria-label="Mark as read"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {notification.action_url && notification.action_label && (
            <a
              href={notification.action_url}
              className="mt-2 inline-block text-sm font-medium text-accent hover:text-[#d4c4a6] transition-colors"
              style={{ fontSize: '13px', fontWeight: 400 }}
            >
              {notification.action_label} →
            </a>
          )}
          <p className="text-text-tertiary mt-2" style={{ fontSize: '11px', fontWeight: 300 }}>
            {new Date(notification.created_at).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

