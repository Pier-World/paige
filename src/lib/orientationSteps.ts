import type { OrientedStep } from '../components/capital-markets/GetOrientedCard';
import { accreditationBasisLabel, readAccreditation } from './accreditation.ts';
import type { UserPreferences } from '../types';

const PROFILE_PERSONAL_HREF = '/profile/personal';
const PROFILE_ACCREDITATION_HREF = '/profile/personal#accreditation';

export type JoinedGathering = {
  id: string;
  title: string;
};

export function buildDashboardOrientedSteps({
  loading,
  calendarError,
  capitalRole,
  firm,
  city,
  joinedEvent,
  hasUpcoming,
  preferences,
}: {
  loading: boolean;
  calendarError: boolean;
  capitalRole?: string;
  firm: string;
  city: string;
  joinedEvent: JoinedGathering | null;
  hasUpcoming: boolean;
  preferences?: UserPreferences | null;
}): OrientedStep[] {
  const roleDone = capitalRole === 'gp' || capitalRole === 'lp';
  const placeDone = Boolean(firm && city);
  const accreditation = readAccreditation(preferences);

  return [
    {
      id: 'role',
      title: 'Confirm your role',
      detail: roleDone
        ? capitalRole === 'gp'
          ? 'You’re set as a general partner.'
          : 'You’re set as an allocator.'
        : 'Tell Pier whether you allocate or manage capital.',
      href: PROFILE_PERSONAL_HREF,
      state: roleDone ? 'done' : 'open',
    },
    {
      id: 'place',
      title: 'Add firm and city',
      detail: placeDone ? `${firm} · ${city}` : 'Where you work, and the city you want to be invited in.',
      href: PROFILE_PERSONAL_HREF,
      state: placeDone ? 'done' : 'open',
    },
    gatheringStep({ loading, calendarError, joinedEvent, hasUpcoming }),
    {
      id: 'accreditation',
      title: 'Accreditation',
      detail: accreditationDetail(accreditation),
      href: PROFILE_ACCREDITATION_HREF,
      state: accreditation ? 'done' : 'open',
    },
  ];
}

function gatheringStep({
  loading,
  calendarError,
  joinedEvent,
  hasUpcoming,
}: {
  loading: boolean;
  calendarError: boolean;
  joinedEvent: JoinedGathering | null;
  hasUpcoming: boolean;
}): OrientedStep {
  if (loading) {
    return {
      id: 'gathering',
      title: 'Join a gathering',
      detail: 'Checking the calendar.',
      href: '/events',
      state: 'pending',
    };
  }
  if (calendarError) {
    return {
      id: 'gathering',
      title: 'Join a gathering',
      detail: 'The calendar didn’t load. Open events to try again.',
      href: '/events',
      state: 'open',
    };
  }
  if (joinedEvent) {
    return {
      id: 'gathering',
      title: 'Join a gathering',
      detail: `You're down for ${joinedEvent.title}.`,
      href: `/events#event-${joinedEvent.id}`,
      state: 'done',
    };
  }
  if (!hasUpcoming) {
    return {
      id: 'gathering',
      title: 'Join a gathering',
      detail: 'Nothing in the next few weeks. We’ll invite you.',
      href: '/events',
      state: 'done',
    };
  }
  return {
    id: 'gathering',
    title: 'Join a gathering',
    detail: 'See upcoming gatherings.',
    href: '/events',
    state: 'open',
  };
}

function accreditationDetail(
  accreditation: ReturnType<typeof readAccreditation>
): string {
  if (!accreditation) return 'Confirm whether you are an accredited investor.';
  if (!accreditation.accredited) return 'Not accredited';
  return `Verified · ${accreditationBasisLabel(accreditation.basis)}`;
}
