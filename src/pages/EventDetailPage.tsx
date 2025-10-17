import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, Clock, ExternalLink, Calendar as CalendarIcon, Share2 } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { Button } from '../components/ui/Button';
import { mockEvents } from '../mocks/eventsData';
import type { Event } from '../types';

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rsvpStatus, setRsvpStatus] = useState<'none' | 'pending' | 'confirmed'>('none');
  
  useEffect(() => {
    // Simulate API loading
    const loadEvent = () => {
      setIsLoading(true);
      setTimeout(() => {
        const foundEvent = mockEvents.find(e => e.id === id);
        setEvent(foundEvent || null);
        setIsLoading(false);
      }, 800);
    };

    loadEvent();
  }, [id]);

  const handleRSVP = () => {
    setRsvpStatus('pending');
    // Simulate API call delay
    setTimeout(() => {
      setRsvpStatus('confirmed');
    }, 1000);
  };

  const handleAddToCalendar = () => {
    if (!event) return;
    
    const startDate = new Date(event.date + ' ' + event.time);
    
    // End time is 2 hours after start for this demo
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    
    const googleCalendarUrl = new URL('https://calendar.google.com/calendar/render');
    googleCalendarUrl.searchParams.append('action', 'TEMPLATE');
    googleCalendarUrl.searchParams.append('text', event.title);
    googleCalendarUrl.searchParams.append('details', event.description);
    googleCalendarUrl.searchParams.append('location', event.location);
    googleCalendarUrl.searchParams.append('dates', `${formatDate(startDate)}/${formatDate(endDate)}`);
    
    window.open(googleCalendarUrl.toString(), '_blank');
  };
  
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event?.title || 'Pier Event',
        text: event?.short_description || '',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard');
    }
  };

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-900"></div>
        </div>
      </PageLayout>
    );
  }

  if (!event) {
    return (
      <PageLayout>
        <div className="container-custom py-20 text-center">
          <h2 className="text-3xl font-display mb-4">Event Not Found</h2>
          <p className="mb-8">The event you're looking for doesn't exist or has been removed.</p>
          <Link to="/explore">
            <Button>Back to Events</Button>
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
          src={event.image_url} 
          alt={event.title}
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
            <Link to="/explore" className="inline-flex items-center text-white/80 hover:text-white mb-4">
              <ArrowLeft size={20} className="mr-2" />
              Back to Events
            </Link>
            
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {event.featured && (
                <span className="px-3 py-1 rounded-full bg-accent-500 text-white text-sm">
                  Featured
                </span>
              )}
              {event.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="px-3 py-1 rounded-full bg-white/10 text-white/90 text-sm">
                  {tag}
                </span>
              ))}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-display font-medium mb-4">{event.title}</h1>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-white/80">
              <div className="flex items-center">
                <Calendar size={18} className="mr-2" />
                <span>{formatDisplayDate(event.date)}</span>
              </div>
              
              <div className="flex items-center">
                <Clock size={18} className="mr-2" />
                <span>{event.time}</span>
              </div>
              
              <div className="flex items-center">
                <MapPin size={18} className="mr-2" />
                <span>{event.location}, {event.city}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Content */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="prose max-w-none mb-8">
              <h2 className="text-2xl font-display font-medium mb-4">Description</h2>
              <p className="text-primary-600">{event.description}</p>
            </div>
            
            {event.rsvp_instructions && (
              <div className="bg-primary-50 rounded-lg p-6 mb-8">
                <h3 className="text-xl font-medium mb-4">RSVP Instructions</h3>
                <p className="text-primary-700">{event.rsvp_instructions}</p>
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-card p-6 mb-6">
              <h3 className="text-xl font-medium mb-4">Actions</h3>
              
              {rsvpStatus === 'none' && (
                <Button
                  className="w-full mb-4"
                  onClick={handleRSVP}
                >
                  RSVP Now
                </Button>
              )}
              
              {rsvpStatus === 'pending' && (
                <Button
                  className="w-full mb-4"
                  isLoading={true}
                >
                  Processing...
                </Button>
              )}
              
              {rsvpStatus === 'confirmed' && (
                <div className="bg-green-50 text-green-700 rounded-lg p-4 mb-4">
                  <p className="font-medium">Your RSVP has been confirmed!</p>
                  <p className="text-sm mt-1">Check your email for details.</p>
                </div>
              )}
              
              <Button
                variant="outline"
                className="w-full mb-4"
                onClick={handleAddToCalendar}
              >
                <CalendarIcon size={16} className="mr-2" />
                Add to Calendar
              </Button>
              
              {event.external_link && (
                <Button
                  variant="outline"
                  className="w-full mb-4"
                  onClick={() => window.open(event.external_link, '_blank', 'noopener,noreferrer')}
                >
                  <ExternalLink size={16} className="mr-2" />
                  Event Website
                </Button>
              )}
              
              <Button
                variant="outline"
                className="w-full"
                onClick={handleShare}
              >
                <Share2 size={16} className="mr-2" />
                Share Event
              </Button>
            </div>
            
            <div className="bg-primary-50 rounded-lg p-6">
              <h3 className="text-xl font-medium mb-4">Need Help?</h3>
              <p className="text-primary-700 mb-4">
                Contact your Pier concierge for personalized assistance with this event.
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

export default EventDetailPage;