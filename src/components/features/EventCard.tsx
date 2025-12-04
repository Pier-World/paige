import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Event } from '../../types';

interface EventCardProps {
  event: Event;
  className?: string;
  onClick?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  className = '',
  onClick,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <motion.div
      className={`card overflow-hidden h-full ${onClick ? 'cursor-pointer' : ''} ${className}`}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      onClick={(e) => {
        // Only trigger onClick if not clicking on a button or link
        if (onClick && !(e.target as HTMLElement).closest('a, button')) {
          onClick();
        }
      }}
    >
      <div className="relative">
        <img 
          src={event.image_url} 
          alt={event.title} 
          className="h-56 w-full object-cover transition-all duration-500 hover:scale-105"
        />
        {event.featured && (
          <div className="absolute top-4 left-4 bg-accent-500 text-white px-3 py-1 rounded-full text-xs font-medium">
            Featured
          </div>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-xl font-medium mb-2">{event.title}</h3>
        
        <div className="flex items-center text-primary-600 mb-1">
          <Calendar size={16} className="mr-2" />
          <span className="text-sm">{formatDate(event.date)} • {event.time}</span>
        </div>
        
        <div className="flex items-center text-primary-600 mb-4">
          <MapPin size={16} className="mr-2" />
          <span className="text-sm">{event.location}, {event.city}</span>
        </div>
        
        <p className="text-sm text-primary-600 mb-4 line-clamp-2">{event.short_description}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {event.tags.slice(0, 2).map((tag, index) => (
              <span 
                key={index} 
                className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (onClick) {
                onClick();
              }
            }}
          >
            View Details
          </Button>
        </div>
      </div>
    </motion.div>
  );
};