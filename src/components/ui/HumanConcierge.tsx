import React, { useState } from 'react';
import { MessageCircle, Mail, MessageSquare, Phone, X, ArrowRight, Clock, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HumanConciergeProps {
  membershipLevel: string;
}

interface ContactChannel {
  id: string;
  name: string;
  icon: any;
  description: string;
  responseTime: string;
  action: () => void;
  available: boolean;
}

const WHATSAPP_PHONE = '19179354877';
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_PHONE}`;
const WHATSAPP_API_LINK = `https://api.whatsapp.com/send/?phone=${WHATSAPP_PHONE}&text&type=phone_number&app_absent=0`;
const CONCIERGE_EMAIL = 'concierge@joinpier.com';

// Check if user has access to human concierge
const hasConciergeAccess = (level: string): boolean => {
  return ['Premium', 'Executive', 'Founding Member'].includes(level);
};

export function HumanConcierge({ membershipLevel }: HumanConciergeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isPremium = hasConciergeAccess(membershipLevel);

  const channels: ContactChannel[] = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: MessageCircle,
      description: 'Start a conversation on WhatsApp',
      responseTime: 'Typically responds in 5 min',
      action: () => {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const link = isMobile ? WHATSAPP_LINK : WHATSAPP_API_LINK;
        window.open(link, '_blank', 'noopener,noreferrer');
      },
      available: true,
    },
    {
      id: 'email',
      name: 'Email',
      icon: Mail,
      description: 'Send us an email',
      responseTime: 'Typically responds in 2 hours',
      action: () => {
        window.location.href = `mailto:${CONCIERGE_EMAIL}?subject=Concierge%20Request`;
      },
      available: true,
    },
    {
      id: 'chat',
      name: 'Live Chat',
      icon: MessageSquare,
      description: 'Chat with our team in real-time',
      responseTime: 'Typically responds in 3 min',
      action: () => {
        // TODO: Replace with actual chat integration (Front, Intercom, etc.)
        // For now, open WhatsApp as fallback
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const link = isMobile ? WHATSAPP_LINK : WHATSAPP_API_LINK;
        window.open(link, '_blank', 'noopener,noreferrer');
      },
      available: true,
    },
    {
      id: 'phone',
      name: 'Phone Call',
      icon: Phone,
      description: 'Schedule a call with your concierge',
      responseTime: 'Available 9 AM - 9 PM EST',
      action: () => {
        // TODO: Replace with actual scheduling link (Calendly, etc.)
        // For now, open email as fallback
        window.location.href = `mailto:${CONCIERGE_EMAIL}?subject=Schedule%20Concierge%20Call`;
      },
      available: true,
    },
  ];

  if (!isPremium) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 p-4 rounded-full bg-accent hover:bg-[#d4c4a6] shadow-xl hover:shadow-2xl transition-all group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open Human Concierge"
      >
        <MessageCircle size={24} className="text-background" />
        
        {/* Status indicator */}
        <div className="absolute top-0 right-0 w-3 h-3 bg-[#4ade80] border-2 border-background rounded-full" />
        
        {/* Tooltip - Hidden on mobile, shown on desktop */}
        <div className="hidden sm:block absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-2 rounded-lg bg-surface border border-border whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <span className="text-text-primary" style={{ fontSize: '13px', fontWeight: 300 }}>
            Human Concierge
          </span>
        </div>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal Content */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-background border border-border shadow-2xl"
              >
                {/* Header */}
                <div className="relative p-6 sm:p-8 pb-4 sm:pb-6 border-b border-border-subtle">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-lg hover:bg-surface-elevated transition-colors"
                    aria-label="Close"
                  >
                    <X size={20} className="text-text-secondary" />
                  </button>
                  
                  <div className="flex items-center gap-3 mb-3 pr-8">
                    <div className="p-2.5 rounded-lg bg-accent/10 border border-accent/20">
                      <MessageCircle size={20} className="text-accent" />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '24px', fontWeight: 300, letterSpacing: '-0.01em' }} className="text-text-primary">
                        Human Concierge
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse" />
                        <span className="text-text-secondary" style={{ fontSize: '13px', fontWeight: 300 }}>
                          Available now
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-text-secondary pr-8" style={{ fontSize: '15px', fontWeight: 300, lineHeight: '1.6' }}>
                    Connect with our dedicated team for personalized assistance with complex requests, negotiations, and white-glove service.
                  </p>
                </div>

                {/* Contact Channels */}
                <div className="p-4 sm:p-6">
                  <div className="space-y-3">
                    {channels.map((channel, index) => {
                      const Icon = channel.icon;
                      return (
                        <motion.button
                          key={channel.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => {
                            channel.action();
                            // Optionally close modal after action
                            // setIsOpen(false);
                          }}
                          disabled={!channel.available}
                          className="w-full group"
                        >
                          <div className="flex items-center gap-4 p-4 sm:p-5 rounded-xl bg-surface border border-border hover:border-accent/40 hover:bg-surface-elevated transition-all">
                            <div className="p-3 rounded-lg bg-surface-elevated group-hover:bg-accent/10 transition-colors flex-shrink-0">
                              <Icon size={20} className="text-accent" />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 style={{ fontSize: '16px', fontWeight: 400 }} className="text-text-primary">
                                  {channel.name}
                                </h3>
                                {channel.available && (
                                  <CheckCircle size={14} className="text-[#4ade80] flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-text-secondary mb-1" style={{ fontSize: '13px', fontWeight: 300 }}>
                                {channel.description}
                              </p>
                              <div className="flex items-center gap-1.5 text-text-tertiary" style={{ fontSize: '12px', fontWeight: 300 }}>
                                <Clock size={12} className="flex-shrink-0" />
                                <span className="truncate">{channel.responseTime}</span>
                              </div>
                            </div>
                            <ArrowRight size={18} className="text-text-tertiary group-hover:text-accent transition-colors flex-shrink-0" />
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Additional Info */}
                  <div className="mt-6 p-4 rounded-xl bg-surface border border-border">
                    <p className="text-text-secondary text-center" style={{ fontSize: '13px', fontWeight: 300, lineHeight: '1.6' }}>
                      Our human concierge team is available 24/7 for urgent requests. For non-urgent matters, we typically respond within a few hours during business hours.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

