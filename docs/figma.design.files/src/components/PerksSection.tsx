import { CreditCard, Plane, Building, Star, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';

interface Perk {
  id: string;
  category: string;
  title: string;
  description: string;
  value: string;
  provider: string;
  icon: any;
}

const perks: Perk[] = [
  {
    id: '1',
    category: 'Credit Card',
    title: 'Amex Platinum 5x Points',
    description: 'On flights booked directly with airlines or through Amex Travel',
    value: '150k points available',
    provider: 'American Express',
    icon: CreditCard,
  },
  {
    id: '2',
    category: 'Travel',
    title: 'Priority Pass Lounge Access',
    description: 'Access to 1,300+ airport lounges worldwide',
    value: 'Unlimited visits',
    provider: 'Multiple Cards',
    icon: Plane,
  },
  {
    id: '3',
    category: 'Membership',
    title: 'Soho House Access',
    description: 'Full membership with global house access',
    value: 'All locations',
    provider: 'Soho House',
    icon: Building,
  },
  {
    id: '4',
    category: 'Elite Status',
    title: 'Marriott Bonvoy Platinum',
    description: 'Suite upgrades, late checkout, and lounge access',
    value: '85 nights earned',
    provider: 'Marriott',
    icon: Star,
  },
];

export function PerksSection() {
  return (
    <div className="w-full">
      <div className="mb-8">
        <h3 style={{ fontSize: '24px', fontWeight: 300, letterSpacing: '-0.01em' }} className="text-[#e8e8e8] mb-2">
          Your Memberships & Perks
        </h3>
        <p className="text-[#a0a0a0]" style={{ fontSize: '14px', fontWeight: 300 }}>
          Aggregated benefits and exclusive access
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {perks.map((perk, index) => {
          const Icon = perk.icon;
          return (
            <motion.div
              key={perk.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="group rounded-xl bg-[#141414] border border-[#2a2a2a] hover:border-[#c9b896]/40 p-6 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-lg bg-[#1a1a1a] group-hover:bg-[#c9b896]/10 transition-colors">
                  <Icon size={18} className="text-[#c9b896]" />
                </div>
                <span className="text-[#6a6a6a] group-hover:text-[#a0a0a0] transition-colors" style={{ fontSize: '11px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {perk.category}
                </span>
              </div>

              <h4 style={{ fontSize: '16px', fontWeight: 400 }} className="text-[#e8e8e8] mb-2">
                {perk.title}
              </h4>
              <p className="text-[#a0a0a0] mb-3" style={{ fontSize: '13px', fontWeight: 300, lineHeight: '1.6' }}>
                {perk.description}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-[#1f1f1f]">
                <div>
                  <p className="text-[#6a6a6a] mb-1" style={{ fontSize: '11px', fontWeight: 300 }}>
                    {perk.provider}
                  </p>
                  <p className="text-[#c9b896]" style={{ fontSize: '13px', fontWeight: 400 }}>
                    {perk.value}
                  </p>
                </div>
                <ArrowUpRight size={16} className="text-[#6a6a6a] group-hover:text-[#c9b896] transition-colors" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
