import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';

interface MemberCardProps {
  firstName: string;
  lastName: string;
  memberId: string;
  membershipLevel: string;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  firstName,
  lastName,
  memberId,
  membershipLevel,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleAddToWallet = () => {
    alert('This feature will generate a .pkpass file for Apple Wallet in the full implementation.');
  };

  const cardVariants = {
    normal: {
      scale: 1,
      y: 0,
      zIndex: 1,
    },
    expanded: {
      scale: 1.5,
      y: 0,
      zIndex: 10,
    },
  };

  return (
    <div className="relative w-full flex flex-col items-center py-8">
      <motion.div
        className={`cursor-pointer rounded-xl overflow-hidden w-full max-w-[380px] aspect-[1.586/1] bg-gradient-to-br from-primary-950 to-primary-800 text-white shadow-lg ${
          isExpanded ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : 'relative'
        }`}
        variants={cardVariants}
        animate={isExpanded ? 'expanded' : 'normal'}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        onClick={toggleExpanded}
      >
        {/* Card Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <svg width="100%" height="100%" viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="0.5" opacity="0.2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        {/* Card Content */}
        <div className="relative z-10 p-6 flex flex-col justify-between h-full">
          <div className="flex justify-between items-start">
            <div className="text-[11px] tracking-[0.3em] uppercase text-foreground font-medium">Pier</div>
            <div className="text-xs opacity-80">{membershipLevel}</div>
          </div>
          
          <div className="grow"></div>
          
          <div>
            <div className="font-display text-lg mb-1">{firstName} {lastName}</div>
            <div className="text-xs opacity-80 font-mono">ID: {memberId}</div>
          </div>
        </div>
      </motion.div>

      {/* Wallet Button */}
      <Button
        className="mt-8 bg-black text-white flex items-center gap-2"
        onClick={handleAddToWallet}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 10V8H4V10H20ZM20 16V14H4V16H20ZM22 5C22 4.45 21.8043 3.97933 21.413 3.588C21.0217 3.19667 20.55 3 20 3H4C3.45 3 2.97933 3.19667 2.588 3.588C2.19667 3.97933 2 4.45 2 5V19C2 19.55 2.19667 20.0207 2.588 20.412C2.97933 20.8033 3.45 21 4 21H20C20.55 21 21.0207 20.8033 21.412 20.412C21.8033 20.0207 22 19.55 22 19V5Z" fill="currentColor"/>
        </svg>
        Add to Apple Wallet
      </Button>

      {isExpanded && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 z-[5]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={toggleExpanded}
        ></motion.div>
      )}
    </div>
  );
};