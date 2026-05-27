import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  getMyCapitalMemberProfile,
  updateMyCapitalMemberProfile,
  type CapitalMemberProfile,
  type CapitalMemberRole,
} from '../../lib/api/capitalMarkets';
import { CAPITAL_SUPABASE_TIMEOUT_MS, withTimeout } from '../../lib/async';
import { Button } from '../../components/ui/Button';
import { ErrorState, LoadingState } from './PageStates';

type EventPrefs = { formats?: string; dietary?: string; notes?: string };
type ConciergePrefs = { travel?: string; communication?: string; notes?: string };

function parsePrefs<T>(raw: unknown): T {
  if (raw && typeof raw === 'object') return raw as T;
  return {} as T;
}

export default function CapitalProfilePage() {
  const { user, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [capitalProfile, setCapitalProfile] = useState<CapitalMemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [firm, setFirm] = useState('');
  const [roleLabel, setRoleLabel] = useState('');
  const [primaryCity, setPrimaryCity] = useState('');

  const [capitalRole, setCapitalRole] = useState<CapitalMemberRole>('lp');
  const [bio, setBio] = useState('');
  const [thesis, setThesis] = useState('');
  const [aumDisplay, setAumDisplay] = useState('');
  const [checkSizeDisplay, setCheckSizeDisplay] = useState('');
  const [focusSectors, setFocusSectors] = useState('');

  const [eventPrefs, setEventPrefs] = useState<EventPrefs>({});
  const [conciergePrefs, setConciergePrefs] = useState<ConciergePrefs>({});
  const [savingSection, setSavingSection] = useState<string | null>(null);

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
        setFullName(user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim());
        setPhone(user.phone || '');
        setFirm(profile?.firm || '');
        setRoleLabel(profile?.title || '');
        setPrimaryCity(profile?.location || '');

        if (profile) {
          setCapitalRole(profile.role);
          setBio(profile.bio);
          setThesis(profile.investmentThesis);
          setAumDisplay(profile.aumDisplay);
          setCheckSizeDisplay(profile.checkSizeDisplay);
          setFocusSectors(profile.focusSectors.join(', '));
        }

        const prefs = user.preferences as Record<string, unknown> | undefined;
        setEventPrefs(parsePrefs<EventPrefs>(prefs?.event_preferences));
        setConciergePrefs(parsePrefs<ConciergePrefs>(prefs?.concierge_preferences));
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
  }, [user]);

  async function saveCore() {
    if (!user) return;
    setSavingSection('core');
    setSaveMessage(null);
    const parts = fullName.trim().split(/\s+/);
    const first = parts[0] || user.first_name;
    const last = parts.slice(1).join(' ') || user.last_name;

    const { error: profileError } = await updateProfile({
      phone,
      preferences: {
        ...user.preferences,
        primary_city: primaryCity,
        firm,
        role_label: roleLabel,
      },
    });

    if (profileError) {
      setSaveMessage(profileError.message);
      setSavingSection(null);
      return;
    }

    if (capitalProfile || firm) {
      try {
        const updated = await updateMyCapitalMemberProfile({
          displayName: fullName || `${first} ${last}`.trim(),
          firm: firm || 'Independent',
          title: roleLabel || null,
          location: primaryCity || null,
          role: capitalRole,
        });
        setCapitalProfile(updated);
      } catch (err) {
        setSaveMessage(err instanceof Error ? err.message : 'Unable to save profile.');
        setSavingSection(null);
        return;
      }
    }

    setSaveMessage('Core profile saved.');
    setSavingSection(null);
  }

  async function saveCapital() {
    if (!user) return;
    setSavingSection('capital');
    setSaveMessage(null);

    try {
      const updated = await updateMyCapitalMemberProfile({
        displayName: fullName || user.email,
        firm: firm || 'Independent',
        role: capitalRole,
        bio: bio || null,
        investmentThesis: thesis || null,
        aumDisplay: aumDisplay || null,
        checkSizeDisplay: checkSizeDisplay || null,
        focusSectors: focusSectors
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        location: primaryCity || null,
        title: roleLabel || null,
      });
      setCapitalProfile(updated);
      setSaveMessage('Capital profile saved.');
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'Unable to save capital profile.');
    } finally {
      setSavingSection(null);
    }
  }

  async function savePrefs(kind: 'event' | 'concierge') {
    if (!user) return;
    setSavingSection(kind);
    setSaveMessage(null);

    const { error: profileError } = await updateProfile({
      preferences: {
        ...user.preferences,
        event_preferences: kind === 'event' ? eventPrefs : user.preferences?.event_preferences,
        concierge_preferences:
          kind === 'concierge' ? conciergePrefs : user.preferences?.concierge_preferences,
      } as typeof user.preferences,
    });

    if (profileError) {
      setSaveMessage(profileError.message);
    } else {
      setSaveMessage(`${kind === 'event' ? 'Event' : 'Concierge'} preferences saved.`);
    }
    setSavingSection(null);
  }

  return (
    <div className="px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
      <div className="mb-10">
        <p className="eyebrow mb-2">Profile</p>
        <h1 className="font-display text-[40px] leading-[0.95] tracking-[-0.02em] text-ink">Your profile</h1>
        <p className="mt-3 max-w-2xl text-[15px] text-slate">
          Core contact details, optional capital profile, and how Pier can support you.
        </p>
        <div className="gilt-rule mt-6 w-12" />
      </div>

      {loading ? <LoadingState label="Loading profile..." /> : null}
      {error ? <ErrorState message={error} /> : null}
      {saveMessage ? (
        <div className="mb-6 rounded-[4px] border border-ledger/20 bg-ledger/[0.04] p-4 text-[13px] text-ledger">
          {saveMessage}
        </div>
      ) : null}

      {!loading && !error && user ? (
        <div className="mx-auto max-w-3xl space-y-10">
          <section className="rounded-[4px] border border-border bg-surface p-6">
            <p className="eyebrow mb-4">Core information</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="eyebrow mb-1 block">Full name</span>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-[4px] border border-border bg-parchment px-3 py-2 text-[14px] text-ink"
                />
              </label>
              <label className="block">
                <span className="eyebrow mb-1 block">Email</span>
                <input
                  value={user.email}
                  disabled
                  className="w-full rounded-[4px] border border-border bg-border/30 px-3 py-2 text-[14px] text-slate"
                />
              </label>
              <label className="block">
                <span className="eyebrow mb-1 block">Phone</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-[4px] border border-border bg-parchment px-3 py-2 text-[14px] text-ink"
                />
              </label>
              <label className="block">
                <span className="eyebrow mb-1 block">Firm</span>
                <input
                  value={firm}
                  onChange={(e) => setFirm(e.target.value)}
                  className="w-full rounded-[4px] border border-border bg-parchment px-3 py-2 text-[14px] text-ink"
                />
              </label>
              <label className="block">
                <span className="eyebrow mb-1 block">Role / title</span>
                <input
                  value={roleLabel}
                  onChange={(e) => setRoleLabel(e.target.value)}
                  className="w-full rounded-[4px] border border-border bg-parchment px-3 py-2 text-[14px] text-ink"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="eyebrow mb-1 block">Primary city</span>
                <input
                  value={primaryCity}
                  onChange={(e) => setPrimaryCity(e.target.value)}
                  className="w-full rounded-[4px] border border-border bg-parchment px-3 py-2 text-[14px] text-ink"
                />
              </label>
            </div>
            <Button className="mt-5" loading={savingSection === 'core'} onClick={saveCore}>
              Save core information
            </Button>
          </section>

          <section className="rounded-[4px] border border-border bg-surface p-6">
            <p className="eyebrow mb-1">Capital profile</p>
            <p className="mb-4 text-[13px] text-slate">Optional — visible when you publish a GP/LP directory entry.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="eyebrow mb-1 block">Allocator type</span>
                <select
                  value={capitalRole}
                  onChange={(e) => setCapitalRole(e.target.value as CapitalMemberRole)}
                  className="w-full rounded-[4px] border border-border bg-parchment px-3 py-2 text-[14px] text-ink"
                >
                  <option value="gp">GP</option>
                  <option value="lp">LP</option>
                </select>
              </label>
              <label className="block">
                <span className="eyebrow mb-1 block">AUM (display)</span>
                <input
                  value={aumDisplay}
                  onChange={(e) => setAumDisplay(e.target.value)}
                  className="w-full rounded-[4px] border border-border bg-parchment px-3 py-2 text-[14px] text-ink"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="eyebrow mb-1 block">Check size</span>
                <input
                  value={checkSizeDisplay}
                  onChange={(e) => setCheckSizeDisplay(e.target.value)}
                  className="w-full rounded-[4px] border border-border bg-parchment px-3 py-2 text-[14px] text-ink"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="eyebrow mb-1 block">Focus sectors (comma-separated)</span>
                <input
                  value={focusSectors}
                  onChange={(e) => setFocusSectors(e.target.value)}
                  className="w-full rounded-[4px] border border-border bg-parchment px-3 py-2 text-[14px] text-ink"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="eyebrow mb-1 block">Bio</span>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-[4px] border border-border bg-parchment px-3 py-2 text-[14px] text-ink"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="eyebrow mb-1 block">Investment thesis</span>
                <textarea
                  value={thesis}
                  onChange={(e) => setThesis(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-[4px] border border-border bg-parchment px-3 py-2 text-[14px] text-ink"
                />
              </label>
            </div>
            <Button className="mt-5" loading={savingSection === 'capital'} onClick={saveCapital}>
              Save capital profile
            </Button>
          </section>

          <section className="rounded-[4px] border border-border bg-surface p-6">
            <p className="eyebrow mb-4">Event preferences</p>
            <div className="grid gap-4">
              <label className="block">
                <span className="eyebrow mb-1 block">Preferred formats</span>
                <input
                  value={eventPrefs.formats || ''}
                  onChange={(e) => setEventPrefs((p) => ({ ...p, formats: e.target.value }))}
                  placeholder="Dinners, summits, intimate allocator tables..."
                  className="w-full rounded-[4px] border border-border bg-parchment px-3 py-2 text-[14px] text-ink"
                />
              </label>
              <label className="block">
                <span className="eyebrow mb-1 block">Dietary / accessibility</span>
                <input
                  value={eventPrefs.dietary || ''}
                  onChange={(e) => setEventPrefs((p) => ({ ...p, dietary: e.target.value }))}
                  className="w-full rounded-[4px] border border-border bg-parchment px-3 py-2 text-[14px] text-ink"
                />
              </label>
            </div>
            <Button className="mt-5" loading={savingSection === 'event'} onClick={() => savePrefs('event')}>
              Save event preferences
            </Button>
          </section>

          <section className="rounded-[4px] border border-border bg-surface p-6">
            <p className="eyebrow mb-4">Concierge preferences</p>
            <div className="grid gap-4">
              <label className="block">
                <span className="eyebrow mb-1 block">Travel preferences</span>
                <input
                  value={conciergePrefs.travel || ''}
                  onChange={(e) => setConciergePrefs((p) => ({ ...p, travel: e.target.value }))}
                  className="w-full rounded-[4px] border border-border bg-parchment px-3 py-2 text-[14px] text-ink"
                />
              </label>
              <label className="block">
                <span className="eyebrow mb-1 block">Communication</span>
                <input
                  value={conciergePrefs.communication || ''}
                  onChange={(e) => setConciergePrefs((p) => ({ ...p, communication: e.target.value }))}
                  placeholder="Email, text, assistant cc..."
                  className="w-full rounded-[4px] border border-border bg-parchment px-3 py-2 text-[14px] text-ink"
                />
              </label>
            </div>
            <Button
              className="mt-5"
              loading={savingSection === 'concierge'}
              onClick={() => savePrefs('concierge')}
            >
              Save concierge preferences
            </Button>
          </section>

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
