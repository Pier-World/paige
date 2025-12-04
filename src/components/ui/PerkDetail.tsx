import { X, MapPin, Clock, Check, Calendar, ExternalLink, MessageCircle, Copy, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageWithFallback } from './ImageWithFallback';
import { useState } from 'react';

export interface PerkDetailData {
  id: string;
  title: string;
  provider: string;
  category: string;
  tagline: string;
  description: string;
  about: string;
  location: string;
  locationDetails?: string;
  imageUrl: string;
  additionalImages?: string[];
  memberBenefits: string[];
  value: string;
  redemptionType: 'resy' | 'concierge' | 'code' | 'external' | 'automatic' | 'opentable';
  redemptionInstructions: string;
  redemptionDetails?: string[];
  redemptionUrl?: string;
  promoCode?: string;
  availability?: string;
  terms?: string[];
  featured?: boolean;
}

interface PerkDetailProps {
  perk: PerkDetailData | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenConcierge?: () => void;
}

export function PerkDetail({ perk, isOpen, onClose, onOpenConcierge }: PerkDetailProps) {
  const [copiedCode, setCopiedCode] = useState(false);

  if (!perk) return null;

  const handleCopyCode = () => {
    if (perk.promoCode) {
      navigator.clipboard.writeText(perk.promoCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleRedeem = () => {
    switch (perk.redemptionType) {
      case 'resy':
      case 'opentable':
      case 'external':
        if (perk.redemptionUrl) {
          window.open(perk.redemptionUrl, '_blank');
        }
        break;
      case 'concierge':
        if (onOpenConcierge) {
          onClose();
          onOpenConcierge();
        }
        break;
      case 'code':
        handleCopyCode();
        break;
      case 'automatic':
        // Show confirmation or info
        break;
    }
  };

  const getRedemptionButtonText = () => {
    switch (perk.redemptionType) {
      case 'resy':
        return 'Book on Resy';
      case 'opentable':
        return 'Book on OpenTable';
      case 'external':
        return 'Visit Website';
      case 'concierge':
        return 'Contact Concierge';
      case 'code':
        return copiedCode ? 'Code Copied!' : 'Copy Code';
      case 'automatic':
        return 'Automatically Applied';
      default:
        return 'Redeem Now';
    }
  };

  const getRedemptionButtonIcon = () => {
    switch (perk.redemptionType) {
      case 'resy':
      case 'opentable':
        return Calendar;
      case 'external':
        return ExternalLink;
      case 'concierge':
        return MessageCircle;
      case 'code':
        return Copy;
      case 'automatic':
        return Check;
      default:
        return ExternalLink;
    }
  };

  const ButtonIcon = getRedemptionButtonIcon();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal Content */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="min-h-screen px-4 py-8 flex items-start justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-4xl rounded-2xl bg-background border border-border shadow-2xl overflow-hidden my-8"
              >
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-surface-elevated transition-colors"
                >
                  <X size={20} className="text-text-primary" />
                </button>

                {/* Hero Image */}
                <div className="relative aspect-[21/9] overflow-hidden bg-surface-elevated">
                  <ImageWithFallback
                    src={perk.imageUrl}
                    alt={perk.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                  
                  {/* Category Badge */}
                  <div className="absolute top-6 left-6">
                    <div className="px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-accent/20">
                      <span className="text-accent" style={{ fontSize: '12px', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {perk.category}
                      </span>
                    </div>
                  </div>

                  {/* Value Badge */}
                  <div className="absolute top-6 right-6">
                    <div className="px-3 py-2 rounded-full bg-accent/90 backdrop-blur-sm">
                      <span className="text-background" style={{ fontSize: '13px', fontWeight: 400 }}>
                        {perk.value}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8">
                  {/* Header */}
                  <div className="mb-8">
                    <h1 style={{ fontSize: '32px', fontWeight: 300, letterSpacing: '-0.02em' }} className="text-text-primary mb-2">
                      {perk.title}
                    </h1>
                    <p className="text-text-secondary mb-4" style={{ fontSize: '16px', fontWeight: 300 }}>
                      {perk.provider}
                    </p>
                    <p className="text-accent" style={{ fontSize: '18px', fontWeight: 300, lineHeight: '1.6' }}>
                      {perk.tagline}
                    </p>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-6 mb-8 pb-8 border-b border-border-subtle">
                    <div className="flex items-center gap-2">
                      <MapPin size={18} className="text-accent" />
                      <div>
                        <p className="text-text-primary" style={{ fontSize: '14px', fontWeight: 400 }}>
                          {perk.location}
                        </p>
                        {perk.locationDetails && (
                          <p className="text-text-tertiary" style={{ fontSize: '12px', fontWeight: 300 }}>
                            {perk.locationDetails}
                          </p>
                        )}
                      </div>
                    </div>
                    {perk.availability && (
                      <div className="flex items-center gap-2">
                        <Clock size={18} className="text-accent" />
                        <p className="text-text-primary" style={{ fontSize: '14px', fontWeight: 400 }}>
                          {perk.availability}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                      {/* Description */}
                      <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary mb-3">
                          Details
                        </h2>
                        <p className="text-text-secondary" style={{ fontSize: '15px', fontWeight: 300, lineHeight: '1.7' }}>
                          {perk.description}
                        </p>
                      </div>

                      {/* About */}
                      <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary mb-3">
                          About
                        </h2>
                        <p className="text-text-secondary" style={{ fontSize: '15px', fontWeight: 300, lineHeight: '1.7' }}>
                          {perk.about}
                        </p>
                      </div>

                      {/* Member Benefits */}
                      <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary mb-4">
                          Member Benefits
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {perk.memberBenefits.map((benefit, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <Check size={16} className="text-accent mt-0.5 flex-shrink-0" />
                              <span className="text-text-secondary" style={{ fontSize: '14px', fontWeight: 300 }}>
                                {benefit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Terms & Conditions */}
                      {perk.terms && perk.terms.length > 0 && (
                        <div>
                          <h2 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary mb-3">
                            Terms & Conditions
                          </h2>
                          <div className="space-y-2">
                            {perk.terms.map((term, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <Info size={14} className="text-text-tertiary mt-1 flex-shrink-0" />
                                <span className="text-text-tertiary" style={{ fontSize: '13px', fontWeight: 300, lineHeight: '1.6' }}>
                                  {term}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column - Redemption Card */}
                    <div className="lg:col-span-1">
                      <div className="sticky top-8">
                        <div className="rounded-xl bg-surface border border-border p-6">
                          <h3 style={{ fontSize: '18px', fontWeight: 400 }} className="text-text-primary mb-4">
                            How to Redeem
                          </h3>

                          <p className="text-text-secondary mb-4" style={{ fontSize: '14px', fontWeight: 300, lineHeight: '1.6' }}>
                            {perk.redemptionInstructions}
                          </p>

                          {perk.redemptionDetails && perk.redemptionDetails.length > 0 && (
                            <div className="space-y-2 mb-6">
                              {perk.redemptionDetails.map((detail, index) => (
                                <div key={index} className="flex items-start gap-2">
                                  <div className="w-5 h-5 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-accent" style={{ fontSize: '11px', fontWeight: 400 }}>
                                      {index + 1}
                                    </span>
                                  </div>
                                  <span className="text-text-secondary" style={{ fontSize: '13px', fontWeight: 300 }}>
                                    {detail}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Promo Code Display */}
                          {perk.redemptionType === 'code' && perk.promoCode && (
                            <div className="mb-4 p-4 rounded-lg bg-surface-elevated border border-border">
                              <p className="text-text-tertiary mb-2" style={{ fontSize: '11px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Promo Code
                              </p>
                              <div className="flex items-center justify-between">
                                <code className="text-accent font-mono" style={{ fontSize: '18px', fontWeight: 400 }}>
                                  {perk.promoCode}
                                </code>
                                <button
                                  onClick={handleCopyCode}
                                  className="p-2 rounded-lg hover:bg-border transition-colors"
                                >
                                  <Copy size={16} className="text-text-secondary" />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Redemption Button */}
                          <button
                            onClick={handleRedeem}
                            disabled={perk.redemptionType === 'automatic'}
                            className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg transition-all ${
                              perk.redemptionType === 'automatic'
                                ? 'bg-accent/10 border border-accent/20 text-accent cursor-default'
                                : 'bg-accent hover:bg-[#d4c4a6] text-background'
                            }`}
                            style={{ fontSize: '15px', fontWeight: 400 }}
                          >
                            <ButtonIcon size={18} />
                            {getRedemptionButtonText()}
                          </button>

                          {/* Additional Info */}
                          <div className="mt-4 pt-4 border-t border-border-subtle">
                            <p className="text-text-tertiary text-center" style={{ fontSize: '12px', fontWeight: 300, lineHeight: '1.5' }}>
                              {perk.redemptionType === 'concierge' 
                                ? 'Our concierge team will handle everything for you'
                                : perk.redemptionType === 'automatic'
                                ? 'This benefit is automatically applied to your account'
                                : 'Questions? Contact our concierge team anytime'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

