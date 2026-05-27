import { useEffect, useState } from 'react';
import {
  Bell,
  Building2,
  Calendar,
  ConciergeBell,
  Link2,
  Shield,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  ProfileField,
  ProfileInput,
  ProfileSectionCard,
} from '../../components/capital-markets/ProfileSectionCard';
import {
  getMyCapitalMemberProfile,
  updateMyCapitalMemberProfile,
  type CapitalMemberProfile,
  type CapitalMemberRole,
} from '../../lib/api/capitalMarkets';
import { CAPITAL_SUPABASE_TIMEOUT_MS, withTimeout } from '../../lib/async';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { ErrorState, LoadingState } from './PageStates';

type SectionId =
  | 'personal'
  | 'capital'
  | 'events'
  | 'concierge'
  | 'member'
  | 'notifications';

type EventPrefs = {
  preferred_cities?: string;
  formats?: string;
  interests?: string;
  dietary?: string;
  notes?: string;
};

type ConciergePrefs = {
  dining?: string;
  travel?: string;
  partners?: string;
  communication?: string;
  notes?: string;
};

type MemberPrefs = {
  allow_intro_requests?: boolean;
  share_event_attendance?: boolean;
};

type NotificationPrefs = {
  deal_flow?: string;
  events?: string;
  concierge?: string;
  partners?: string;
};

function parsePrefs<T>(raw: unknown): T {
  if (raw && typeof raw === 'object') return raw as T;
  return {} as T;
}

function displayBool(value: boolean | undefined) {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return 'Not provided';
}

export default function CapitalProfilePage() {
  const { user, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [capitalProfile, setCapitalProfile] = useState<CapitalMemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [editingSection, setEditingSection] = useState<SectionId | null>(null);
  const [savingSection, setSavingSection] = useState<SectionId | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [firm, setFirm] = useState('');
  const [roleLabel, setRoleLabel] = useState('');
  const [primaryCity, setPrimaryCity] = useState('');

  const [capitalRole, setCapitalRole] = useState<CapitalMemberRole>('lp');
  const [investorType, setInvestorType] = useState('');
  const [bio, setBio] = useState('');
  const [thesis, setThesis] = useState('');
  const [aumDisplay, setAumDisplay] = useState('');
  const [checkSizeDisplay, setCheckSizeDisplay] = useState('');
  const [focusSectors, setFocusSectors] = useState('');
  const [accredited, setAccredited] = useState('');

  const [eventPrefs, setEventPrefs] = useState<EventPrefs>({});
  const [conciergePrefs, setConciergePrefs] = useState<ConciergePrefs>({});
  const [memberPrefs, setMemberPrefs] = useState<MemberPrefs>({});
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>({});

  const [gmailConnected, setGmailConnected] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);

  function hydrateFromUser(profile: CapitalMemberProfile | null) {
    if (!user) return;

    setFullName(user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim());
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
    }

    setInvestorType(user.preferences?.investor_type || '');
    setAccredited(user.preferences?.accredited_investor || '');
    setEventPrefs(parsePrefs<EventPrefs>(user.preferences?.event_preferences));
    setConciergePrefs(parsePrefs<ConciergePrefs>(user.preferences?.concierge_preferences));
    setMemberPrefs(parsePrefs<MemberPrefs>(user.preferences?.member_preferences));
    setNotificationPrefs(parsePrefs<NotificationPrefs>(user.preferences?.notification_preferences));
  }

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!user?.id) {
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
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || loading) return;
    hydrateFromUser(capitalProfile);
  }, [user, capitalProfile, loading]);

  useEffect(() => {
    let ignore = false;

    async function loadIntegrations() {
      if (!user?.id) return;

      try {
        const { data } = await supabase
          .from('integrations')
          .select('provider')
          .eq('user_id', user.id);

        if (ignore || !data) return;

        setGmailConnected(data.some((row) => row.provider === 'google_gmail'));
        setCalendarConnected(data.some((row) => row.provider === 'google_calendar'));
      } catch {
        if (!ignore) {
          setGmailConnected(false);
          setCalendarConnected(false);
        }
      }
    }

    loadIntegrations();

    return () => {
      ignore = true;
    };
  }, [user?.id]);

  function showSuccess(text: string) {
    setSaveMessage({ type: 'success', text });
    setEditingSection(null);
  }

  function showError(text: string) {
    setSaveMessage({ type: 'error', text });
  }

  function startEdit(section: SectionId) {
    hydrateFromUser(capitalProfile);
    setEditingSection(section);
    setSaveMessage(null);
  }

  function cancelEdit() {
    hydrateFromUser(capitalProfile);
    setEditingSection(null);
  }

  async function savePersonal() {
    if (!user) return;
    setSavingSection('personal');
    setSaveMessage(null);

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      showError('Full name is required.');
      setSavingSection(null);
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
      },
    });

    if (profileError) {
      showError(profileError.message);
      setSavingSection(null);
      return;
    }

    try {
      const updated = await updateMyCapitalMemberProfile({
        displayName: trimmedName,
        firm: firm.trim() || 'Independent',
        title: roleLabel.trim() || null,
        location: primaryCity.trim() || null,
        role: capitalRole,
      });
      setCapitalProfile(updated);
      showSuccess('Profile saved.');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSavingSection(null);
    }
  }

  async function saveCapital() {
    if (!user) return;
    setSavingSection('capital');
    setSaveMessage(null);

    try {
      const { error: profileError } = await updateProfile({
        preferences: {
          ...user.preferences,
          investor_type: investorType.trim() || undefined,
          accredited_investor: accredited.trim() || undefined,
        },
      });

      if (profileError) {
        showError(profileError.message);
        setSavingSection(null);
        return;
      }

      const updated = await updateMyCapitalMemberProfile({
        displayName: fullName.trim() || user.email,
        firm: firm.trim() || 'Independent',
        role: capitalRole,
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
      setSavingSection(null);
    }
  }

  async function saveEventPrefs() {
    if (!user) return;
    setSavingSection('events');
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
    setSavingSection(null);
  }

  async function saveConciergePrefs() {
    if (!user) return;
    setSavingSection('concierge');
    setSaveMessage(null);

    const { error: profileError } = await updateProfile({
      preferences: {
        ...user.preferences,
        concierge_preferences: conciergePrefs as Record<string, string>,
      },
    });

    if (profileError) {
      showError(profileError.message);
    } else {
      showSuccess('Concierge preferences saved.');
    }
    setSavingSection(null);
  }

  async function saveMemberPrefs() {
    if (!user) return;
    setSavingSection('member');
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
      showSuccess('Member preferences saved.');
    }
    setSavingSection(null);
  }

  async function saveNotificationPrefs() {
    if (!user) return;
    setSavingSection('notifications');
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
    setSavingSection(null);
  }

  const capitalRoleLabel = capitalRole === 'gp' ? 'General Partner' : 'Limited Partner';

  return (
    <div className="px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
      <div className="mb-10">
        <p className="eyebrow mb-2">06 / Profile</p>
        <h1 className="font-display text-[40px] leading-[0.95] tracking-[-0.02em] text-ink">Your profile.</h1>
        <p className="mt-3 max-w-2xl text-[15px] text-slate">
          Manage your identity, preferences, and access across Pier.
        </p>
        <div className="gilt-rule mt-6 w-12" />
      </div>

      {loading ? <LoadingState label="Loading profile..." /> : null}
      {error ? <ErrorState message={error} /> : null}

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

      {!loading && !error && user ? (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <ProfileSectionCard
              icon={User}
              title="Personal Information"
              editing={editingSection === 'personal'}
              onEdit={() => startEdit('personal')}
              onCancel={cancelEdit}
              onSave={savePersonal}
              saving={savingSection === 'personal'}
              saveLabel="Save Profile"
            >
              {editingSection === 'personal' ? (
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
                  <ProfileInput
                    label="Primary city"
                    value={primaryCity}
                    onChange={setPrimaryCity}
                    className="sm:col-span-2"
                  />
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <ProfileField label="Full name" value={fullName} className="sm:col-span-2" />
                  <ProfileField label="Email address" value={user.email} />
                  <ProfileField label="Phone number" value={phone} />
                  <ProfileField label="Firm" value={firm} />
                  <ProfileField label="Title / role" value={roleLabel} />
                  <ProfileField label="Primary city" value={primaryCity} className="sm:col-span-2" />
                </div>
              )}
            </ProfileSectionCard>

            <ProfileSectionCard
              icon={Building2}
              title="Capital Profile"
              editing={editingSection === 'capital'}
              onEdit={() => startEdit('capital')}
              onCancel={cancelEdit}
              onSave={saveCapital}
              saving={savingSection === 'capital'}
              saveLabel="Save capital profile"
            >
              {editingSection === 'capital' ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="eyebrow mb-1 block">Capital role</span>
                    <select
                      value={capitalRole}
                      onChange={(e) => setCapitalRole(e.target.value as CapitalMemberRole)}
                      className="w-full rounded-[4px] border border-border bg-parchment px-3 py-2 text-[14px] text-ink"
                    >
                      <option value="lp">Allocator (LP)</option>
                      <option value="gp">General Partner (GP)</option>
                    </select>
                  </label>
                  <ProfileInput
                    label="Investor type"
                    value={investorType}
                    onChange={setInvestorType}
                    placeholder="Family office, endowment, fund of funds..."
                  />
                  <ProfileInput
                    label="AUM (display)"
                    value={aumDisplay}
                    onChange={setAumDisplay}
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
                    label="Accredited investor"
                    value={accredited}
                    onChange={setAccredited}
                    placeholder="Yes / No"
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
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <ProfileField label="Capital role" value={capitalRoleLabel} />
                  <ProfileField label="Investor type" value={investorType} />
                  <ProfileField
                    label="Investment interests"
                    value={focusSectors || capitalProfile?.focusSectors.join(', ')}
                    className="sm:col-span-2"
                  />
                  <ProfileField label="Allocation range" value={checkSizeDisplay || capitalProfile?.checkSize} />
                  <ProfileField label="AUM" value={aumDisplay || capitalProfile?.aum} />
                  <ProfileField label="Accredited investor" value={accredited} />
                  <ProfileField label="Bio" value={bio} className="sm:col-span-2" />
                  <ProfileField label="Thesis" value={thesis} className="sm:col-span-2" />
                </div>
              )}
            </ProfileSectionCard>

            <ProfileSectionCard
              icon={Calendar}
              title="Event & Preferences"
              editing={editingSection === 'events'}
              onEdit={() => startEdit('events')}
              onCancel={cancelEdit}
              onSave={saveEventPrefs}
              saving={savingSection === 'events'}
              saveLabel="Save event preferences"
            >
              {editingSection === 'events' ? (
                <div className="grid gap-4">
                  <ProfileInput
                    label="Preferred cities"
                    value={eventPrefs.preferred_cities || ''}
                    onChange={(v) => setEventPrefs((p) => ({ ...p, preferred_cities: v }))}
                    placeholder="New York, Miami, Austin..."
                  />
                  <ProfileInput
                    label="Event interests"
                    value={eventPrefs.interests || eventPrefs.formats || ''}
                    onChange={(v) => setEventPrefs((p) => ({ ...p, interests: v, formats: v }))}
                    placeholder="Dinners, summits, wine tastings..."
                  />
                  <ProfileInput
                    label="Dietary / hospitality notes"
                    value={eventPrefs.dietary || ''}
                    onChange={(v) => setEventPrefs((p) => ({ ...p, dietary: v }))}
                    multiline
                  />
                  <ProfileInput
                    label="Additional notes"
                    value={eventPrefs.notes || ''}
                    onChange={(v) => setEventPrefs((p) => ({ ...p, notes: v }))}
                    multiline
                  />
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <ProfileField label="Preferred cities" value={eventPrefs.preferred_cities} className="sm:col-span-2" />
                  <ProfileField
                    label="Event interests"
                    value={eventPrefs.interests || eventPrefs.formats}
                    className="sm:col-span-2"
                  />
                  <ProfileField label="Dietary / hospitality notes" value={eventPrefs.dietary} className="sm:col-span-2" />
                  <ProfileField
                    label="Calendar"
                    value={calendarConnected ? 'Google Calendar connected' : 'Not connected'}
                  />
                </div>
              )}
            </ProfileSectionCard>

            <ProfileSectionCard
              icon={ConciergeBell}
              title="Concierge Preferences"
              editing={editingSection === 'concierge'}
              onEdit={() => startEdit('concierge')}
              onCancel={cancelEdit}
              onSave={saveConciergePrefs}
              saving={savingSection === 'concierge'}
              saveLabel="Save concierge preferences"
            >
              {editingSection === 'concierge' ? (
                <div className="grid gap-4">
                  <ProfileInput
                    label="Dining preferences"
                    value={conciergePrefs.dining || ''}
                    onChange={(v) => setConciergePrefs((p) => ({ ...p, dining: v }))}
                  />
                  <ProfileInput
                    label="Travel preferences"
                    value={conciergePrefs.travel || ''}
                    onChange={(v) => setConciergePrefs((p) => ({ ...p, travel: v }))}
                  />
                  <ProfileInput
                    label="Partner interests"
                    value={conciergePrefs.partners || ''}
                    onChange={(v) => setConciergePrefs((p) => ({ ...p, partners: v }))}
                  />
                  <ProfileInput
                    label="Communication"
                    value={conciergePrefs.communication || ''}
                    onChange={(v) => setConciergePrefs((p) => ({ ...p, communication: v }))}
                  />
                  <ProfileInput
                    label="Notes for Pier team"
                    value={conciergePrefs.notes || ''}
                    onChange={(v) => setConciergePrefs((p) => ({ ...p, notes: v }))}
                    multiline
                  />
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <ProfileField label="Dining preferences" value={conciergePrefs.dining} />
                  <ProfileField label="Travel preferences" value={conciergePrefs.travel} />
                  <ProfileField label="Partner interests" value={conciergePrefs.partners} className="sm:col-span-2" />
                  <ProfileField label="Communication" value={conciergePrefs.communication} />
                  <ProfileField label="Notes for Pier team" value={conciergePrefs.notes} className="sm:col-span-2" />
                </div>
              )}
            </ProfileSectionCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <ProfileSectionCard
              icon={Shield}
              title="Member Preferences"
              editing={editingSection === 'member'}
              onEdit={() => startEdit('member')}
              onCancel={cancelEdit}
              onSave={saveMemberPrefs}
              saving={savingSection === 'member'}
              saveLabel="Save member preferences"
            >
              {editingSection === 'member' ? (
                <div className="grid gap-4">
                  <label className="block">
                    <span className="eyebrow mb-1 block">Allow intro requests</span>
                    <select
                      value={
                        memberPrefs.allow_intro_requests === undefined
                          ? ''
                          : memberPrefs.allow_intro_requests
                            ? 'yes'
                            : 'no'
                      }
                      onChange={(e) =>
                        setMemberPrefs((p) => ({
                          ...p,
                          allow_intro_requests:
                            e.target.value === '' ? undefined : e.target.value === 'yes',
                        }))
                      }
                      className="w-full rounded-[4px] border border-border bg-parchment px-3 py-2 text-[14px] text-ink"
                    >
                      <option value="">Select</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="eyebrow mb-1 block">Share event attendance</span>
                    <select
                      value={
                        memberPrefs.share_event_attendance === undefined
                          ? ''
                          : memberPrefs.share_event_attendance
                            ? 'yes'
                            : 'no'
                      }
                      onChange={(e) =>
                        setMemberPrefs((p) => ({
                          ...p,
                          share_event_attendance:
                            e.target.value === '' ? undefined : e.target.value === 'yes',
                        }))
                      }
                      className="w-full rounded-[4px] border border-border bg-parchment px-3 py-2 text-[14px] text-ink"
                    >
                      <option value="">Select</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <ProfileField
                    label="Allow intro requests"
                    value={displayBool(memberPrefs.allow_intro_requests)}
                  />
                  <ProfileField
                    label="Share event attendance"
                    value={displayBool(memberPrefs.share_event_attendance)}
                  />
                </div>
              )}
            </ProfileSectionCard>

            <ProfileSectionCard
              icon={Bell}
              title="Notification Preferences"
              editing={editingSection === 'notifications'}
              onEdit={() => startEdit('notifications')}
              onCancel={cancelEdit}
              onSave={saveNotificationPrefs}
              saving={savingSection === 'notifications'}
              saveLabel="Save notifications"
            >
              {editingSection === 'notifications' ? (
                <div className="grid gap-4">
                  <ProfileInput
                    label="Deal flow alerts"
                    value={notificationPrefs.deal_flow || ''}
                    onChange={(v) => setNotificationPrefs((p) => ({ ...p, deal_flow: v }))}
                    placeholder="Email, SMS"
                  />
                  <ProfileInput
                    label="Event invitations"
                    value={notificationPrefs.events || ''}
                    onChange={(v) => setNotificationPrefs((p) => ({ ...p, events: v }))}
                  />
                  <ProfileInput
                    label="Concierge updates"
                    value={notificationPrefs.concierge || ''}
                    onChange={(v) => setNotificationPrefs((p) => ({ ...p, concierge: v }))}
                  />
                  <ProfileInput
                    label="Partner benefits"
                    value={notificationPrefs.partners || ''}
                    onChange={(v) => setNotificationPrefs((p) => ({ ...p, partners: v }))}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <ProfileField label="Deal flow alerts" value={notificationPrefs.deal_flow} />
                  <ProfileField label="Event invitations" value={notificationPrefs.events} />
                  <ProfileField label="Concierge updates" value={notificationPrefs.concierge} />
                  <ProfileField label="Partner benefits" value={notificationPrefs.partners} />
                </div>
              )}
            </ProfileSectionCard>

            <section className="flex flex-col rounded-[4px] border border-border bg-surface p-6">
              <div className="mb-5 flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-parchment text-ledger">
                  <Link2 className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <h2 className="font-display text-[20px] leading-tight tracking-[-0.01em] text-ink">
                  Connected Accounts
                </h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
                  <div>
                    <p className="text-[14px] text-ink">Google Calendar</p>
                    <p className="text-[12px] text-slate">
                      {calendarConnected ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                  <span
                    className={
                      calendarConnected
                        ? 'text-[12px] text-ledger'
                        : 'text-[12px] text-slate'
                    }
                  >
                    {calendarConnected ? '✓' : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
                  <div>
                    <p className="text-[14px] text-ink">Gmail</p>
                    <p className="text-[12px] text-slate">{gmailConnected ? 'Connected' : 'Not connected'}</p>
                  </div>
                  <span className={gmailConnected ? 'text-[12px] text-ledger' : 'text-[12px] text-slate'}>
                    {gmailConnected ? '✓' : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[14px] text-ink">LinkedIn</p>
                    <p className="text-[12px] text-slate">Not connected</p>
                  </div>
                  <Button variant="secondary" size="sm" disabled>
                    Connect
                  </Button>
                </div>
              </div>
            </section>
          </div>

          <section className="flex items-center justify-between rounded-[4px] border border-border bg-surface p-6">
            <div>
              <p className="eyebrow mb-1">Appearance</p>
              <p className="text-[13px] text-slate">Theme: {theme === 'dark' ? 'Dark' : 'Light'}</p>
            </div>
            <Button variant="secondary" onClick={toggleTheme}>
              Toggle theme
            </Button>
          </section>
        </div>
      ) : null}
    </div>
  );
}
