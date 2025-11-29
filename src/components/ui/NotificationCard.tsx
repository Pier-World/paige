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
  info: { icon: Info, color: 'bg-blue-100 text-blue-800 border-blue-200' },
  alert: { icon: AlertCircle, color: 'bg-orange-100 text-orange-800 border-orange-200' },
  success: { icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-200' },
  error: { icon: XCircle, color: 'bg-red-100 text-red-800 border-red-200' },
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
    <div className={`bg-white border rounded-lg p-4 transition-all ${
      isUnread ? `${typeColor} border-2` : 'border-gray-200'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${typeColor} flex items-center justify-center`}>
          <TypeIcon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900">{notification.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
            </div>
            {isUnread && (
              <button
                onClick={handleMarkRead}
                className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Mark as read"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {notification.action_url && notification.action_label && (
            <a
              href={notification.action_url}
              className="mt-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              {notification.action_label} →
            </a>
          )}
          <p className="text-xs text-gray-500 mt-2">
            {new Date(notification.created_at).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

