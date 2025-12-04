import React from 'react';
import { MessageCircle, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

interface PremiumConciergeContactProps {
  membershipLevel: string;
}

const WHATSAPP_PHONE = '19179354877';
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_PHONE}`;
const WHATSAPP_API_LINK = `https://api.whatsapp.com/send/?phone=${WHATSAPP_PHONE}&text&type=phone_number&app_absent=0`;
const CONCIERGE_EMAIL = 'concierge@joinpier.com';

// Check if user has access to human concierge
const hasConciergeAccess = (level: string): boolean => {
  return ['Premium', 'Executive', 'Founding Member'].includes(level);
};

export const PremiumConciergeContact: React.FC<PremiumConciergeContactProps> = ({ 
  membershipLevel 
}) => {
  // Only show for premium members
  if (!hasConciergeAccess(membershipLevel)) {
    return null;
  }

  const handleWhatsAppClick = () => {
    // Try the API link first (works better on desktop/web)
    // Fallback to wa.me for mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const link = isMobile ? WHATSAPP_LINK : WHATSAPP_API_LINK;
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="max-w-4xl mx-auto mt-8 text-center"
    >
      {/* Primary WhatsApp Button - Matches v1 design */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleWhatsAppClick}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-background hover:bg-surface border-2 border-text-primary text-text-primary transition-all"
        style={{ fontSize: '14px', fontWeight: 400 }}
      >
        <MessageCircle size={18} />
        <span>Message Concierge</span>
      </motion.button>

      {/* Email Link - Secondary, subtle */}
      <p className="mt-4 text-text-tertiary" style={{ fontSize: '13px', fontWeight: 300 }}>
        Or email us at{' '}
        <a
          href={`mailto:${CONCIERGE_EMAIL}`}
          className="text-accent hover:text-[#d4c4a6] transition-colors underline"
        >
          {CONCIERGE_EMAIL}
        </a>
      </p>
    </motion.div>
  );
};

