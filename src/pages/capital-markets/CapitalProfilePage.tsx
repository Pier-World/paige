import { useEffect, useState } from 'react';
import {
  Bell,
  Building2,
  Calendar,
  Shield,
  User,
} from 'lucide-react';
import { UpgradePrompt } from '../../components/capital-markets/UpgradePrompt';
import { PageFrame } from '../../components/layout/PageFrame';
import { useAuth } from '../../context/AuthContext';
import { isPierPlus } from '../../lib/membership';
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
import { ErrorState, LoadingState } from './PageStates';

type SectionId =
  | 'personal'
  | 'capital'
  | 'events'
  | 'member'
  | 'notifications';

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

function displayBool(value: boolean | undefined) {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return 'Not provided';
}

export default function CapitalProfilePage() {
  const { user, updateProfile } = useAuth();
  const pierPlus = isPierPlus(user);
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

  const [capitalRole, setCapitalRole] = useState<CapitalMemberRole | ''>('');
  const [investorType, setInvestorType] = useState('');
  const [bio, setBio] = useState('');
  const [thesis, setThesis] = useState('');
  const [aumDisplay, setAumDisplay] = useState('');
  const [checkSizeDisplay, setCheckSizeDisplay] = useState('');
  const [focusSectors, setFocusSectors] = useState('');
  const [accredited, setAccredited] = useState('');

  const [eventPrefs, setEventPrefs] = useState<EventPrefs>({});
  const [memberPrefs, setMemberPrefs] = useState<MemberPrefs>({});
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>({});

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
    } else if (user.preferences?.capital_role === 'gp' || user.preferences?.capital_role === 'lp') {
      setCapitalRole(user.preferences.capital_role);
    }

    setInvestorType(user.preferences?.investor_type || '');
    setAccredited(user.preferences?.accredited_investor || '');
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

      setLoading(true);
      setError(null);

      try {
        const profile = pierPlus
          ? await withTimeout(
              getMyCapitalMemberProfile(user.id),
              CAPITAL_SUPABASE_TIMEOUT_MS,
              'capital profile'
            )
          : null;
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
    if (!user?.id || loading) return;
    hydrateFromUser(capitalProfile);
  }, [user, capitalProfile, loading]);


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
        capital_role: capitalRole || undefined,
      },
    });

    if (profileError) {
      showError(profileError.message);
      setSavingSection(null);
      return;
    }

    if (!pierPlus) {
      showSuccess('Profile saved.');
      setSavingSection(null);
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
          capital_role: capitalRole || user.preferences?.capital_role,
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

  const capitalRoleLabel =
    capitalRole === 'gp' ? 'General Partner' : capitalRole === 'lp' ? 'Limited Partner' : '';

  return (
    <PageFrame>
      <div className="mb-10">
        <p className="eyebrow mb-2">Profile</p>
        <h1 className="font-display text-[40px] leading-[1.05] tracking-[-0.02em] text-ink">Your profile.</h1>
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
                  <label className="block">
                    <span className="eyebrow mb-1 block">Capital role</span>
                    <select
                      value={capitalRole}
                      onChange={(e) => setCapitalRole(e.target.value as CapitalMemberRole | '')}
                      className="w-full rounded-pier-md border border-border bg-parchment px-3 py-2 text-[14px] text-ink"
                    >
                      <option value="">Select</option>
                      <option value="lp">Allocator (LP)</option>
                      <option value="gp">General Partner (GP)</option>
                    </select>
                  </label>
                  <ProfileInput
                    label="Primary city"
                    value={primaryCity}
                    onChange={setPrimaryCity}
                  />
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <ProfileField label="Full name" value={fullName} className="sm:col-span-2" />
                  <ProfileField label="Email address" value={user.email} />
                  <ProfileField label="Phone number" value={phone} />
                  <ProfileField label="Firm" value={firm} />
                  <ProfileField label="Title / role" value={roleLabel} />
                  <ProfileField label="Capital role" value={capitalRoleLabel} />
                  <ProfileField label="Primary city" value={primaryCity} />
                </div>
              )}
            </ProfileSectionCard>

            {pierPlus ? (
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
                      />
                      <label className="block">
                        <span className="eyebrow mb-1 block">Accredited investor</span>
                        <select
                          value={accredited}
                          onChange={(e) => setAccredited(e.target.value)}
                          className="w-full rounded-pier-md border border-border bg-parchment px-3 py-2 text-[14px] text-ink"
                        >
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </label>
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
              ) : capitalRole === 'gp' ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <ProfileField
                    label="Strategy / asset class"
                    value={focusSectors || capitalProfile?.focusSectors.join(', ')}
                    className="sm:col-span-2"
                  />
                  <ProfileField label="Fund size" value={aumDisplay || capitalProfile?.aum} />
                  <ProfileField label="Bio" value={bio} className="sm:col-span-2" />
                  <ProfileField label="Thesis" value={thesis} className="sm:col-span-2" />
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <ProfileField label="Investor type" value={investorType} />
                  <ProfileField label="Accredited investor" value={accredited} />
                  <ProfileField
                    label="Investment interests"
                    value={focusSectors || capitalProfile?.focusSectors.join(', ')}
                    className="sm:col-span-2"
                  />
                  <ProfileField label="Allocation range" value={checkSizeDisplay || capitalProfile?.checkSize} />
                  <ProfileField label="Bio" value={bio} className="sm:col-span-2" />
                </div>
              )}
            </ProfileSectionCard>
            ) : (
              <div>
                <p className="eyebrow mb-3">Capital Profile</p>
                <UpgradePrompt
                  variant="inline"
                  title="Capital directory is included with Pier+"
                  description="Your role, firm, and city stay on your personal profile. Directory, AUM, and thesis are Pier+."
                />
              </div>
            )}

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
                    label="Dining notes"
                    value={eventPrefs.dining || ''}
                    onChange={(v) => setEventPrefs((p) => ({ ...p, dining: v }))}
                  />
                  <ProfileInput
                    label="Travel notes"
                    value={eventPrefs.travel || ''}
                    onChange={(v) => setEventPrefs((p) => ({ ...p, travel: v }))}
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
                  <ProfileField label="Dining notes" value={eventPrefs.dining} />
                  <ProfileField label="Travel notes" value={eventPrefs.travel} />
                </div>
              )}
            </ProfileSectionCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
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
                      value={memberPrefs.allow_intro_requests ? 'yes' : 'no'}
                      onChange={(e) =>
                        setMemberPrefs((p) => ({
                          ...p,
                          allow_intro_requests: e.target.value === 'yes',
                        }))
                      }
                      className="w-full rounded-pier-md border border-border bg-parchment px-3 py-2 text-[14px] text-ink"
                    >
                      <option value="no">No (default)</option>
                      <option value="yes">Yes</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="eyebrow mb-1 block">Share event attendance</span>
                    <select
                      value={memberPrefs.share_event_attendance ? 'yes' : 'no'}
                      onChange={(e) =>
                        setMemberPrefs((p) => ({
                          ...p,
                          share_event_attendance: e.target.value === 'yes',
                        }))
                      }
                      className="w-full rounded-pier-md border border-border bg-parchment px-3 py-2 text-[14px] text-ink"
                    >
                      <option value="no">No (default)</option>
                      <option value="yes">Yes</option>
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
                  <label className="block">
                    <span className="eyebrow mb-1 block">Deal flow alerts</span>
                    <select
                      value={channelValue(notificationPrefs.deal_flow)}
                      onChange={(e) => setNotificationPrefs((p) => ({ ...p, deal_flow: e.target.value }))}
                      className="w-full rounded-pier-md border border-border bg-parchment px-3 py-2 text-[14px] text-ink"
                    >
                      <option value="Email">Email</option>
                      <option value="Off">Off</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="eyebrow mb-1 block">Event invitations</span>
                    <select
                      value={channelValue(notificationPrefs.events)}
                      onChange={(e) => setNotificationPrefs((p) => ({ ...p, events: e.target.value }))}
                      className="w-full rounded-pier-md border border-border bg-parchment px-3 py-2 text-[14px] text-ink"
                    >
                      <option value="Email">Email</option>
                      <option value="Off">Off</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="eyebrow mb-1 block">Partner updates</span>
                    <select
                      value={channelValue(notificationPrefs.partners)}
                      onChange={(e) => setNotificationPrefs((p) => ({ ...p, partners: e.target.value }))}
                      className="w-full rounded-pier-md border border-border bg-parchment px-3 py-2 text-[14px] text-ink"
                    >
                      <option value="Email">Email</option>
                      <option value="Off">Off</option>
                    </select>
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <ProfileField label="Deal flow alerts" value={channelValue(notificationPrefs.deal_flow)} />
                  <ProfileField label="Event invitations" value={channelValue(notificationPrefs.events)} />
                  <ProfileField label="Partner updates" value={channelValue(notificationPrefs.partners)} />
                </div>
              )}
            </ProfileSectionCard>
          </div>
        </div>
      ) : null}
    </PageFrame>
  );
}
