import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { identifyMember, resetAnalytics } from '../lib/analytics';

export function PostHogIdentify() {
  const { user, isLoading } = useAuth();
  const identifiedId = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      identifyMember(user);
      identifiedId.current = user.id;
      return;
    }

    if (identifiedId.current) {
      resetAnalytics();
      identifiedId.current = null;
    }
  }, [user, isLoading]);

  return null;
}
