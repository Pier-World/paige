import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { ChevronRight } from 'lucide-react';

interface HeroProps {
  title: string;
  userName?: string;
  description: string;
  image: string;
  primaryAction?: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
}

export const Hero: React.FC<HeroProps> = ({
  title,
  userName,
  description,
  image,
  primaryAction,
  secondaryAction,
}) => {
  return (
    <div className="relative min-h-[70vh] flex items-center bg-primary-950">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-950 to-transparent opacity-80"></div>
      </div>
      
      {/* Content */}
      <div className="container-custom relative z-10 py-16">
        <motion.div 
          className="max-w-xl text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h1 
            className="font-display text-5xl md:text-6xl font-medium mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {userName ? `Welcome, ${userName}` : title}
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-xl text-primary-100 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {description}
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {primaryAction && (
              <Button
                onClick={() => window.location.href = primaryAction.href}
                className="px-6 py-3 bg-white text-primary-950 hover:bg-primary-100 flex items-center"
              >
                {primaryAction.label}
                <ChevronRight size={16} className="ml-2" />
              </Button>
            )}
            
            {secondaryAction && (
              <Button
                variant="ghost"
                onClick={() => window.location.href = secondaryAction.href}
                className="px-6 py-3 border border-white text-white hover:bg-white/10"
              >
                {secondaryAction.label}
              </Button>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};