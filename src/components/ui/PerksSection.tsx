import { CreditCard, Plane, Building, Star, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { memberships } from '../../data/memberships';
import { perks } from '../../data/perks';

interface PerksSectionProps {
  onMembershipClick?: (id: string) => void;
  onPerkClick?: (id: string) => void;
}

export function PerksSection({ onMembershipClick, onPerkClick }: PerksSectionProps) {
  // Get first 2 memberships and first 2 perks for home page display
  const displayMemberships = memberships.slice(0, 2);
  const displayPerks = perks.slice(0, 2);
  const allItems = [
    ...displayMemberships.map(m => ({ ...m, type: 'membership' as const })),
    ...displayPerks.map(p => ({ ...p, type: 'perk' as const }))
  ];

  const getIcon = (item: typeof allItems[0]) => {
    if (item.type === 'membership') {
      return item.icon;
    } else {
      // Map perk category to icon
      const iconMap: Record<string, any> = {
        dining: CreditCard,
        travel: Plane,
        wellness: Building,
        lifestyle: Star,
        transportation: Plane,
      };
      return iconMap[item.category] || CreditCard;
    }
  };

  const handleClick = (item: typeof allItems[0]) => {
    if (item.type === 'membership' && onMembershipClick) {
      onMembershipClick(item.id);
    } else if (item.type === 'perk' && onPerkClick) {
      onPerkClick(item.id);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h3 style={{ fontSize: '24px', fontWeight: 300, letterSpacing: '-0.01em' }} className="text-text-primary mb-2">
          Your Memberships & Perks
        </h3>
        <p className="text-text-secondary" style={{ fontSize: '14px', fontWeight: 300 }}>
          Aggregated benefits and exclusive access
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allItems.map((item, index) => {
          const Icon = getIcon(item);
          return (
            <motion.div
              key={`${item.type}-${item.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => handleClick(item)}
              className="group rounded-xl bg-surface border border-border hover:border-accent/40 p-6 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-lg bg-surface-elevated group-hover:bg-accent/10 transition-colors">
                  <Icon size={18} className="text-accent" />
                </div>
                <span className="text-text-tertiary group-hover:text-text-secondary transition-colors" style={{ fontSize: '11px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {item.type === 'membership' ? item.category : item.category.toUpperCase()}
                </span>
              </div>

              <h4 style={{ fontSize: '16px', fontWeight: 400 }} className="text-text-primary mb-2">
                {item.title}
              </h4>
              <p className="text-text-secondary mb-3" style={{ fontSize: '13px', fontWeight: 300, lineHeight: '1.6' }}>
                {item.description}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                <div>
                  <p className="text-text-tertiary mb-1" style={{ fontSize: '11px', fontWeight: 300 }}>
                    {item.provider}
                  </p>
                  <p className="text-accent" style={{ fontSize: '13px', fontWeight: 400 }}>
                    {item.value}
                  </p>
                </div>
                <ArrowUpRight size={16} className="text-text-tertiary group-hover:text-accent transition-colors" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
