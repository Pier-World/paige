import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';
import { MessageCircle, Plane, UtensilsCrossed, Building2, Ticket } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { mockFeaturedPerks } from '../mocks/perksData';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const TypingText: React.FC<{ text: string; delay?: number; onComplete?: () => void; className?: string }> = ({
  text,
  delay = 0,
  onComplete,
  className = ''
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex === 0) {
      const startTimeout = setTimeout(() => {
        setCurrentIndex(1);
      }, delay);
      return () => clearTimeout(startTimeout);
    }

    if (currentIndex > 0 && currentIndex <= text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex));
        setCurrentIndex(currentIndex + 1);
      }, 30);
      return () => clearTimeout(timeout);
    }

    if (currentIndex > text.length && onComplete) {
      onComplete();
    }
  }, [currentIndex, text, delay, onComplete]);

  return <span className={className}>{displayedText}</span>;
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('Good evening');
  const [featuredPerks, setFeaturedPerks] = useState<any[]>(mockFeaturedPerks);
  const [greetingComplete, setGreetingComplete] = useState(false);
  const [questionComplete, setQuestionComplete] = useState(false);
  const sectionsControls = useAnimation();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    fetchFeaturedPerks();
  }, []);

  useEffect(() => {
    if (questionComplete) {
      sectionsControls.start('visible');
    }
  }, [questionComplete, sectionsControls]);

  const fetchFeaturedPerks = async () => {
    try {
      const { data, error } = await supabase
        .from('perks')
        .select('*')
        .eq('featured', true)
        .limit(8);

      if (error) {
        console.error('Error fetching perks:', error);
        setFeaturedPerks(mockFeaturedPerks);
        return;
      }

      if (data && data.length > 0) {
        setFeaturedPerks(data);
      } else {
        setFeaturedPerks(mockFeaturedPerks);
      }
    } catch (error) {
      console.error('Failed to fetch perks:', error);
      setFeaturedPerks(mockFeaturedPerks);
    }
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/19179354877', '_blank');
  };

  const favoriteCategories = [
    { icon: Plane, label: 'Book Travel', path: '/travel' },
    { icon: UtensilsCrossed, label: 'Dining & Nightlife', path: '/perks?category=dining' },
    { icon: Building2, label: 'Clubs & Lounges', path: '/perks?category=lifestyle' },
    { icon: Ticket, label: 'Clubs & Lounges Access', path: '/explore' },
  ];

  const greetingText = `${greeting}, ${user?.first_name || 'Guest'}.`;
  const questionText = 'What can we take care of today?';

  const sectionVariants = {
    hidden: { opacity: 0, y: 60 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  return (
    <PageLayout>
      {/* Hero Section */}
      <div className="min-h-[70vh] flex items-center justify-center bg-gradient-to-b from-neutral-50 to-white">
        <div className="container-custom py-24 text-center">
          <div>
            <h1 className="font-serif text-5xl md:text-7xl font-light mb-6 text-neutral-900">
              <TypingText
                text={greetingText}
                delay={300}
                onComplete={() => setGreetingComplete(true)}
              />
            </h1>

            <p className="text-2xl md:text-3xl font-serif font-light text-neutral-800 mb-12">
              {greetingComplete && (
                <TypingText
                  text={questionText}
                  delay={200}
                  onComplete={() => setQuestionComplete(true)}
                />
              )}
            </p>

            <motion.div
              className="flex flex-col items-center space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <button
                onClick={handleWhatsApp}
                className="px-8 py-4 bg-black text-white rounded-lg flex items-center space-x-3 hover:bg-neutral-800 transition-all text-lg font-medium"
              >
                <MessageCircle size={20} />
                <span>Message Concierge</span>
              </button>

              <p className="text-sm text-neutral-600">
                Or email us at <a href="mailto:concierge@joinpier.com" className="underline">concierge@joinpier.com</a>
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Your Favorites */}
      <motion.section
        className="py-16 bg-white border-t border-neutral-200"
        initial="hidden"
        animate={sectionsControls}
        variants={sectionVariants}
      >
        <div className="container-custom">
          <h2 className="text-2xl font-semibold mb-8 text-neutral-900">Your Favorites</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {favoriteCategories.map((category, index) => (
              <button
                key={index}
                onClick={() => navigate(category.path)}
                className="p-6 border border-neutral-200 rounded-lg hover:border-neutral-400 hover:shadow-md transition-all text-left group"
              >
                <category.icon size={24} className="mb-3 text-neutral-900 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium text-neutral-900">{category.label}</p>
              </button>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Featured Deals */}
      <motion.section
        className="py-16 bg-neutral-50"
        initial="hidden"
        animate={sectionsControls}
        variants={sectionVariants}
      >
        <div className="container-custom">
          <h2 className="text-2xl font-semibold mb-8 text-neutral-900">Featured Deals</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredPerks.slice(0, 4).map((perk, index) => (
              <div key={perk.id}>
                <Card
                  image={perk.image_url}
                  title={perk.title}
                  description={perk.short_description}
                  tags={perk.tags}
                  link={`/perks/${perk.id}`}
                />
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Upcoming Experiences */}
      <motion.section
        className="py-16 bg-white border-t border-neutral-200"
        initial="hidden"
        animate={sectionsControls}
        variants={sectionVariants}
      >
        <div className="container-custom">
          <h2 className="text-2xl font-semibold mb-8 text-neutral-900">Upcoming Experiences</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredPerks.slice(4, 7).map((perk, index) => (
              <div
                key={perk.id}
                className="relative h-64 rounded-lg overflow-hidden group cursor-pointer"
                onClick={() => navigate(`/perks/${perk.id}`)}
              >
                <img
                  src={perk.image_url}
                  alt={perk.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-white text-lg font-semibold">{perk.title}</h3>
                  <p className="text-white/80 text-sm mt-1">{perk.short_description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>
    </PageLayout>
  );
};

export default HomePage;