export const PROFILE_SECTION_IDS = [
  'personal',
  'capital',
  'events',
  'privacy',
  'notifications',
] as const;

export type ProfileSectionId = (typeof PROFILE_SECTION_IDS)[number];

export type ProfileSection = {
  id: ProfileSectionId;
  label: string;
  title: string;
  description: string;
  path: string;
};

export const PROFILE_SECTIONS: ProfileSection[] = [
  {
    id: 'personal',
    label: 'Personal information',
    title: 'Personal information.',
    description: 'Your name, firm, and the city invitations should use.',
    path: '/profile/personal',
  },
  {
    id: 'capital',
    label: 'Capital profile',
    title: 'Capital profile.',
    description: 'How Pier describes your mandate to managers and allocators.',
    path: '/profile/capital',
  },
  {
    id: 'events',
    label: 'Events & hospitality',
    title: 'Events & hospitality.',
    description: 'The gatherings you want, and how to host you well.',
    path: '/profile/events',
  },
  {
    id: 'privacy',
    label: 'Privacy',
    title: 'Privacy.',
    description: 'What other members can request, and what stays private.',
    path: '/profile/privacy',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    title: 'Notifications.',
    description: 'Email alerts for deals, gatherings, and partners.',
    path: '/profile/notifications',
  },
];

const LEGACY_EDIT_TO_SECTION: Record<string, ProfileSectionId> = {
  personal: 'personal',
  capital: 'capital',
  events: 'events',
  member: 'privacy',
  notifications: 'notifications',
};

export function isProfileSection(value: string | undefined): value is ProfileSectionId {
  return PROFILE_SECTION_IDS.includes(value as ProfileSectionId);
}

export function profileSectionById(id: ProfileSectionId): ProfileSection {
  return PROFILE_SECTIONS.find((section) => section.id === id) ?? PROFILE_SECTIONS[0];
}

export function canonicalProfileHref(
  sectionParam: string | undefined,
  search: string | URLSearchParams,
  hash = ''
): string | null {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search;
  const edit = params.get('edit');
  const focus = params.get('focus');
  const hashId = hash.replace(/^#/, '');

  let section: ProfileSectionId = 'personal';
  if (isProfileSection(sectionParam)) {
    section = sectionParam;
  } else if (sectionParam === 'member') {
    section = 'privacy';
  } else if (edit && LEGACY_EDIT_TO_SECTION[edit]) {
    section = LEGACY_EDIT_TO_SECTION[edit];
  }

  let nextHash = '';
  if (focus === 'accreditation' || hashId === 'accreditation') {
    nextHash = '#accreditation';
  } else if (hashId && hashId !== 'personal') {
    nextHash = `#${hashId}`;
  }

  const currentHash = hashId ? `#${hashId}` : '';
  const alreadyCanonical = sectionParam === section && !edit && !focus && currentHash === nextHash;

  return alreadyCanonical ? null : `/profile/${section}${nextHash}`;
}
