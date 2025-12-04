import { X, ExternalLink, TrendingUp, Check, Info, Settings, ArrowRight, Calendar, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageWithFallback } from './ImageWithFallback';

export interface MembershipDetailData {
  id: string;
  title: string;
  provider: string;
  tier: string;
  category: string;
  description: string;
  about: string;
  imageUrl: string;
  logoColor: string;
  benefits: {
    category: string;
    items: string[];
  }[];
  value: {
    annual: string;
    thisYear: string;
    breakdown: {
      label: string;
      value: string;
    }[];
  };
  usage: {
    label: string;
    current: number;
    total: number;
    unit: string;
  }[];
  status: {
    active: boolean;
    renewalDate: string;
    memberSince: string;
  };
  tips: string[];
  resources: {
    label: string;
    url: string;
  }[];
}

interface MembershipDetailProps {
  membership: MembershipDetailData | null;
  isOpen: boolean;
  onClose: () => void;
  onManage?: () => void;
}

export function MembershipDetail({ membership, isOpen, onClose, onManage }: MembershipDetailProps) {
  if (!membership) return null;

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
                className="w-full max-w-5xl rounded-2xl bg-background border border-border shadow-2xl overflow-hidden my-8"
              >
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-surface-elevated transition-colors"
                >
                  <X size={20} className="text-text-primary" />
                </button>

                {/* Hero Section */}
                <div className="relative h-64 overflow-hidden bg-gradient-to-br from-surface-elevated to-background">
                  <ImageWithFallback
                    src={membership.imageUrl}
                    alt={membership.title}
                    className="w-full h-full object-cover opacity-30"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                  
                  <div className="absolute bottom-8 left-8 right-8">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div 
                            className="w-12 h-12 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: membership.logoColor }}
                          >
                            <span className="text-white" style={{ fontSize: '20px', fontWeight: 600 }}>
                              {membership.provider.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-text-tertiary" style={{ fontSize: '12px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {membership.category}
                            </p>
                            <h1 style={{ fontSize: '28px', fontWeight: 300, letterSpacing: '-0.02em' }} className="text-text-primary">
                              {membership.title}
                            </h1>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
                            <span className="text-accent" style={{ fontSize: '13px', fontWeight: 400 }}>
                              {membership.tier}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-text-secondary" style={{ fontSize: '13px', fontWeight: 300 }}>
                            <div className="w-2 h-2 bg-[#4ade80] rounded-full" />
                            <span>Active</span>
                          </div>
                          <div className="text-text-tertiary" style={{ fontSize: '13px', fontWeight: 300 }}>
                            Member since {membership.status.memberSince}
                          </div>
                        </div>
                      </div>
                      {onManage && (
                        <button
                          onClick={onManage}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-text-primary transition-all"
                          style={{ fontSize: '14px', fontWeight: 400 }}
                        >
                          <Settings size={16} />
                          Manage
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8">
                  {/* Value Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="p-5 rounded-xl bg-surface border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={16} className="text-accent" />
                        <span className="text-text-tertiary" style={{ fontSize: '11px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Annual Value
                        </span>
                      </div>
                      <p style={{ fontSize: '24px', fontWeight: 300 }} className="text-text-primary">
                        {membership.value.annual}
                      </p>
                    </div>
                    <div className="p-5 rounded-xl bg-surface border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar size={16} className="text-accent" />
                        <span className="text-text-tertiary" style={{ fontSize: '11px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          This Year
                        </span>
                      </div>
                      <p style={{ fontSize: '24px', fontWeight: 300 }} className="text-text-primary">
                        {membership.value.thisYear}
                      </p>
                    </div>
                    <div className="p-5 rounded-xl bg-surface border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={16} className="text-accent" />
                        <span className="text-text-tertiary" style={{ fontSize: '11px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Renews
                        </span>
                      </div>
                      <p style={{ fontSize: '24px', fontWeight: 300 }} className="text-text-primary">
                        {membership.status.renewalDate}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                      {/* About */}
                      <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary mb-3">
                          About
                        </h2>
                        <p className="text-text-secondary" style={{ fontSize: '15px', fontWeight: 300, lineHeight: '1.7' }}>
                          {membership.about}
                        </p>
                      </div>

                      {/* Benefits */}
                      <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary mb-4">
                          Your Benefits
                        </h2>
                        <div className="space-y-6">
                          {membership.benefits.map((benefitGroup, index) => (
                            <div key={index}>
                              <h3 className="text-accent mb-3" style={{ fontSize: '14px', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {benefitGroup.category}
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {benefitGroup.items.map((item, idx) => (
                                  <div key={idx} className="flex items-start gap-2">
                                    <Check size={16} className="text-accent mt-0.5 flex-shrink-0" />
                                    <span className="text-text-secondary" style={{ fontSize: '14px', fontWeight: 300 }}>
                                      {item}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Value Breakdown */}
                      <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary mb-4">
                          Value Breakdown
                        </h2>
                        <div className="space-y-3">
                          {membership.value.breakdown.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-surface border border-border">
                              <span className="text-text-secondary" style={{ fontSize: '14px', fontWeight: 300 }}>
                                {item.label}
                              </span>
                              <span className="text-accent" style={{ fontSize: '15px', fontWeight: 400 }}>
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Resources */}
                      {membership.resources.length > 0 && (
                        <div>
                          <h2 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary mb-4">
                            Resources
                          </h2>
                          <div className="space-y-2">
                            {membership.resources.map((resource, index) => (
                              <a
                                key={index}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-4 rounded-lg bg-surface border border-border hover:border-accent/40 transition-all group"
                              >
                                <span className="text-text-primary" style={{ fontSize: '14px', fontWeight: 400 }}>
                                  {resource.label}
                                </span>
                                <ExternalLink size={16} className="text-text-tertiary group-hover:text-accent transition-colors" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column - Usage & Tips */}
                    <div className="lg:col-span-1 space-y-6">
                      {/* Usage Stats */}
                      {membership.usage.length > 0 && (
                        <div className="rounded-xl bg-surface border border-border p-6">
                          <h3 style={{ fontSize: '16px', fontWeight: 400 }} className="text-text-primary mb-4">
                            Usage This Year
                          </h3>
                          <div className="space-y-4">
                            {membership.usage.map((stat, index) => (
                              <div key={index}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-text-secondary" style={{ fontSize: '13px', fontWeight: 300 }}>
                                    {stat.label}
                                  </span>
                                  <span className="text-text-primary" style={{ fontSize: '13px', fontWeight: 400 }}>
                                    {stat.current} / {stat.total} {stat.unit}
                                  </span>
                                </div>
                                <div className="h-2 rounded-full bg-surface-elevated overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-accent to-[#d4c4a6] rounded-full transition-all"
                                    style={{ width: `${Math.min((stat.current / stat.total) * 100, 100)}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Maximization Tips */}
                      {membership.tips.length > 0 && (
                        <div className="rounded-xl bg-surface border border-border p-6">
                          <h3 style={{ fontSize: '16px', fontWeight: 400 }} className="text-text-primary mb-4">
                            Maximize Your Benefits
                          </h3>
                          <div className="space-y-3">
                            {membership.tips.map((tip, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <Info size={14} className="text-accent mt-1 flex-shrink-0" />
                                <span className="text-text-secondary" style={{ fontSize: '13px', fontWeight: 300, lineHeight: '1.6' }}>
                                  {tip}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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

