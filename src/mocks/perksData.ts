import type { Perk } from '../types';

// Mock data for featured perks
export const mockFeaturedPerks: Perk[] = [
  {
    id: 'perk-1',
    title: 'Priority Reservations at Le Bernardin',
    short_description: 'Guaranteed reservations at Michelin-starred Le Bernardin with 24-hour notice.',
    partner_description: 'Le Bernardin, led by chef Eric Ripert, is one of the world\'s most acclaimed fine dining establishments. With three Michelin stars maintained consistently since 2005, the restaurant offers sophisticated French cuisine with an emphasis on seafood. Located in Midtown Manhattan, Le Bernardin sets the standard for fine dining in New York City with its elegant atmosphere and impeccable service.',
    benefits: [
      'Guaranteed reservations with just 24-hour notice, bypassing the typical 60-day waiting list',
      'Complimentary glass of champagne for your party upon arrival',
      'Priority seating in the main dining room',
      'Special off-menu chef\'s selections when available',
      'Dedicated concierge contact for special requests and dietary accommodations'
    ],
    image_url: 'https://images.pexels.com/photos/4253320/pexels-photo-4253320.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    category: 'dining',
    city: 'New York',
    tags: ['michelin', 'exclusive', 'fine dining'],
    featured: true,
    minimum_level: 'Premium',
    redemption_instructions: 'Contact your Pier concierge at least 24 hours before your desired reservation time. Provide your name, desired date, time, and number of guests. Your confirmation will be sent via email within 2 hours.'
  },
  {
    id: 'perk-2',
    title: 'Suite Upgrade at Four Seasons',
    short_description: 'Complimentary suite upgrade at Four Seasons properties worldwide.',
    partner_description: 'Four Seasons Hotels and Resorts represents the pinnacle of luxury hospitality, with over 120 properties worldwide. Known for their exceptional service, stunning properties, and attention to detail, Four Seasons consistently ranks among the world\'s best luxury hotel brands. Each property offers a unique blend of local culture and world-class amenities.',
    benefits: [
      'Guaranteed upgrade from standard room to next available suite category',
      'Early check-in at 11am and late check-out at 4pm (subject to availability)',
      'Daily breakfast for two at the hotel restaurant or through in-room dining',
      'Welcome amenity customized to your preferences',
      '$100 hotel credit per stay for spa or dining',
      'Priority access to hotel restaurants and spa services'
    ],
    image_url: 'https://images.pexels.com/photos/2507010/pexels-photo-2507010.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    category: 'hotels',
    city: 'London',
    tags: ['luxury', 'upgrade', 'global'],
    featured: true,
    minimum_level: 'Executive',
    redemption_instructions: 'When booking through your Pier concierge, mention your suite upgrade benefit. Present your digital Pier membership card upon check-in. Upgrades are subject to availability at time of check-in.'
  },
  {
    id: 'perk-3',
    title: 'Private Yacht Day in Miami',
    short_description: 'Exclusive access to luxury yacht charters with preferred pricing.',
    partner_description: 'Our premier yacht charter partner in Miami offers a fleet of meticulously maintained luxury vessels ranging from 40 to 120 feet. With over 20 years of experience in luxury charters, they provide exceptional maritime experiences with professional crews, gourmet catering, and comprehensive water sports equipment.',
    benefits: [
      '20% discount on all yacht charters',
      'Priority booking during peak seasons and events',
      'Complimentary champagne and gourmet welcome basket',
      'Dedicated cruise planner for customized itineraries',
      'Access to exclusive docking locations',
      'Complimentary water sports equipment and instruction'
    ],
    image_url: 'https://images.pexels.com/photos/163236/luxury-yacht-boat-speed-water-163236.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    category: 'experiences',
    city: 'Miami',
    tags: ['luxury', 'exclusive', 'water'],
    featured: true,
    redemption_instructions: 'Book through your Pier concierge with at least 72 hours notice. Specify your preferred date, time, duration, and number of guests. A 50% deposit is required to confirm your reservation.'
  },
  {
    id: 'perk-4',
    title: 'VIP Access to Paris Fashion Week',
    short_description: 'Front row seats and exclusive after-parties during Paris Fashion Week.',
    partner_description: 'Our partnership with the Fédération de la Haute Couture et de la Mode provides unprecedented access to Paris Fashion Week, one of the most prestigious events in the fashion calendar. This exclusive relationship opens doors to the most coveted shows, designer meet-and-greets, and the most exclusive after-parties.',
    benefits: [
      'Front row seating at select runway shows',
      'Access to exclusive designer previews and trunk shows',
      'Invitations to official Fashion Week after-parties',
      'Private styling consultations with featured designers',
      'Priority access to limited edition pieces',
      'Dedicated fashion concierge throughout Fashion Week'
    ],
    image_url: 'https://images.pexels.com/photos/1884581/pexels-photo-1884581.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    category: 'lifestyle',
    city: 'Paris',
    tags: ['fashion', 'exclusive', 'vip'],
    featured: true,
    minimum_level: 'Founding Member',
    redemption_instructions: 'Contact your Pier concierge at least 60 days before Paris Fashion Week to request your preferred shows. Availability is limited and allocated on a first-come, first-served basis.'
  }
];

// Mock data for category perks
export const mockCategoryPerks = {
  dining: [
    {
      id: 'dining-1',
      title: 'Private Dining Room at Eleven Madison Park',
      short_description: 'Exclusive access to the private dining room at Eleven Madison Park.',
      partner_description: 'Eleven Madison Park, under the leadership of Chef Daniel Humm, has earned three Michelin stars and is widely regarded as one of the world\'s finest restaurants. Located in a stunning Art Deco building overlooking Madison Square Park, the restaurant is renowned for its innovative tasting menus and exceptional hospitality.',
      benefits: [
        'Priority access to the private dining room for groups of 8-14 guests',
        'Customized tasting menu consultation with Chef Daniel Humm',
        'Dedicated sommelier for personalized wine pairings',
        'Personalized printed menus for your event',
        'Special kitchen tour and meet-and-greet with the chef',
        'Complimentary champagne toast for all guests'
      ],
      image_url: 'https://images.pexels.com/photos/262047/pexels-photo-262047.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      category: 'dining',
      city: 'New York',
      tags: ['michelin', 'private dining', 'exclusive'],
      featured: false,
      minimum_level: 'Executive'
    },
    {
      id: 'dining-2',
      title: 'Chef\'s Table Experience at Vespertine',
      short_description: 'Intimate chef\'s table experience at the avant-garde Vespertine restaurant.',
      partner_description: 'Vespertine, helmed by Chef Jordan Kahn, represents the pinnacle of avant-garde dining in Los Angeles. Housed in a striking architectural space designed by Eric Owen Moss, the restaurant offers a multi-sensory dining experience that pushes the boundaries of culinary artistry.',
      benefits: [
        'Exclusive chef\'s table seating for up to 6 guests',
        'Extended tasting menu with unique off-menu items',
        'Personal interaction with Chef Jordan Kahn throughout the meal',
        'Behind-the-scenes kitchen tour',
        'Signed copy of the evening\'s menu',
        'Priority reservations for future visits'
      ],
      image_url: 'https://images.pexels.com/photos/2403391/pexels-photo-2403391.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      category: 'dining',
      city: 'Los Angeles',
      tags: ['chef table', 'avant-garde', 'exclusive'],
      featured: false,
      minimum_level: 'Premium'
    },
    {
      id: 'dining-3',
      title: 'Priority Access to Carbone Miami',
      short_description: 'Skip the line with guaranteed reservations at Carbone Miami.',
      partner_description: 'Carbone Miami, part of Major Food Group\'s acclaimed portfolio, brings New York\'s beloved Italian-American cuisine to South Beach. Known for its theatrical service, vintage glamour, and celebrity clientele, Carbone offers an unparalleled dining experience that captures the essence of mid-century Italian restaurants.',
      benefits: [
        'Guaranteed reservations with 48-hour notice',
        'Preferred seating in main dining room',
        'Complimentary signature appetizer',
        'Priority access to special seasonal menus',
        'VIP status for walk-in bar seating',
        'Direct line to restaurant management for special requests'
      ],
      image_url: 'https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      category: 'dining',
      city: 'Miami',
      tags: ['italian', 'popular', 'celebrity'],
      featured: false
    },
    {
      id: 'dining-4',
      title: 'Exclusive Tasting Menu at Hakkasan',
      short_description: 'Special off-menu tasting experience at Hakkasan with wine pairings.',
      partner_description: 'Hakkasan London, a Michelin-starred restaurant, sets the global standard for modern Cantonese cuisine. With its distinctive design, ambient lighting, and contemporary approach to traditional Chinese flavors, Hakkasan creates an atmosphere of sophisticated dining and innovative cocktail culture.',
      benefits: [
        'Access to exclusive off-menu dishes',
        'Customized tasting menu with wine pairings',
        'Priority booking for private dining spaces',
        'Complimentary signature cocktail upon arrival',
        'Special seasonal chef\'s selections',
        'VIP status for future reservations worldwide'
      ],
      image_url: 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      category: 'dining',
      city: 'London',
      tags: ['chinese', 'michelin', 'tasting menu'],
      featured: false,
      minimum_level: 'Premium'
    }
  ],
  hotels: [
    {
      id: 'hotel-1',
      title: 'Penthouse Access at The Mark Hotel',
      short_description: 'Exclusive booking privileges for the penthouse suite at The Mark Hotel.',
      partner_description: 'The Mark Hotel, housed in a historic 1927 building, represents the pinnacle of New York luxury hospitality. This award-winning hotel combines avant-garde design by Jacques Grange with exceptional service, making it a favorite among celebrities and discerning travelers. The Mark Penthouse is one of the largest and most luxurious hotel penthouses in the world.',
      benefits: [
        'Priority booking access for The Mark Penthouse',
        'Complimentary airport transfer via The Mark\'s luxury vehicle',
        'Personal butler service throughout your stay',
        'Daily breakfast for up to 8 guests',
        'Access to The Mark\'s luxury yacht during summer months',
        '$500 daily food and beverage credit'
      ],
      image_url: 'https://images.pexels.com/photos/1001965/pexels-photo-1001965.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      category: 'hotels',
      city: 'New York',
      tags: ['luxury', 'penthouse', 'suite'],
      featured: false,
      minimum_level: 'Founding Member'
    },
    {
      id: 'hotel-2',
      title: 'Villa Upgrade at Amangiri',
      short_description: 'Complimentary upgrade to a luxury villa at the exclusive Amangiri resort.',
      partner_description: 'Amangiri is an architectural masterpiece set among 600 acres of pristine Utah desert. This luxury resort seamlessly blends into its dramatic surroundings, offering unparalleled privacy and comfort. Known for its minimalist design and exceptional service, Amangiri provides a unique desert luxury experience.',
      benefits: [
        'Guaranteed upgrade to next available villa category',
        'Daily private yoga or meditation session',
        'Complimentary desert excursion for two',
        'Daily breakfast and dinner included',
        'Early check-in and late check-out privileges',
        'Private pool heating during cooler months'
      ],
      image_url: 'https://images.pexels.com/photos/1268871/pexels-photo-1268871.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      category: 'hotels',
      city: 'Los Angeles',
      tags: ['resort', 'villa', 'desert'],
      featured: false,
      minimum_level: 'Executive'
    },
    {
      id: 'hotel-3',
      title: 'Oceanfront Suite at Faena Hotel',
      short_description: 'Guaranteed oceanfront accommodations at the iconic Faena Hotel Miami Beach.',
      partner_description: 'Faena Hotel Miami Beach is a masterpiece of art and luxury, featuring distinctive design by film director Baz Luhrmann and Catherine Martin. This oceanfront property combines Latin American hospitality with cutting-edge art, creating a unique cultural destination within Miami\'s vibrant hotel scene.',
      benefits: [
        'Guaranteed oceanfront suite accommodation',
        'Complimentary cabana reservation daily',
        'Access to private Faena Club',
        'Butler service throughout your stay',
        'Welcome amenity including Faena signature red wine',
        'Priority reservations at all Faena restaurants and spa'
      ],
      image_url: 'https://images.pexels.com/photos/2373201/pexels-photo-2373201.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      category: 'hotels',
      city: 'Miami',
      tags: ['oceanfront', 'beach', 'luxury'],
      featured: false,
      minimum_level: 'Premium'
    },
    {
      id: 'hotel-4',
      title: 'Royal Treatment at The Savoy London',
      short_description: 'VIP status and exclusive amenities at the iconic Savoy London.',
      partner_description: 'The Savoy, London\'s first luxury hotel, has been setting the standard for luxury hospitality since 1889. With its prime location along the Thames and unparalleled British service, The Savoy continues to be a symbol of elegance and sophistication in London\'s hotel landscape.',
      benefits: [
        'Automatic room upgrade upon availability',
        'Personalized welcome amenities',
        '£100 daily dining credit',
        'Access to private concierge team',
        'Complimentary English breakfast and afternoon tea',
        'Priority reservations at all Savoy restaurants'
      ],
      image_url: 'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      category: 'hotels',
      city: 'London',
      tags: ['historic', 'luxury', 'british'],
      featured: false
    }
  ],
  experiences: [
    {
      id: 'exp-1',
      title: 'Private Met Museum Tour',
      short_description: 'After-hours private tour of the Metropolitan Museum of Art with an expert curator.',
      partner_description: 'The Metropolitan Museum of Art is one of the world\'s largest and most comprehensive art museums. Housing over 2 million works of art spanning 5,000 years of human creativity, the Met provides an unparalleled window into global cultural heritage. Our exclusive partnership allows for unique access to this cultural treasure.',
      benefits: [
        'Private after-hours access to select galleries',
        'Expert-led tour customized to your interests',
        'Access to areas typically closed to the public',
        'Private reception in the Temple of Dendur',
        'Annual Met patron membership included',
        'Priority access to special exhibitions'
      ],
      image_url: 'https://images.pexels.com/photos/1839919/pexels-photo-1839919.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      category: 'experiences',
      city: 'New York',
      tags: ['art', 'cultural', 'private'],
      featured: false,
      minimum_level: 'Executive'
    },
    {
      id: 'exp-2',
      title: 'Hollywood Studio Access',
      short_description: 'VIP behind-the-scenes access to major Hollywood studio productions.',
      partner_description: 'Through our exclusive partnership with one of Hollywood\'s largest studios, we offer unprecedented access to the heart of the entertainment industry. This insider experience provides a genuine look at the filmmaking process, from pre-production to final cut, with access to active sets and industry professionals.',
      benefits: [
        'Behind-the-scenes tours of active productions',
        'Meet-and-greet opportunities with industry professionals',
        'Access to private commissary dining',
        'Preview screenings of upcoming releases',
        'VIP seats for live show tapings',
        'Studio lot transportation via private golf cart'
      ],
      image_url: 'https://images.pexels.com/photos/66134/pexels-photo-66134.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      category: 'experiences',
      city: 'Los Angeles',
      tags: ['entertainment', 'exclusive', 'behind-the-scenes'],
      featured: false,
      minimum_level: 'Premium'
    },
    {
      id: 'exp-3',
      title: 'Private Deep Sea Fishing',
      short_description: 'Chartered luxury sport fishing experience in the Gulf Stream waters.',
      partner_description: 'Our premier fishing partner operates a fleet of custom-built Viking sport fishing yachts, led by experienced captains with decades of Gulf Stream fishing expertise. Their vessels are equipped with state-of-the-art technology and fishing equipment, ensuring the best possible deep-sea fishing experience.',
      benefits: [
        'Access to fleet of luxury fishing vessels',
        'Expert captain and crew',
        'Top-of-the-line fishing equipment provided',
        'Gourmet catering and premium beverages',
        'Professional photography of your catch',
        'Fish cleaning and packaging service'
      ],
      image_url: 'https://images.pexels.com/photos/64219/pexels-photo-64219.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      category: 'experiences',
      city: 'Miami',
      tags: ['fishing', 'luxury', 'charter'],
      featured: false
    },
    {
      id: 'exp-4',
      title: 'Royal Ascot Private Box',
      short_description: 'Exclusive access to a private box at Royal Ascot with full hospitality.',
      partner_description: 'Royal Ascot is Britain\'s most valuable race meeting, attracting many of the world\'s finest racehorses and the cream of society. Our partnership provides access to one of the most prestigious private boxes in the Queen Anne Enclosure, offering an unparalleled view of both the racing action and the Royal Procession.',
      benefits: [
        'Private box access for up to 12 guests',
        'Premium champagne reception',
        'Four-course lunch with wine pairings',
        'Traditional afternoon tea service',
        'Dedicated racing expert and betting assistance',
        'Complimentary race day program and binoculars'
      ],
      image_url: 'https://images.pexels.com/photos/159501/pexels-photo-159501.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      category: 'experiences',
      city: 'London',
      tags: ['sport', 'luxury', 'british'],
      featured: false,
      minimum_level: 'Executive'
    }
  ],
  lifestyle: [
    {
      id: 'lifestyle-1',
      title: 'Personal Shopping at Bergdorf Goodman',
      short_description: 'VIP personal shopping experience at Bergdorf Goodman with store credit.',
      partner_description: 'Bergdorf Goodman has been the pinnacle of New York luxury retail since 1899. This iconic department store offers an unparalleled selection of designer fashion, accessories, and home goods. Their team of expert personal shoppers brings decades of fashion expertise to create personalized styling experiences.',
      benefits: [
        'Access to private shopping suite',
        'Dedicated personal stylist',
        '$500 store credit per visit',
        'Pre-access to new collections',
        'Complimentary alterations',
        'Priority invitations to designer trunk shows'
      ],
      image_url: 'https://images.pexels.com/photos/994523/pexels-photo-994523.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      category: 'lifestyle',
      city: 'New York',
      tags: ['shopping', 'luxury', 'fashion'],
      featured: false,
      minimum_level: 'Premium'
    },
    {
      id: 'lifestyle-2',
      title: 'Celebrity Stylist Consultation',
      short_description: 'Personal styling session with a celebrity stylist to your home or hotel.',
      partner_description: 'Our network includes some of Hollywood\'s most sought-after celebrity stylists, who regularly dress A-list clients for red carpet events and magazine covers. These experienced professionals bring their expertise directly to you, offering personalized styling advice and access to exclusive designer pieces.',
      benefits: [
        'Two-hour personal styling session',
        'Wardrobe audit and organization',
        'Personalized look book creation',
        'Access to pre-release designer collections',
        'Direct contact with stylist for future events',
        'Priority access to sample sales'
      ],
      image_url: 'https://images.pexels.com/photos/5698853/pexels-photo-5698853.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      category: 'lifestyle',
      city: 'Los Angeles',
      tags: ['fashion', 'celebrity', 'styling'],
      featured: false,
      minimum_level: 'Executive'
    },
    {
      id: 'lifestyle-3',
      title: 'Exclusive Spa Day at The Setai',
      short_description: 'Customized spa package at The Setai with private pool access.',
      partner_description: 'The Setai Spa is an oasis of tranquility in Miami Beach, combining Asian traditions with modern techniques. Their treatment suites offer ocean and city views, while their team of international therapists brings expertise from some of the world\'s finest spa destinations.',
      benefits: [
        'Customized full-day spa treatment package',
        'Private spa suite access',
        'Exclusive use of adults-only tranquility pool',
        'Champagne lunch service',
        'Take-home luxury spa products',
        'Complimentary valet parking'
      ],
      image_url: 'https://images.pexels.com/photos/3757942/pexels-photo-3757942.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      category: 'lifestyle',
      city: 'Miami',
      tags: ['wellness', 'spa', 'luxury'],
      featured: false
    },
    {
      id: 'lifestyle-4',
      title: 'Savile Row Custom Suit Experience',
      short_description: 'Bespoke suit crafting experience with a master tailor on Savile Row.',
      partner_description: 'Our Savile Row partner represents over 200 years of British tailoring tradition. Their master tailors have dressed royalty, heads of state, and international celebrities, maintaining the highest standards of bespoke tailoring while incorporating modern style preferences.',
      benefits: [
        'Personal consultation with master tailor',
        'Access to exclusive fabric collections',
        'Three fitting appointments',
        'Complimentary bespoke shirt with suit purchase',
        'Lifetime basic alterations',
        'Priority booking for future orders'
      ],
      image_url: 'https://images.pexels.com/photos/1342609/pexels-photo-1342609.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      category: 'lifestyle',
      city: 'London',
      tags: ['fashion', 'bespoke', 'luxury'],
      featured: false,
      minimum_level: 'Founding Member'
    }
  ]
};

// Combine all perks into one array for the perks page
export const mockAllPerks: Perk[] = [
  ...mockFeaturedPerks,
  ...mockCategoryPerks.dining,
  ...mockCategoryPerks.hotels,
  ...mockCategoryPerks.experiences,
  ...mockCategoryPerks.lifestyle
];