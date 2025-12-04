import { Shield, Sparkles, TrendingUp, Check, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';
import { useState } from 'react';
import { MembershipDetail, MembershipDetailData } from '../components/ui/MembershipDetail';
import { MembershipManagement, MembershipManagementData } from '../components/ui/MembershipManagement';
import { PageLayout } from '../components/layout/PageLayout';
import { memberships, membershipDetails, managementData } from '../data/memberships';

export function MembershipsPage() {
  const [selectedMembership, setSelectedMembership] = useState<MembershipDetailData | null>(null);
  const [manageMembership, setManageMembership] = useState<MembershipManagementData | null>(null);

  const totalValue = memberships.length;
  const activeCount = memberships.filter(m => m.status === 'active').length;

  const handleMembershipClick = (id: string) => {
    const details = membershipDetails[id];
    if (details) {
      setSelectedMembership(details);
    }
  };

  const handleManageClick = (id: string) => {
    const mgmt = managementData[id];
    if (mgmt) {
      setSelectedMembership(null); // Close detail view
      setManageMembership(mgmt);
    }
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-background pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="mb-12">
            <h1 style={{ fontSize: '36px', fontWeight: 300, letterSpacing: '-0.02em' }} className="text-text-primary mb-2">
              Your Memberships
            </h1>
            <p className="text-text-secondary" style={{ fontSize: '16px', fontWeight: 300 }}>
              Aggregated benefits and exclusive access across all your memberships
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-xl bg-surface border border-border"
            >
              <div className="flex items-center gap-3 mb-2">
                <Shield size={18} className="text-accent" />
                <span className="text-text-tertiary" style={{ fontSize: '12px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Active Memberships
                </span>
              </div>
              <p style={{ fontSize: '32px', fontWeight: 300 }} className="text-text-primary">
                {activeCount}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-xl bg-surface border border-border"
            >
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp size={18} className="text-accent" />
                <span className="text-text-tertiary" style={{ fontSize: '12px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Benefits
                </span>
              </div>
              <p style={{ fontSize: '32px', fontWeight: 300 }} className="text-text-primary">
                28
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-xl bg-surface border border-border"
            >
              <div className="flex items-center gap-3 mb-2">
                <Sparkles size={18} className="text-accent" />
                <span className="text-text-tertiary" style={{ fontSize: '12px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Value
                </span>
              </div>
              <p style={{ fontSize: '32px', fontWeight: 300 }} className="text-text-primary">
                $12.4k
              </p>
              <p className="text-text-secondary mt-1" style={{ fontSize: '12px', fontWeight: 300 }}>
                This year
              </p>
            </motion.div>
          </div>

          {/* Memberships Grid */}
          <div className="space-y-6">
            {memberships.map((membership, index) => {
              const Icon = membership.icon;
              return (
                <motion.div
                  key={membership.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group w-full"
                >
                  <div 
                    onClick={() => handleMembershipClick(membership.id)}
                    className="rounded-2xl bg-surface border border-border hover:border-accent/40 overflow-hidden transition-all cursor-pointer"
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Image Section */}
                      <div className="relative w-full md:w-64 h-48 md:h-auto overflow-hidden bg-surface-elevated flex-shrink-0">
                        <ImageWithFallback
                          src={membership.imageUrl}
                          alt={membership.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-surface/60" />
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 p-6 md:p-8">
                        <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                            <div 
                              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: membership.logoColor }}
                            >
                              <Icon size={24} className="text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary">
                              {membership.title}
                            </h3>
                                <span className="px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent" style={{ fontSize: '11px', fontWeight: 400 }}>
                              {membership.tier}
                            </span>
                          </div>
                              <p className="text-text-tertiary mb-1" style={{ fontSize: '13px', fontWeight: 300 }}>
                                {membership.provider} · {membership.category}
                              </p>
                              <p className="text-text-secondary" style={{ fontSize: '14px', fontWeight: 300, lineHeight: '1.6' }}>
                                {membership.description}
                          </p>
                        </div>
                      </div>
                      </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                          {membership.benefits.slice(0, 3).map((benefit, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <Check size={14} className="text-accent mt-0.5 flex-shrink-0" />
                          <span className="text-text-secondary" style={{ fontSize: '13px', fontWeight: 300 }}>
                            {benefit}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-6 border-t border-border-subtle">
                      <div>
                        <p className="text-text-tertiary mb-1" style={{ fontSize: '11px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Current Value
                        </p>
                        <p className="text-accent" style={{ fontSize: '16px', fontWeight: 400 }}>
                          {membership.value}
                        </p>
                      </div>
                      <div className="flex gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleManageClick(membership.id);
                              }}
                              className="px-4 py-2 rounded-lg bg-surface-elevated hover:bg-border text-text-primary transition-colors" 
                              style={{ fontSize: '13px', fontWeight: 400 }}
                            >
                          Manage
                        </button>
                            <div className="p-2 rounded-lg bg-surface-elevated group-hover:bg-border transition-colors">
                              <ExternalLink size={16} className="text-text-secondary group-hover:text-accent transition-colors" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Add New Membership CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 p-8 rounded-2xl bg-gradient-to-br from-surface to-background border border-border"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary mb-2">
                  Connect More Memberships
                </h3>
                <p className="text-text-secondary" style={{ fontSize: '14px', fontWeight: 300 }}>
                  Let Pier optimize and track all your benefits in one place
                </p>
              </div>
              <button className="px-6 py-3 rounded-xl bg-accent hover:bg-[#d4c4a6] text-background transition-all" style={{ fontSize: '14px', fontWeight: 400 }}>
                Add Membership
              </button>
            </div>
          </motion.div>
        </div>

        {/* Detail Modal */}
        <MembershipDetail
          membership={selectedMembership}
          isOpen={!!selectedMembership}
          onClose={() => setSelectedMembership(null)}
          onManage={() => {
            if (selectedMembership) {
              handleManageClick(selectedMembership.id);
            }
          }}
        />

        {/* Management Modal */}
        <MembershipManagement
          membership={manageMembership}
          isOpen={!!manageMembership}
          onClose={() => setManageMembership(null)}
        />
      </div>
    </PageLayout>
  );
}

export default MembershipsPage;
