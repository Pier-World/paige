import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PostHogProvider } from '@posthog/react';
import posthog from 'posthog-js';
import App from './App.tsx';
import './index.css';

const posthogToken = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN;
const posthogHost = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

if (posthogToken) {
  posthog.init(posthogToken, {
    api_host: posthogHost,
    defaults: '2026-08-30',
    person_profiles: 'identified_only',
    session_recording: {
      maskAllInputs: true,
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <App />
    </PostHogProvider>
  </StrictMode>
);
