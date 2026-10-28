import posthog from 'posthog-js';
import type { User } from '../types';
import { isPierPlus } from './membership';

export const ANALYTICS_EVENTS = {
  login: 'login',
  onboardingStepViewed: 'onboarding_step_viewed',
  onboardingCompleted: 'onboarding_completed',
  dealViewed: 'deal_viewed',
  dealDocumentOpened: 'deal_document_opened',
  dealDataRoomRequested: 'deal_data_room_requested',
  eventRsvpClicked: 'event_rsvp_clicked',
  partnerViewed: 'partner_viewed',
  partnerCtaClicked: 'partner_cta_clicked',
  upgradePromptShown: 'upgrade_prompt_shown',
  upgradeRequestClick: 'upgrade_request_click',
} as const;

export const ONBOARDING_STEP_NAMES = [
  'welcome',
  'identity',
  'intent',
  'privacy',
  'accreditation',
] as const;

export function isAnalyticsEnabled(): boolean {
  return Boolean(import.meta.env.VITE_POSTHOG_PROJECT_TOKEN);
}

export function captureAnalytics(
  event: (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS] | string,
  properties?: Record<string, unknown>
): void {
  if (!isAnalyticsEnabled()) return;
  posthog.capture(event, properties);
}

export function identifyMember(user: User): void {
  if (!isAnalyticsEnabled()) return;
  posthog.identify(user.id, {
    email: user.email,
    name: user.full_name || `${user.first_name} ${user.last_name}`.trim(),
    membership_level: user.membership_level,
    role: user.role,
    onboarding_completed: Boolean(user.onboarding_completed),
    is_pier_plus: isPierPlus(user),
    capital_role: user.preferences?.capital_role ?? null,
    member_id: user.member_id,
  });
}

export function resetAnalytics(): void {
  if (!isAnalyticsEnabled()) return;
  posthog.reset();
}

export function captureException(error: Error, context?: Record<string, unknown>): void {
  if (!isAnalyticsEnabled()) return;
  if (typeof posthog.captureException === 'function') {
    posthog.captureException(error, context);
    return;
  }
  posthog.capture('$exception', {
    ...context,
    message: error.message,
  });
}
