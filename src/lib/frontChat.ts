let isInitialized = false;

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
    }
  }, 100);

  setTimeout(() => clearInterval(waitForFrontChat), 5000);
}

export function showFrontChat(): void {
  if (typeof window !== 'undefined' && window.FrontChat) {
    window.FrontChat('show');
  }
}

export function hideFrontChat(): void {
  if (typeof window !== 'undefined' && window.FrontChat) {
    window.FrontChat('hide');
  }
}

export function onUnreadChange(callback: (count: number) => void): void {
  if (typeof window === 'undefined') return;
  if (!window.FrontChat) return;

  window.FrontChat('on', 'unreadCountChange', (count: number) => {
    callback(count);
  });
}

export function resetFrontChat(): void {
  isInitialized = false;
}
