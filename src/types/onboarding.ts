export type CapitalRole = 'gp' | 'lp';

export interface OnboardingData {
  capitalRole: CapitalRole | null;
  firm: string;
  title: string;
  city: string;
  intents: string[];
  allowIntroRequests: boolean;
  shareEventAttendance: boolean;
}
