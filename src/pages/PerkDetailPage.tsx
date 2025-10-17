import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, ExternalLink, Copy, Share2 } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { Button } from '../components/ui/Button';
import { getPerkById } from '../lib/api/perks';
import { useAuth } from '../context/AuthContext';
import type { Perk } from '../types';

const PerkDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [perk, setPerk] = useState<Perk | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedInstructions, setCopiedInstructions] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    const loadPerk = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const perkData = await getPerkById(id);
        setPerk(perkData);
      } catch (err) {
        console.error('Error loading perk:', err);
        setError('Failed to load perk details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPerk();
  }, [id]);

  const handleCopyInstructions = () => {
    if (perk?.redemption_instructions) {
      navigator.clipboard.writeText(perk.redemption_instructions);
      setCopiedInstructions(true);
      setTimeout(() => setCopiedInstructions(false), 2000);
    }
  };

  const handleExternalLink = () => {
    if (perk?.external_link) {
      window.open(perk.external_link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: perk?.title || 'Pier Perk',
        text: perk?.short_description || '',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard');
    }
  };

  const membershipLevels = ['Standard', 'Premium', 'Executive', 'Founding Member'];
  const hasAccess = !perk?.minimum_level || 
    membershipLevels.indexOf(user?.membership_level || 'Standard') >= 
    membershipLevels.indexOf(perk.minimum_level);

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-900"></div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="container-custom py-20 text-center">
          <h2 className="text-3xl font-display mb-4">Error Loading Perk</h2>
          <p className="text-red-600 mb-8">{error}</p>
          <div className="flex justify-center gap-4">
            <Link to="/perks">
              <Button variant="outline">Back to Perks</Button>
            </Link>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!perk) {
    return (
      <PageLayout>
        <div className="container-custom py-20 text-center">
          <h2 className="text-3xl font-display mb-4">Perk Not Found</h2>
          <p className="mb-8">The perk you're looking for doesn't exist or has been removed.</p>
          <Link to="/perks">
            <Button>Back to Perks</Button>
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Hero Section */}
      <div className="relative h-[60vh] bg-primary-950">
        <img 
          src={perk.image_url} 
          alt={perk.title}
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-950 to-transparent opacity-80"></div>
        
        <motion.div 
          className="absolute bottom-0 left-0 w-full p-8 md:p-16 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="container-custom">
            <Link to="/perks" className="inline-flex items-center text-white/80 hover:text-white mb-4">
              <ArrowLeft size={20} className="mr-2" />
              Back to Perks
            </Link>
            
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-white/20 text-white text-sm capitalize">
                {perk.category}
              </span>
              {perk.minimum_level && (
                <span className="px-3 py-1 rounded-full bg-accent-500 text-white text-sm">
                  {perk.minimum_level}+
                </span>
              )}
              {perk.tags?.map((tag, index) => (
                <span key={index} className="px-3 py-1 rounded-full bg-white/10 text-white/90 text-sm">
                  {tag}
                </span>
              ))}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-display font-medium mb-4">{perk.title}</h1>
            
            <div className="flex items-center text-white/80 mb-2">
              <MapPin size={18} className="mr-2" />
              <span>{perk.city}</span>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Content */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {!hasAccess && (
              <div className="bg-accent-50 border border-accent-200 rounded-lg p-6 mb-8">
                <h3 className="text-xl font-medium text-accent-900 mb-2">
                  Upgrade Required
                </h3>
                <p className="text-accent-700 mb-4">
                  This perk is available to {perk.minimum_level} members and above. 
                  Upgrade your membership to access this exclusive benefit.
                </p>
                <Link to="/membership">
                  <Button
                    className="bg-accent-500 hover:bg-accent-600 text-white"
                  >
                    Upgrade Membership
                  </Button>
                </Link>
              </div>
            )}

            <div className="prose max-w-none mb-8">
              <h2 className="text-2xl font-display font-medium mb-4">About the Partner</h2>
              <p className="text-primary-600 mb-8">{perk.partner_description}</p>

              <h2 className="text-2xl font-display font-medium mb-4">Member Benefits</h2>
              <p className="text-primary-600 font-medium mb-4">As a Pier member, you'll receive:</p>
              {perk.benefits && perk.benefits.length > 0 && (
                <ul className="space-y-2 text-primary-600">
                  {perk.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-block w-2 h-2 mt-2 mr-2 bg-accent-500 rounded-full"></span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            {perk.redemption_instructions && hasAccess && (
              <div className="bg-primary-50 rounded-lg p-6 mb-8">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-medium">Redemption Instructions</h3>
                  <button 
                    onClick={handleCopyInstructions} 
                    className="flex items-center text-primary-600 hover:text-primary-900"
                  >
                    <Copy size={16} className="mr-1" />
                    <span>{copiedInstructions ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-primary-700">{perk.redemption_instructions}</p>
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-card p-6 mb-6">
              <h3 className="text-xl font-medium mb-4">Actions</h3>
              
              {hasAccess && perk.external_link && (
                <Button
                  className="w-full mb-4"
                  onClick={handleExternalLink}
                >
                  <ExternalLink size={16} className="mr-2" />
                  Visit Website
                </Button>
              )}
              
              <Button
                variant="outline"
                className="w-full"
                onClick={handleShare}
              >
                <Share2 size={16} className="mr-2" />
                Share Perk
              </Button>
            </div>
            
            <div className="bg-primary-50 rounded-lg p-6">
              <h3 className="text-xl font-medium mb-4">Need Help?</h3>
              <p className="text-primary-700 mb-4">
                Contact your Pier concierge for personalized assistance with bookings or special requests.
              </p>
              <div className="space-y-2 text-primary-800">
                <p>
                  <a href="mailto:concierge@joinpier.com" className="hover:underline">
                    concierge@joinpier.com
                  </a>
                </p>
                <p>
                  <a href="https://wa.me/19179354877" target="_blank" rel="noopener noreferrer" className="hover:underline">
                    +1 (917) 935-4877
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default PerkDetailPage;