import { CreditCard, Plane, Building, Star, Globe, Award } from 'lucide-react';
import { MembershipDetailData } from '../components/ui/MembershipDetail';
import { MembershipManagementData } from '../components/ui/MembershipManagement';

export interface Membership {
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
  logoColor: string;
  imageUrl: string;
}

export const memberships: Membership[] = [
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
    value: '150,000 points',
    status: 'active',
    renewalDate: 'Jan 2026',
    icon: CreditCard,
    logoColor: '#0077BE',
    imageUrl: 'https://images.unsplash.com/photo-1684952659359-05d3d4453c11?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbWVyaWNhbiUyMGV4cHJlc3MlMjBwbGF0aW51bSUyMGNhcmR8ZW58MXx8fHwxNzY0NjQ5NzIwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
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
    logoColor: '#C8102E',
    imageUrl: 'https://images.unsplash.com/photo-1646109495568-30cd8b5d0251?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWx0YSUyMGFpcmxpbmVzJTIwcGxhbmV8ZW58MXx8fHwxNzY0NjQ5NzIxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
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
    logoColor: '#1a1a1a',
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaW5lJTIwZGluaW5nJTIwcmVzdGF1cmFudHxlbnwxfHx8fDE3NjQ1MDc1NDh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
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
    logoColor: '#8B4513',
    imageUrl: 'https://images.unsplash.com/photo-1733253870763-49f6fadb7c2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJyaW90dCUyMGx1eHVyeSUyMGhvdGVsfGVufDF8fHx8MTc2NDY0OTcyMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
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
    logoColor: '#8B7355',
    imageUrl: 'https://images.unsplash.com/photo-1609189123897-42db027571c9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jaWVyZ2UlMjBzZXJ2aWNlJTIwbHV4dXJ5fGVufDF8fHx8MTc2NDYzMTY3NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
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
    renewalDate: 'Jan 2026',
    icon: Globe,
    logoColor: '#003D7A',
    imageUrl: 'https://images.unsplash.com/photo-1761377197584-2eed555e2b0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhaXJwb3J0JTIwbG91bmdlJTIwcHJlbWl1bXxlbnwxfHx8fDE3NjQ1ODUzNjR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  },
];

// Enhanced membership details
export const membershipDetails: Record<string, MembershipDetailData> = {
  '1': {
    id: '1',
    title: 'American Express Platinum',
    provider: 'American Express',
    tier: 'Platinum Card',
    category: 'Credit Card',
    description: 'Premium rewards and travel benefits with comprehensive insurance coverage',
    about: 'The Platinum Card from American Express is designed for those who appreciate premium travel experiences and exclusive benefits. With a robust rewards program, comprehensive travel protections, and access to exclusive experiences, this card serves as your passport to luxury.',
    imageUrl: 'https://images.unsplash.com/photo-1684952659359-05d3d4453c11?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbWVyaWNhbiUyMGV4cHJlc3MlMjBwbGF0aW51bSUyMGNhcmR8ZW58MXx8fHwxNzY0NjQ5NzIwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    logoColor: '#0077BE',
    benefits: [
      {
        category: 'Travel Rewards',
        items: [
          '5x points on flights booked directly with airlines',
          '5x points on prepaid hotels through Amex Travel',
          '1x points on all other purchases',
          'Access to Amex Offers for bonus points'
        ]
      },
      {
        category: 'Travel Credits & Benefits',
        items: [
          '$200 airline fee credit annually',
          '$200 hotel credit annually',
          '$189 CLEAR credit',
          '$100 Saks Fifth Avenue credit',
          'Global Entry or TSA PreCheck credit'
        ]
      },
      {
        category: 'Lounge Access',
        items: [
          'Priority Pass Select membership',
          'Centurion Lounge access',
          'Delta Sky Club access',
          'Escape Lounge access'
        ]
      },
      {
        category: 'Elite Status',
        items: [
          'Marriott Bonvoy Gold Elite',
          'Hilton Honors Gold',
          'National Car Rental Executive status',
          'Hertz Presidents Circle'
        ]
      }
    ],
    value: {
      annual: '$1,845',
      thisYear: '$1,650',
      breakdown: [
        { label: '5x Points on Flights ($30k spend)', value: '$600' },
        { label: 'Airline Fee Credit', value: '$200' },
        { label: 'Hotel Credit', value: '$200' },
        { label: 'Priority Pass Lounges', value: '$450' },
        { label: 'CLEAR Credit', value: '$189' },
        { label: 'Elite Hotel Status Value', value: '$350' }
      ]
    },
    usage: [
      { label: 'Airline Fee Credit', current: 145, total: 200, unit: 'USD' },
      { label: 'Hotel Credit', current: 200, total: 200, unit: 'USD' },
      { label: 'Saks Credit', current: 50, total: 100, unit: 'USD' }
    ],
    status: {
      active: true,
      renewalDate: 'Jan 15, 2026',
      memberSince: 'Jan 2020'
    },
    tips: [
      'Use airline fee credit for seat upgrades and baggage fees',
      'Book hotels through Amex Fine Hotels & Resorts for extra perks',
      'Maximize 5x points by booking flights directly with airlines',
      'Transfer points to airline partners for maximum value',
      'Use hotel credit for prepaid stays to stack with elite benefits'
    ],
    resources: [
      { label: 'Account Dashboard', url: 'https://www.americanexpress.com' },
      { label: 'Amex Offers', url: 'https://www.americanexpress.com/offers' },
      { label: 'Fine Hotels & Resorts', url: 'https://www.americanexpress.com/fhr' },
      { label: 'Transfer Partners', url: 'https://www.americanexpress.com/rewards' }
    ]
  },
  '2': {
    id: '2',
    title: 'Delta SkyMiles Diamond Medallion',
    provider: 'Delta Air Lines',
    tier: 'Diamond Medallion',
    category: 'Travel',
    description: 'Elite status with complimentary upgrades and priority services',
    about: 'Delta Diamond Medallion is the highest tier of elite status in the SkyMiles program. Enjoy exclusive benefits including complimentary upgrades, Sky Club access, priority boarding, and enhanced earning rates on every Delta flight.',
    imageUrl: 'https://images.unsplash.com/photo-1646109495568-30cd8b5d0251?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWx0YSUyMGFpcmxpbmVzJTIwcGxhbmV8ZW58MXx8fHwxNzY0NjQ5NzIxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    logoColor: '#C8102E',
    benefits: [
      {
        category: 'Upgrades & Seating',
        items: [
          'Complimentary upgrades to First Class',
          'Unlimited Complimentary Upgrades',
          'Priority boarding - Zone 1',
          'Preferred seating selection',
          'Choice Benefits (4 Regional or 2 Global Upgrades)'
        ]
      },
      {
        category: 'Lounge Access',
        items: [
          'Unlimited Sky Club access',
          'Guest access to Sky Club',
          'Partner lounge access worldwide',
          'Delta One at the Gate upgrades'
        ]
      },
      {
        category: 'Earning & Redemptions',
        items: [
          '125% MQM bonus',
          '11x miles on Delta flights',
          'Rollover MQMs',
          'Million Miler progress',
          'Award redeposit fee waived'
        ]
      },
      {
        category: 'Travel Perks',
        items: [
          'Waived change fees',
          'Same-day confirmed changes',
          'Priority baggage handling',
          '3 free checked bags',
          'Dedicated Diamond phone line'
        ]
      }
    ],
    value: {
      annual: '$4,850',
      thisYear: '$4,200',
      breakdown: [
        { label: 'Complimentary Upgrades (24 flights)', value: '$2,400' },
        { label: 'Sky Club Access (48 visits)', value: '$2,880' },
        { label: 'Checked Bag Savings', value: '$420' },
        { label: 'Priority Services', value: '$350' }
      ]
    },
    usage: [
      { label: 'MQMs Earned', current: 145000, total: 125000, unit: 'miles' },
      { label: 'Choice Benefits Used', current: 3, total: 4, unit: 'upgrades' },
      { label: 'Sky Club Visits', current: 48, total: 999, unit: 'visits' }
    ],
    status: {
      active: true,
      renewalDate: 'Dec 31, 2025',
      memberSince: 'Jan 2019'
    },
    tips: [
      'Request upgrades 5 days before departure for best availability',
      'Use Choice Benefits for international flights to maximize value',
      'Book revenue tickets to maintain status with MQD requirements',
      'Visit Sky Club 2-3 hours before international flights',
      'Set up SMS alerts for upgrade confirmation'
    ],
    resources: [
      { label: 'SkyMiles Account', url: 'https://www.delta.com' },
      { label: 'Medallion Benefits Guide', url: 'https://www.delta.com/medallion' },
      { label: 'Sky Club Locations', url: 'https://www.delta.com/skyclub' },
      { label: 'Partner Airline Benefits', url: 'https://www.delta.com/partners' }
    ]
  }
};

// Management data
export const managementData: Record<string, MembershipManagementData> = {
  '1': {
    id: '1',
    title: 'American Express Platinum',
    provider: 'American Express',
    tier: 'Platinum Card',
    logoColor: '#0077BE',
    status: {
      active: true,
      renewalDate: 'Jan 15, 2026',
      autoRenew: true
    },
    connection: {
      connected: true,
      email: 'sarah@example.com',
      lastSync: '2 hours ago',
      syncStatus: 'success'
    },
    notifications: {
      benefitReminders: true,
      renewalAlerts: true,
      usageTracking: true
    },
    payment: {
      annualFee: '$695',
      nextBilling: 'Jan 15, 2026',
      paymentMethod: 'Bank Account •••• 4321'
    }
  },
  '2': {
    id: '2',
    title: 'Delta SkyMiles Diamond Medallion',
    provider: 'Delta Air Lines',
    tier: 'Diamond Medallion',
    logoColor: '#C8102E',
    status: {
      active: true,
      renewalDate: 'Dec 31, 2025',
      autoRenew: true
    },
    connection: {
      connected: true,
      email: 'sarah@example.com',
      lastSync: '1 day ago',
      syncStatus: 'success'
    },
    notifications: {
      benefitReminders: true,
      renewalAlerts: true,
      usageTracking: true
    },
    payment: {
      annualFee: 'Complimentary',
      nextBilling: 'Status based on activity',
      paymentMethod: undefined
    }
  }
};

