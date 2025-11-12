let isInitialized = false;
let initCallbacks: Array<() => void> = [];

declare global {
  interface Window {
    FrontChat?: (...args: any[]) => void;
  }
}

export interface FrontChatUser {
  email: string;
  name?: string;
  id: string;
  membership_tier?: string;
  front_user_hash?: string | null;
}

export function loadFrontScript(chatId: string): void {
  if (typeof window === 'undefined') return;
  if (document.getElementById('front-chat-script')) return;
  if (!chatId) return;

  const script = document.createElement('script');
  script.id = 'front-chat-script';
  script.async = true;
  script.src = 'https://chat-assets.frontapp.com/v1/chat.bundle.js';
  document.head.appendChild(script);
}

export function initFrontChat(user: FrontChatUser): void {
  if (typeof window === 'undefined') return;
  if (isInitialized) return;

  const chatId = import.meta.env.VITE_FRONT_CHAT_ID;
  if (!chatId) {
    console.warn('VITE_FRONT_CHAT_ID not configured');
    return;
  }

  const waitForFrontChat = setInterval(() => {
    if (window.FrontChat) {
      clearInterval(waitForFrontChat);

      const config: Record<string, any> = {
        chatId,
        useDefaultLauncher: false,
        shouldShowWindowOnLaunch: false,
        welcomeMessageAppearance: 'hidden',
        email: user.email,
        name: user.name || user.email,
        customFields: {
          pier_user_id: user.id,
          membership_tier: user.membership_tier || 'standard',
          source: 'pier_portal',
        },
      };

      if (user.front_user_hash) {
        config.userHash = user.front_user_hash;
      }

      window.FrontChat('init', config);
      isInitialized = true;
      console.log('✅ Front Chat initialized for:', user.email);

      // Run any pending callbacks
      initCallbacks.forEach(callback => callback());
      initCallbacks = [];
    }
  }, 100);

  setTimeout(() => clearInterval(waitForFrontChat), 5000);
}

export function showFrontChat(): void {
  if (typeof window !== 'undefined' && window.FrontChat && isInitialized) {
    try {
      window.FrontChat('show');
      console.log('✅ Front Chat show() called');
    } catch (error) {
      console.error('❌ Error showing Front Chat:', error);
    }
  } else {
    console.warn('⚠️ Front Chat not ready:', {
      hasWindow: typeof window !== 'undefined',
      hasFrontChat: !!window.FrontChat,
      isInitialized
    });
  }
}

export function hideFrontChat(): void {
  if (typeof window !== 'undefined' && window.FrontChat) {
    window.FrontChat('hide');
  }
}

export function onUnreadChange(callback: (count: number) => void): void {
  if (typeof window === 'undefined') return;
  if (!window.FrontChat || !isInitialized) {
    console.log('⚠️ Front Chat not initialized yet, will setup unread listener later');
    return;
  }

  try {
    window.FrontChat('on', 'unreadCountChange', (count: number) => {
      callback(count);
    });
    console.log('✅ Unread count listener registered');
  } catch (error) {
    console.warn('⚠️ Could not register unread listener:', error);
  }
}

export function resetFrontChat(): void {
  isInitialized = false;
}

export function onFrontChatReady(callback: () => void): void {
  if (isInitialized && window.FrontChat) {
    callback();
  } else {
    initCallbacks.push(callback);
  }
}

export function isFrontChatReady(): boolean {
  return isInitialized && typeof window !== 'undefined' && !!window.FrontChat;
}
