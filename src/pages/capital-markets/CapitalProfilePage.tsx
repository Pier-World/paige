import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { AccreditationField } from '../../components/accreditation/AccreditationField';
import { ProfileSettingsNav } from '../../components/capital-markets/ProfileSettingsNav';
import { UpgradePrompt } from '../../components/capital-markets/UpgradePrompt';
import { PageFrame } from '../../components/layout/PageFrame';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { isPierPlus } from '../../lib/membership';
import { resolveFullName } from '../../lib/memberName';
import { ProfileInput } from '../../components/capital-markets/ProfileSectionCard';
import {
  canonicalProfileHref,
  profileSectionById,
  type ProfileSectionId,
  isProfileSection,
} from '../../lib/profileSections';
import {
  getMyCapitalMemberProfile,
  updateMyCapitalMemberProfile,
  type CapitalMemberProfile,
  type CapitalMemberRole,
} from '../../lib/api/capitalMarkets';
import { CAPITAL_SUPABASE_TIMEOUT_MS, withTimeout } from '../../lib/async';
import { ErrorState, LoadingState } from './PageStates';

type EventPrefs = {
  preferred_cities?: string;
  formats?: string;
  interests?: string;
  dietary?: string;
  dining?: string;
  travel?: string;
  notes?: string;
};

type ConciergePrefs = {
  dining?: string;
  travel?: string;
};

type MemberPrefs = {
  allow_intro_requests?: boolean;
  share_event_attendance?: boolean;
};

type NotificationPrefs = {
  deal_flow?: string;
  events?: string;
  partners?: string;
};

function channelValue(raw?: string) {
  if (!raw || raw.toLowerCase() === 'off' || raw.toLowerCase() === 'none') return 'Off';
  return 'Email';
}

function parsePrefs<T>(raw: unknown): T {
  if (raw && typeof raw === 'object') return raw as T;
  return {} as T;
}

const PREFERRED_CITIES = ['New York', 'San Francisco', 'Miami', 'London', 'Hamptons'] as const;

const EVENT_INTERESTS = ['Dinner', 'Summit', 'Roundtable', 'Experience', 'Webinar'] as const;

function splitPreferenceList(value?: string) {
  if (!value?.trim()) return [];
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function matchesPreferenceOption(value: string, option: string) {
  const normalized = value.trim().toLowerCase();
  const target = option.toLowerCase();
  return normalized === target || normalized === `${target}s` || normalized === `${target}es`;
}

function selectedPreferences(value: string | undefined, options: readonly string[]) {
  const parts = splitPreferenceList(value);
  const known = options.filter((option) => parts.some((part) => matchesPreferenceOption(part, option)));
  const custom = parts.filter((part) => !options.some((option) => matchesPreferenceOption(part, option)));
  return [...known, ...custom];
}

function PreferenceChips({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value?: string;
  onChange: (value: string) => void;
}) {
  const selected = selectedPreferences(value, options);

  function toggle(option: string) {
    const next = selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option];
    onChange(next.join(', '));
  }

  return (
    <div>
      <p className="eyebrow mb-2">{label}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((option) => (
          <Chip
            key={option}
            active={selected.includes(option)}
            aria-pressed={selected.includes(option)}
            onClick={() => toggle(option)}
          >
            {option}
          </Chip>
        ))}
        {selected
          .filter((item) => !options.includes(item))
          .map((item) => (
            <Chip key={item} active aria-pressed onClick={() => toggle(item)}>
              {item}
            </Chip>
          ))}
      </div>
    </div>
  );
}

function FormActions({
  saving,
  saveLabel,
  onSave,
  onDiscard,
}: {
  saving: boolean;
  saveLabel: string;
  onSave: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="mt-8 flex flex-wrap gap-3 border-t border-border/60 pt-6">
      <Button loading={saving} onClick={onSave}>
        {saveLabel}
      </Button>
      <Button variant="secondary" disabled={saving} onClick={onDiscard}>
        Discard
      </Button>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="eyebrow mb-1 block">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-pier-md border border-border bg-parchment px-3 py-2 text-[14px] text-ink"
      >
        {children}
      </select>
    </label>
  );
}

export default function CapitalProfilePage() {
  const { user, updateProfile } = useAuth();
  const { section: sectionParam } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const redirectTo = canonicalProfileHref(sectionParam, searchParams, location.hash);
  const section: ProfileSectionId = isProfileSection(sectionParam) ? sectionParam : 'personal';
  const sectionMeta = profileSectionById(section);
  const pierPlus = isPierPlus(user);
  const [capitalProfile, setCapitalProfile] = useState<CapitalMemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [firm, setFirm] = useState('');
  const [roleLabel, setRoleLabel] = useState('');
  const [primaryCity, setPrimaryCity] = useState('');

  const [capitalRole, setCapitalRole] = useState<CapitalMemberRole | ''>('');
  const [investorType, setInvestorType] = useState('');
  const [bio, setBio] = useState('');
  const [thesis, setThesis] = useState('');
  const [aumDisplay, setAumDisplay] = useState('');
  const [checkSizeDisplay, setCheckSizeDisplay] = useState('');
  const [focusSectors, setFocusSectors] = useState('');

  const [eventPrefs, setEventPrefs] = useState<EventPrefs>({});
  const [memberPrefs, setMemberPrefs] = useState<MemberPrefs>({});
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>({});

  function hydrateFromUser(profile: CapitalMemberProfile | null) {
    if (!user) return;

    setFullName(
      resolveFullName({
        fullName: user.full_name,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
      })
    );
    setPhone(user.phone || '');
    setFirm(profile?.firm || user.preferences?.firm || '');
    setRoleLabel(profile?.title || user.preferences?.role_label || '');
    setPrimaryCity(profile?.location || user.preferences?.primary_city || '');

    if (profile) {
      setCapitalRole(profile.role);
      setBio(profile.bio);
      setThesis(profile.investmentThesis);
      setAumDisplay(profile.aumDisplay);
      setCheckSizeDisplay(profile.checkSizeDisplay);
      setFocusSectors(profile.focusSectors.join(', '));
    } else if (user.preferences?.capital_role === 'gp' || user.preferences?.capital_role === 'lp') {
      setCapitalRole(user.preferences.capital_role);
    }

    setInvestorType(user.preferences?.investor_type || '');
    const storedEventPrefs = parsePrefs<EventPrefs>(user.preferences?.event_preferences);
    const storedConciergePrefs = parsePrefs<ConciergePrefs>(user.preferences?.concierge_preferences);
    setEventPrefs({
      ...storedEventPrefs,
      dining: storedEventPrefs.dining || storedConciergePrefs.dining,
      travel: storedEventPrefs.travel || storedConciergePrefs.travel,
    });
    const storedMemberPrefs = parsePrefs<MemberPrefs>(user.preferences?.member_preferences);
    setMemberPrefs({
      allow_intro_requests: storedMemberPrefs.allow_intro_requests ?? false,
      share_event_attendance: storedMemberPrefs.share_event_attendance ?? false,
    });
    setNotificationPrefs(parsePrefs<NotificationPrefs>(user.preferences?.notification_preferences));
  }

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      if (!pierPlus) {
        hydrateFromUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const profile = await withTimeout(
          getMyCapitalMemberProfile(user.id),
          CAPITAL_SUPABASE_TIMEOUT_MS,
          'capital profile'
        );
        if (ignore) return;

        setCapitalProfile(profile);
        hydrateFromUser(profile);
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : 'Unable to load profile.');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [user?.id, pierPlus]);

  useEffect(() => {
    if (loading) return;
    hydrateFromUser(capitalProfile);
    setSaveMessage(null);
  }, [section]);

  useEffect(() => {
    if (loading || redirectTo) return;
    const id = window.location.hash.replace(/^#/, '');
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [loading, redirectTo, location.hash]);

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  function showSuccess(text: string) {
    setSaveMessage({ type: 'success', text });
  }

  function showError(text: string) {
    setSaveMessage({ type: 'error', text });
  }

  function discard() {
    hydrateFromUser(capitalProfile);
    setSaveMessage(null);
  }

  async function savePersonal() {
    if (!user) return;
    setSaving(true);
    setSaveMessage(null);

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      showError('Full name is required.');
      setSaving(false);
      return;
    }

    const parts = trimmedName.split(/\s+/);
    const first = parts[0] || user.first_name;
    const last = parts.slice(1).join(' ') || user.last_name;

    const { error: profileError } = await updateProfile({
      first_name: first,
      last_name: last,
      full_name: trimmedName,
      phone: phone.trim() || undefined,
      preferences: {
        ...user.preferences,
        primary_city: primaryCity.trim() || undefined,
        firm: firm.trim() || undefined,
        role_label: roleLabel.trim() || undefined,
        capital_role: capitalRole || undefined,
      },
    });

    if (profileError) {
      showError(profileError.message);
      setSaving(false);
      return;
    }

    if (!pierPlus) {
      showSuccess('Profile saved.');
      setSaving(false);
      return;
    }

    try {
      const updated = await updateMyCapitalMemberProfile({
        displayName: trimmedName,
        firm: firm.trim() || 'Independent',
        title: roleLabel.trim() || null,
        location: primaryCity.trim() || null,
        role: capitalRole || 'lp',
      });
      setCapitalProfile(updated);
      showSuccess('Profile saved.');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  }

  async function saveCapital() {
    if (!user) return;
    setSaving(true);
    setSaveMessage(null);

    try {
      const { error: profileError } = await updateProfile({
        preferences: {
          ...user.preferences,
          capital_role: capitalRole || user.preferences?.capital_role,
          investor_type: investorType.trim() || undefined,
        },
      });

      if (profileError) {
        showError(profileError.message);
        setSaving(false);
        return;
      }

      const updated = await updateMyCapitalMemberProfile({
        displayName: fullName.trim() || user.email,
        firm: firm.trim() || 'Independent',
        role: capitalRole || 'lp',
        bio: bio.trim() || null,
        investmentThesis: thesis.trim() || null,
        aumDisplay: aumDisplay.trim() || null,
        checkSizeDisplay: checkSizeDisplay.trim() || null,
        focusSectors: focusSectors
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        location: primaryCity.trim() || null,
        title: roleLabel.trim() || null,
      });
      setCapitalProfile(updated);
      showSuccess('Capital profile saved.');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Unable to save capital profile.');
    } finally {
      setSaving(false);
    }
  }

  async function saveEventPrefs() {
    if (!user) return;
    setSaving(true);
    setSaveMessage(null);

    const { error: profileError } = await updateProfile({
      preferences: {
        ...user.preferences,
        event_preferences: eventPrefs as Record<string, string>,
      },
    });

    if (profileError) {
      showError(profileError.message);
    } else {
      showSuccess('Event preferences saved.');
    }
    setSaving(false);
  }

  async function saveMemberPrefs() {
    if (!user) return;
    setSaving(true);
    setSaveMessage(null);

    const { error: profileError } = await updateProfile({
      preferences: {
        ...user.preferences,
        member_preferences: memberPrefs,
      },
    });

    if (profileError) {
      showError(profileError.message);
    } else {
      showSuccess('Privacy preferences saved.');
    }
    setSaving(false);
  }

  async function saveNotificationPrefs() {
    if (!user) return;
    setSaving(true);
    setSaveMessage(null);

    const { error: profileError } = await updateProfile({
      preferences: {
        ...user.preferences,
        notification_preferences: notificationPrefs,
      },
    });

    if (profileError) {
      showError(profileError.message);
    } else {
      showSuccess('Notification preferences saved.');
    }
    setSaving(false);
  }

  const formClass = 'rounded-[4px] border border-border bg-surface p-6 sm:p-8';

  return (
    <PageFrame>
      <div className="mb-8 lg:mb-10">
        <p className="eyebrow mb-2">Settings</p>
        <h1 className="font-display text-[40px] leading-[1.05] tracking-[-0.02em] text-ink">
          {sectionMeta.title}
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] text-slate">{sectionMeta.description}</p>
        <div className="gilt-rule mt-6 w-12" />
      </div>

      {loading ? <LoadingState label="Loading profile" variant="profile" /> : null}
      {error ? <ErrorState message={error} /> : null}

      {!loading && !error && user ? (
        <div className="grid items-start gap-8 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12">
          <ProfileSettingsNav />

          <div>
            {saveMessage ? (
              <div
                className={
                  saveMessage.type === 'success'
                    ? 'mb-6 rounded-[4px] border border-ledger/20 bg-ledger/[0.06] p-4 text-[13px] text-ledger'
                    : 'mb-6 rounded-[4px] border border-danger/30 bg-danger/[0.06] p-4 text-[13px] text-danger'
                }
              >
                {saveMessage.text}
              </div>
            ) : null}

            {section === 'personal' ? (
              <div id="personal" className={formClass}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ProfileInput
                    label="Full name"
                    value={fullName}
                    onChange={setFullName}
                    className="sm:col-span-2"
                  />
                  <ProfileInput label="Email address" value={user.email} onChange={() => {}} disabled />
                  <ProfileInput label="Phone number" value={phone} onChange={setPhone} type="tel" />
                  <ProfileInput label="Firm" value={firm} onChange={setFirm} />
                  <ProfileInput label="Title / role" value={roleLabel} onChange={setRoleLabel} />
                  <SelectField
                    label="Capital role"
                    value={capitalRole}
                    onChange={(value) => setCapitalRole(value as CapitalMemberRole | '')}
                  >
                    <option value="">Select</option>
                    <option value="lp">Allocator (LP)</option>
                    <option value="gp">General Partner (GP)</option>
                  </SelectField>
                  <ProfileInput label="Primary city" value={primaryCity} onChange={setPrimaryCity} />
                  <AccreditationField className="sm:col-span-2" />
                </div>
                <FormActions
                  saving={saving}
                  saveLabel="Save profile"
                  onSave={() => void savePersonal()}
                  onDiscard={discard}
                />
              </div>
            ) : null}

            {section === 'capital' ? (
              pierPlus ? (
                <div className={formClass}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {capitalRole === 'gp' ? (
                      <>
                        <ProfileInput
                          label="Strategy / asset class"
                          value={focusSectors}
                          onChange={setFocusSectors}
                          placeholder="Venture, private credit, real assets..."
                          className="sm:col-span-2"
                        />
                        <ProfileInput
                          label="Fund size (display)"
                          value={aumDisplay}
                          onChange={setAumDisplay}
                          className="sm:col-span-2"
                        />
                        <ProfileInput
                          label="Bio"
                          value={bio}
                          onChange={setBio}
                          multiline
                          className="sm:col-span-2"
                        />
                        <ProfileInput
                          label="Investment thesis"
                          value={thesis}
                          onChange={setThesis}
                          multiline
                          className="sm:col-span-2"
                        />
                      </>
                    ) : (
                      <>
                        <ProfileInput
                          label="Investor type"
                          value={investorType}
                          onChange={setInvestorType}
                          placeholder="Family office, endowment, fund of funds..."
                          className="sm:col-span-2"
                        />
                        <ProfileInput
                          label="Allocation / check size"
                          value={checkSizeDisplay}
                          onChange={setCheckSizeDisplay}
                          className="sm:col-span-2"
                        />
                        <ProfileInput
                          label="Investment interests"
                          value={focusSectors}
                          onChange={setFocusSectors}
                          placeholder="Venture, private credit, real estate..."
                          className="sm:col-span-2"
                        />
                        <ProfileInput
                          label="Bio"
                          value={bio}
                          onChange={setBio}
                          multiline
                          className="sm:col-span-2"
                        />
                      </>
                    )}
                  </div>
                  <FormActions
                    saving={saving}
                    saveLabel="Save capital profile"
                    onSave={() => void saveCapital()}
                    onDiscard={discard}
                  />
                </div>
              ) : (
                <UpgradePrompt
                  variant="inline"
                  title="Capital directory is included with Pier+"
                  description="Your role, firm, and city stay on Personal information. Directory, AUM, and thesis are Pier+."
                />
              )
            ) : null}

            {section === 'events' ? (
              <div className={formClass}>
                <div className="grid gap-5">
                  <PreferenceChips
                    label="Preferred cities"
                    options={PREFERRED_CITIES}
                    value={eventPrefs.preferred_cities}
                    onChange={(value) => setEventPrefs((prefs) => ({ ...prefs, preferred_cities: value }))}
                  />
                  <PreferenceChips
                    label="Event interests"
                    options={EVENT_INTERESTS}
                    value={eventPrefs.interests || eventPrefs.formats}
                    onChange={(value) =>
                      setEventPrefs((prefs) => ({ ...prefs, interests: value, formats: value }))
                    }
                  />
                  <ProfileInput
                    label="Dietary / hospitality notes"
                    value={eventPrefs.dietary || ''}
                    onChange={(value) => setEventPrefs((prefs) => ({ ...prefs, dietary: value }))}
                    multiline
                  />
                  <ProfileInput
                    label="Dining notes"
                    value={eventPrefs.dining || ''}
                    onChange={(value) => setEventPrefs((prefs) => ({ ...prefs, dining: value }))}
                  />
                  <ProfileInput
                    label="Travel notes"
                    value={eventPrefs.travel || ''}
                    onChange={(value) => setEventPrefs((prefs) => ({ ...prefs, travel: value }))}
                  />
                  <ProfileInput
                    label="Additional notes"
                    value={eventPrefs.notes || ''}
                    onChange={(value) => setEventPrefs((prefs) => ({ ...prefs, notes: value }))}
                    multiline
                  />
                </div>
                <FormActions
                  saving={saving}
                  saveLabel="Save event preferences"
                  onSave={() => void saveEventPrefs()}
                  onDiscard={discard}
                />
              </div>
            ) : null}

            {section === 'privacy' ? (
              <div className={formClass}>
                <div className="grid gap-4">
                  <SelectField
                    label="Allow intro requests"
                    value={memberPrefs.allow_intro_requests ? 'yes' : 'no'}
                    onChange={(value) =>
                      setMemberPrefs((prefs) => ({
                        ...prefs,
                        allow_intro_requests: value === 'yes',
                      }))
                    }
                  >
                    <option value="no">No (default)</option>
                    <option value="yes">Yes</option>
                  </SelectField>
                  <SelectField
                    label="Share event attendance"
                    value={memberPrefs.share_event_attendance ? 'yes' : 'no'}
                    onChange={(value) =>
                      setMemberPrefs((prefs) => ({
                        ...prefs,
                        share_event_attendance: value === 'yes',
                      }))
                    }
                  >
                    <option value="no">No (default)</option>
                    <option value="yes">Yes</option>
                  </SelectField>
                </div>
                <FormActions
                  saving={saving}
                  saveLabel="Save privacy preferences"
                  onSave={() => void saveMemberPrefs()}
                  onDiscard={discard}
                />
              </div>
            ) : null}

            {section === 'notifications' ? (
              <div className={formClass}>
                <div className="grid gap-4">
                  <SelectField
                    label="Deal flow alerts"
                    value={channelValue(notificationPrefs.deal_flow)}
                    onChange={(value) =>
                      setNotificationPrefs((prefs) => ({ ...prefs, deal_flow: value }))
                    }
                  >
                    <option value="Email">Email</option>
                    <option value="Off">Off</option>
                  </SelectField>
                  <SelectField
                    label="Event invitations"
                    value={channelValue(notificationPrefs.events)}
                    onChange={(value) => setNotificationPrefs((prefs) => ({ ...prefs, events: value }))}
                  >
                    <option value="Email">Email</option>
                    <option value="Off">Off</option>
                  </SelectField>
                  <SelectField
                    label="Partner updates"
                    value={channelValue(notificationPrefs.partners)}
                    onChange={(value) =>
                      setNotificationPrefs((prefs) => ({ ...prefs, partners: value }))
                    }
                  >
                    <option value="Email">Email</option>
                    <option value="Off">Off</option>
                  </SelectField>
                </div>
                <FormActions
                  saving={saving}
                  saveLabel="Save notifications"
                  onSave={() => void saveNotificationPrefs()}
                  onDiscard={discard}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </PageFrame>
  );
}
