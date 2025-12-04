import { CreditCard, Plane, Building, Star, Globe, Award, Shield, Sparkles, ArrowUpRight, TrendingUp, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Membership {
  id: string;
  category: string;
  title: string;
  provider: string;
  tier: string;
  description: string;
  benefits: string[];
  value: string;
  status: 'active' | 'expiring-soon' | 'pending';
  renewalDate?: string;
  icon: any;
  color: string;
}

const memberships: Membership[] = [
  {
    id: '1',
    category: 'Credit Card',
    title: 'American Express Platinum',
    provider: 'American Express',
    tier: 'Platinum',
    description: 'Premium rewards and travel benefits with comprehensive insurance coverage',
    benefits: [
      '5x points on flights',
      '$200 airline fee credit',
      'Priority Pass lounge access',
      'Hotel elite status',
      'Global concierge service',
    ],
    value: '150,000 points available',
    status: 'active',
    renewalDate: 'Jan 2026',
    icon: CreditCard,
    color: '#c9b896',
  },
  {
    id: '2',
    category: 'Travel',
    title: 'Delta SkyMiles Diamond',
    provider: 'Delta Air Lines',
    tier: 'Diamond Medallion',
    description: 'Elite status with complimentary upgrades and priority services',
    benefits: [
      'Complimentary upgrades',
      'Sky Club access',
      '125,000 MQMs earned',
      'Rollover MQMs',
      'Award Redeposit',
    ],
    value: '425,000 miles',
    status: 'active',
    renewalDate: 'Dec 2025',
    icon: Plane,
    color: '#c9b896',
  },
  {
    id: '3',
    category: 'Hospitality',
    title: 'Soho House Membership',
    provider: 'Soho House',
    tier: 'Global Access',
    description: 'Members-only club with access to all 42 houses worldwide',
    benefits: [
      'All 42 houses globally',
      'Guest privileges',
      'Soho Works access',
      'Member events',
      'Priority reservations',
    ],
    value: 'All locations',
    status: 'active',
    renewalDate: 'Mar 2026',
    icon: Building,
    color: '#c9b896',
  },
  {
    id: '4',
    category: 'Hospitality',
    title: 'Marriott Bonvoy Platinum Elite',
    provider: 'Marriott International',
    tier: 'Platinum Elite',
    description: 'Enhanced room upgrades and exclusive benefits at 8,000+ properties',
    benefits: [
      'Suite upgrades',
      '50% elite night bonus',
      'Late checkout',
      'Lounge access',
      'Welcome gift',
    ],
    value: '285,000 points',
    status: 'active',
    renewalDate: 'Feb 2026',
    icon: Star,
    color: '#c9b896',
  },
  {
    id: '5',
    category: 'Concierge',
    title: 'Quintessentially Membership',
    provider: 'Quintessentially',
    tier: 'Elite',
    description: '24/7 luxury lifestyle concierge service',
    benefits: [
      '24/7 dedicated team',
      'Travel planning',
      'Event access',
      'Restaurant reservations',
      'Luxury procurement',
    ],
    value: 'Unlimited requests',
    status: 'active',
    renewalDate: 'Jun 2026',
    icon: Award,
    color: '#c9b896',
  },
  {
    id: '6',
    category: 'Travel',
    title: 'Priority Pass',
    provider: 'Multiple Providers',
    tier: 'Prestige',
    description: 'Access to 1,300+ airport lounges worldwide',
    benefits: [
      '1,300+ lounges',
      'Unlimited visits',
      'Guest access',
      'Spa services',
      'Dining credits',
    ],
    value: 'Unlimited visits',
    status: 'active',
    icon: Globe,
    color: '#c9b896',
  },
];

export function MembershipsPage() {
  const totalValue = memberships.length;
  const activeCount = memberships.filter(m => m.status === 'active').length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <h1 style={{ fontSize: '36px', fontWeight: 300, letterSpacing: '-0.02em' }} className="text-[#e8e8e8] mb-2">
            Your Memberships
          </h1>
          <p className="text-[#a0a0a0]" style={{ fontSize: '16px', fontWeight: 300 }}>
            Aggregated benefits and exclusive access across all your memberships
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl bg-[#141414] border border-[#2a2a2a]"
          >
            <div className="flex items-center gap-3 mb-2">
              <Shield size={18} className="text-[#c9b896]" />
              <span className="text-[#6a6a6a]" style={{ fontSize: '12px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active Memberships
              </span>
            </div>
            <p style={{ fontSize: '32px', fontWeight: 300 }} className="text-[#e8e8e8]">
              {activeCount}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl bg-[#141414] border border-[#2a2a2a]"
          >
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp size={18} className="text-[#c9b896]" />
              <span className="text-[#6a6a6a]" style={{ fontSize: '12px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Benefits
              </span>
            </div>
            <p style={{ fontSize: '32px', fontWeight: 300 }} className="text-[#e8e8e8]">
              28
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-xl bg-[#141414] border border-[#2a2a2a]"
          >
            <div className="flex items-center gap-3 mb-2">
              <Sparkles size={18} className="text-[#c9b896]" />
              <span className="text-[#6a6a6a]" style={{ fontSize: '12px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pier Optimization
              </span>
            </div>
            <p style={{ fontSize: '32px', fontWeight: 300 }} className="text-[#e8e8e8]">
              $12.4k
            </p>
            <p className="text-[#a0a0a0] mt-1" style={{ fontSize: '12px', fontWeight: 300 }}>
              Saved this year
            </p>
          </motion.div>
        </div>

        {/* Memberships Grid */}
        <div className="space-y-6">
          {memberships.map((membership, index) => {
            const Icon = membership.icon;
            return (
              <motion.div
                key={membership.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.01 }}
                className="group rounded-2xl bg-[#141414] border border-[#2a2a2a] hover:border-[#c9b896]/40 overflow-hidden transition-all"
              >
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-[#1a1a1a] group-hover:bg-[#c9b896]/10 transition-colors">
                        <Icon size={24} className="text-[#c9b896]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 style={{ fontSize: '20px', fontWeight: 400 }} className="text-[#e8e8e8]">
                            {membership.title}
                          </h3>
                          <span className="px-2 py-1 rounded-full bg-[#c9b896]/10 border border-[#c9b896]/20 text-[#c9b896]" style={{ fontSize: '11px', fontWeight: 400 }}>
                            {membership.tier}
                          </span>
                        </div>
                        <p className="text-[#6a6a6a]" style={{ fontSize: '13px', fontWeight: 300 }}>
                          {membership.provider}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[#6a6a6a] block mb-1" style={{ fontSize: '11px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {membership.category}
                      </span>
                      {membership.renewalDate && (
                        <p className="text-[#a0a0a0]" style={{ fontSize: '13px', fontWeight: 300 }}>
                          Renews {membership.renewalDate}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="text-[#a0a0a0] mb-6" style={{ fontSize: '14px', fontWeight: 300, lineHeight: '1.7' }}>
                    {membership.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    {membership.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Check size={14} className="text-[#c9b896] flex-shrink-0" />
                        <span className="text-[#a0a0a0]" style={{ fontSize: '13px', fontWeight: 300 }}>
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-[#1f1f1f]">
                    <div>
                      <p className="text-[#6a6a6a] mb-1" style={{ fontSize: '11px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Current Value
                      </p>
                      <p className="text-[#c9b896]" style={{ fontSize: '16px', fontWeight: 400 }}>
                        {membership.value}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 rounded-lg bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#e8e8e8] transition-colors" style={{ fontSize: '13px', fontWeight: 400 }}>
                        Manage
                      </button>
                      <button className="p-2 rounded-lg bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-colors">
                        <ArrowUpRight size={16} className="text-[#a0a0a0]" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Add New Membership CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-8 rounded-2xl bg-gradient-to-br from-[#141414] to-[#0a0a0a] border border-[#2a2a2a]"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 400 }} className="text-[#e8e8e8] mb-2">
                Connect More Memberships
              </h3>
              <p className="text-[#a0a0a0]" style={{ fontSize: '14px', fontWeight: 300 }}>
                Let Pier optimize and track all your benefits in one place
              </p>
            </div>
            <button className="px-6 py-3 rounded-xl bg-[#c9b896] hover:bg-[#d4c4a6] text-[#0a0a0a] transition-all" style={{ fontSize: '14px', fontWeight: 400 }}>
              Add Membership
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
