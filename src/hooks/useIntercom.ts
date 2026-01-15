import { useCallback } from 'react';

export function useIntercom() {
  const show = useCallback(() => {
    if (window.Intercom) {
      window.Intercom('show');
    } else {
      console.warn('Intercom not loaded yet');
    }
  }, []);

  const hide = useCallback(() => {
    if (window.Intercom) {
      window.Intercom('hide');
    }
  }, []);

  const showMessages = useCallback(() => {
    if (window.Intercom) {
      window.Intercom('showMessages');
    } else {
      console.warn('Intercom not loaded yet');
    }
  }, []);

  const showNewMessage = useCallback((prePopulatedMessage?: string) => {
    if (window.Intercom) {
      window.Intercom('showNewMessage', prePopulatedMessage);
    } else {
      console.warn('Intercom not loaded yet');
    }
  }, []);

  const update = useCallback((data: Record<string, any>) => {
    if (window.Intercom) {
      window.Intercom('update', data);
    }
  }, []);

  const trackEvent = useCallback((eventName: string, metadata?: Record<string, any>) => {
    if (window.Intercom) {
      window.Intercom('trackEvent', eventName, metadata);
    }
  }, []);

  const showArticle = useCallback((articleId: string) => {
    if (window.Intercom) {
      window.Intercom('showArticle', articleId);
    }
  }, []);

  return {
    show,
    hide,
    showMessages,
    showNewMessage,
    update,
    trackEvent,
    showArticle,
  };
}

// TypeScript declarations
declare global {
  interface Window {
    Intercom: any;
  }
}

