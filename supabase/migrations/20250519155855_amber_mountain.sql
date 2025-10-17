/*
  # Create perks table and add mock data

  1. New Tables
    - `perks`
      - `id` (uuid, primary key)
      - `title` (text)
      - `short_description` (text)
      - `partner_description` (text)
      - `benefits` (text[])
      - `image_url` (text)
      - `category` (text)
      - `city` (text)
      - `tags` (text[])
      - `featured` (boolean)
      - `minimum_level` (text, with check constraint)
      - `redemption_instructions` (text, nullable)
      - `external_link` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `perks` table
    - Add policy for authenticated users to read perks
*/

-- Create perks table
CREATE TABLE perks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  short_description text NOT NULL,
  partner_description text NOT NULL,
  benefits text[] NOT NULL,
  image_url text NOT NULL,
  category text NOT NULL,
  city text NOT NULL,
  tags text[] NOT NULL,
  featured boolean NOT NULL DEFAULT false,
  minimum_level text CHECK (minimum_level IN ('Standard', 'Premium', 'Executive', 'Founding Member')),
  redemption_instructions text,
  external_link text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE perks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can read perks"
  ON perks
  FOR SELECT
  TO authenticated
  USING (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_perks_updated_at
  BEFORE UPDATE ON perks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert mock data
INSERT INTO perks (
  title,
  short_description,
  partner_description,
  benefits,
  image_url,
  category,
  city,
  tags,
  featured,
  minimum_level,
  redemption_instructions
) VALUES
  (
    'Priority Reservations at Le Bernardin',
    'Guaranteed reservations at Michelin-starred Le Bernardin with 24-hour notice.',
    'Le Bernardin, led by chef Eric Ripert, is one of the world''s most acclaimed fine dining establishments. With three Michelin stars maintained consistently since 2005, the restaurant offers sophisticated French cuisine with an emphasis on seafood. Located in Midtown Manhattan, Le Bernardin sets the standard for fine dining in New York City with its elegant atmosphere and impeccable service.',
    ARRAY[
      'Guaranteed reservations with just 24-hour notice, bypassing the typical 60-day waiting list',
      'Complimentary glass of champagne for your party upon arrival',
      'Priority seating in the main dining room',
      'Special off-menu chef''s selections when available',
      'Dedicated concierge contact for special requests and dietary accommodations'
    ],
    'https://images.pexels.com/photos/4253320/pexels-photo-4253320.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    'dining',
    'New York',
    ARRAY['michelin', 'exclusive', 'fine dining'],
    true,
    'Premium',
    'Contact your Pier concierge at least 24 hours before your desired reservation time. Provide your name, desired date, time, and number of guests. Your confirmation will be sent via email within 2 hours.'
  ),
  (
    'Suite Upgrade at Four Seasons',
    'Complimentary suite upgrade at Four Seasons properties worldwide.',
    'Four Seasons Hotels and Resorts represents the pinnacle of luxury hospitality, with over 100 properties worldwide. Known for their exceptional service, stunning locations, and unwavering commitment to guest satisfaction, Four Seasons consistently ranks among the world''s finest hotel brands. Each property seamlessly blends local character with the brand''s signature sophistication.',
    ARRAY[
      'Guaranteed suite upgrade upon availability at check-in',
      'Early check-in and late check-out privileges',
      'Welcome amenity customized to your preferences',
      'Daily breakfast for two at the hotel restaurant',
      'Access to exclusive Four Seasons Preferred Partner benefits'
    ],
    'https://images.pexels.com/photos/2507010/pexels-photo-2507010.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    'hotels',
    'London',
    ARRAY['luxury', 'upgrade', 'global'],
    true,
    'Executive',
    'Book through your Pier concierge, mentioning your suite upgrade benefit. Present your digital Pier membership card upon check-in. Upgrades are subject to availability at time of check-in.'
  ),
  (
    'Private Yacht Day in Miami',
    'Exclusive access to luxury yacht charters with preferred pricing.',
    'Our premier yacht charter partner in Miami offers a fleet of meticulously maintained luxury vessels ranging from 40 to 120 feet. With decades of experience in luxury maritime services, they provide exceptional experiences on the crystal-clear waters of Miami and the Florida Keys. Their professional crew members are highly trained and certified to ensure both safety and service excellence.',
    ARRAY[
      'Preferred member pricing (15-25% below market rates)',
      'Priority booking during peak seasons',
      'Complimentary champagne and gourmet provisions',
      'Dedicated yacht concierge for custom itinerary planning',
      'Access to exclusive marina clubs and waterfront restaurants'
    ],
    'https://images.pexels.com/photos/163236/luxury-yacht-boat-speed-water-163236.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    'experiences',
    'Miami',
    ARRAY['luxury', 'exclusive', 'water'],
    true,
    'Executive',
    'Book through your Pier concierge with at least 72 hours notice. Specify your preferred date, time, duration, and number of guests. A 50% deposit is required to confirm your reservation.'
  ),
  (
    'VIP Access to Paris Fashion Week',
    'Front row seats and exclusive after-parties during Paris Fashion Week.',
    'Paris Fashion Week is the pinnacle of the global fashion calendar, showcasing the world''s most prestigious fashion houses and emerging designers. Our exclusive partnership with the Fédération de la Haute Couture et de la Mode provides unprecedented access to this coveted event, allowing members to experience the height of fashion and luxury in the fashion capital of the world.',
    ARRAY[
      'Front row seating at select runway shows',
      'Access to exclusive designer previews and showrooms',
      'Invitations to official after-parties and VIP events',
      'Personal styling consultation with featured designers',
      'Priority access to pre-order collections'
    ],
    'https://images.pexels.com/photos/1884581/pexels-photo-1884581.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    'lifestyle',
    'Paris',
    ARRAY['fashion', 'exclusive', 'vip'],
    true,
    'Founding Member',
    'Contact your Pier concierge at least 60 days before Paris Fashion Week to request your preferred shows. Availability is limited and allocated on a first-come, first-served basis.'
  );