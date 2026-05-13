import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface MemberForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  stripeCustomerId: string;
  interests: string[];
  preferredCities: string[];
  cards: string[];
  trialDays: number;
  membershipLevel: string;
}

const CARD_OPTIONS = [
  { id: 'amex_platinum', label: 'Amex Platinum' },
  { id: 'amex_gold', label: 'Amex Gold' },
  { id: 'amex_business_platinum', label: 'Amex Business Platinum' },
  { id: 'chase_sapphire_reserve', label: 'Chase Sapphire Reserve' },
  { id: 'chase_sapphire_preferred', label: 'Chase Sapphire Preferred' },
  { id: 'capital_one_venture_x', label: 'Capital One Venture X' },
  { id: 'citi_prestige', label: 'Citi Prestige' },
  { id: 'marriott_bonvoy_brilliant', label: 'Marriott Bonvoy Brilliant' },
  { id: 'hilton_aspire', label: 'Hilton Aspire' },
  { id: 'ihg_premier', label: 'IHG Premier' },
  { id: 'united_club_infinite', label: 'United Club Infinite' },
];

const INTEREST_OPTIONS = [
  'Travel',
  'Points Maximization',
  'Concierge Services',
  'Elite Status Perks',
  'Fine Dining',
  'Luxury Hotels',
  'First/Business Class',
  'Status Matching',
  'Lounge Access',
  'Travel Credits',
];

export default function NewMember() {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState<MemberForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    stripeCustomerId: '',
    interests: [],
    preferredCities: [],
    cards: [],
    trialDays: 14,
    membershipLevel: 'Pro',
  });

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/login');
        return;
      }

      const { data: member } = await supabase
        .from('members')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (member?.role !== 'admin') {
        navigate('/');
        return;
      }

      setIsAuthorized(true);
    }

    checkAdmin();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError('No active session. Please sign in again.');
        return;
      }

      const { data, error: functionError } = await supabase.functions.invoke('create-member', {
        body: form,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (functionError) {
        console.error('create-member invoke error:', functionError);
        const msg =
          (functionError as { message?: string })?.message ||
          (functionError as { error?: string })?.error ||
          String(functionError);
        throw new Error(msg || 'Function call failed');
      }

      if (data?.error) {
        throw new Error(typeof data.error === 'string' ? data.error : data.error?.message || 'Request failed');
      }

      setSuccess(true);
      const baseMsg = data?.message || `Member created! Member ID: ${data?.memberId}`;
      const otpNote =
        data?.otpSent === false && data?.otpError
          ? ` Sign-in email failed: ${data.otpError}`
          : '';
      setSuccessMessage(`${baseMsg}${otpNote}`);

      setForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        stripeCustomerId: '',
        interests: [],
        preferredCities: [],
        cards: [],
        trialDays: 14,
        membershipLevel: 'Pro',
      });
    } catch (err: unknown) {
      console.error('Error creating member:', err);
      const message =
        err instanceof Error
          ? err.message
          : typeof (err as { message?: string })?.message === 'string'
            ? (err as { message: string }).message
            : 'Failed to create member. Check the browser Network tab for the create-member request.';
      setError(message);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter((i) => i !== item)
      : [...array, item];
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E8A76A] via-[#D4915A] to-[#C67F4D]">
        <p className="text-white text-lg">Checking permissions...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-2xl shadow-xl p-12">
            <h1 className="text-4xl font-bold text-[#1A1A1A] mb-2">
              Add New Member
            </h1>
            <p className="text-[#666666] mb-8">
              Create a new Pier member account after payment confirmation
            </p>

            {success && (
              <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">
                  ✓ {successMessage}
                </p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">✗ {error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">
                  Basic Information
                </h2>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      className="w-full px-4 py-3 bg-[#F8F8F8] border border-[#E0E0E0] rounded-lg
                               text-[#1A1A1A] placeholder-[#999999]
                               focus:outline-none focus:border-[#E8764B] focus:ring-2 focus:ring-[#E8764B]/20
                               transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      required
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      className="w-full px-4 py-3 bg-[#F8F8F8] border border-[#E0E0E0] rounded-lg
                               text-[#1A1A1A] placeholder-[#999999]
                               focus:outline-none focus:border-[#E8764B] focus:ring-2 focus:ring-[#E8764B]/20
                               transition-all"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 bg-[#F8F8F8] border border-[#E0E0E0] rounded-lg
                             text-[#1A1A1A] placeholder-[#999999]
                             focus:outline-none focus:border-[#E8764B] focus:ring-2 focus:ring-[#E8764B]/20
                             transition-all"
                    placeholder="member@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Phone <span className="text-[#999999] font-normal">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-[#F8F8F8] border border-[#E0E0E0] rounded-lg
                             text-[#1A1A1A] placeholder-[#999999]
                             focus:outline-none focus:border-[#E8764B] focus:ring-2 focus:ring-[#E8764B]/20
                             transition-all"
                    placeholder="2035551234"
                  />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">
                  Subscription Details
                </h2>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Stripe Customer ID
                  </label>
                  <input
                    type="text"
                    required
                    value={form.stripeCustomerId}
                    onChange={(e) => setForm({ ...form, stripeCustomerId: e.target.value })}
                    className="w-full px-4 py-3 bg-[#F8F8F8] border border-[#E0E0E0] rounded-lg
                             text-[#1A1A1A] placeholder-[#999999] font-mono text-sm
                             focus:outline-none focus:border-[#E8764B] focus:ring-2 focus:ring-[#E8764B]/20
                             transition-all"
                    placeholder="cus_..."
                  />
                  <p className="text-xs text-[#999999] mt-1">
                    Find this in Stripe dashboard after payment
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                      Trial Days
                    </label>
                    <input
                      type="number"
                      value={form.trialDays}
                      onChange={(e) => setForm({ ...form, trialDays: parseInt(e.target.value, 10) || 14 })}
                      className="w-full px-4 py-3 bg-[#F8F8F8] border border-[#E0E0E0] rounded-lg
                               text-[#1A1A1A]
                               focus:outline-none focus:border-[#E8764B] focus:ring-2 focus:ring-[#E8764B]/20
                               transition-all"
                      min={0}
                      max={90}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                      Membership Level
                    </label>
                    <select
                      value={form.membershipLevel}
                      onChange={(e) => setForm({ ...form, membershipLevel: e.target.value })}
                      className="w-full px-4 py-3 bg-[#F8F8F8] border border-[#E0E0E0] rounded-lg
                               text-[#1A1A1A]
                               focus:outline-none focus:border-[#E8764B] focus:ring-2 focus:ring-[#E8764B]/20
                               transition-all"
                    >
                      <option value="Pro">Pro</option>
                      <option value="Founding Member">Founding Member</option>
                      <option value="Core">Core</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">
                  Credit Cards
                </h2>
                <p className="text-sm text-[#666666] mb-4">
                  Select all cards the member has mentioned
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {CARD_OPTIONS.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setForm({ ...form, cards: toggleArrayItem(form.cards, card.id) })}
                      className={`px-4 py-3 rounded-lg border-2 text-left font-medium transition-all ${
                        form.cards.includes(card.id)
                          ? 'bg-[#E8764B]/10 border-[#E8764B] text-[#E8764B]'
                          : 'bg-white border-[#E0E0E0] text-[#666666] hover:border-[#999999]'
                      }`}
                    >
                      {card.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">
                  Interests & Preferences
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {INTEREST_OPTIONS.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => setForm({ ...form, interests: toggleArrayItem(form.interests, interest) })}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        form.interests.includes(interest)
                          ? 'bg-[#E8764B]/10 border-[#E8764B] text-[#E8764B]'
                          : 'bg-white border-[#E0E0E0] text-[#666666] hover:border-[#999999]'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1A1A1A] text-white font-medium py-4 rounded-lg
                         hover:bg-[#333333] transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Member...' : 'Create Member & Send Access Link'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
