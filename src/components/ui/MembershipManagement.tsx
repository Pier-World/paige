import { X, Link2, Unlink, Bell, CreditCard, Calendar, Shield, CheckCircle, AlertCircle, ExternalLink, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export interface MembershipManagementData {
  id: string;
  title: string;
  provider: string;
  tier: string;
  logoColor: string;
  status: {
    active: boolean;
    renewalDate: string;
    autoRenew: boolean;
  };
  connection: {
    connected: boolean;
    email?: string;
    lastSync?: string;
    syncStatus: 'success' | 'warning' | 'error';
  };
  notifications: {
    benefitReminders: boolean;
    renewalAlerts: boolean;
    usageTracking: boolean;
  };
  payment: {
    annualFee: string;
    nextBilling: string;
    paymentMethod?: string;
  };
}

interface MembershipManagementProps {
  membership: MembershipManagementData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MembershipManagement({ membership, isOpen, onClose }: MembershipManagementProps) {
  const [notifications, setNotifications] = useState(
    membership?.notifications || {
      benefitReminders: true,
      renewalAlerts: true,
      usageTracking: true,
    }
  );

  const [autoRenew, setAutoRenew] = useState(membership?.status.autoRenew || true);

  if (!membership) return null;

  const handleToggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getSyncStatusColor = () => {
    switch (membership.connection.syncStatus) {
      case 'success':
        return 'text-[#4ade80]';
      case 'warning':
        return 'text-[#fbbf24]';
      case 'error':
        return 'text-[#ef4444]';
      default:
        return 'text-text-tertiary';
    }
  };

  const getSyncStatusIcon = () => {
    switch (membership.connection.syncStatus) {
      case 'success':
        return CheckCircle;
      case 'warning':
      case 'error':
        return AlertCircle;
      default:
        return AlertCircle;
    }
  };

  const StatusIcon = getSyncStatusIcon();

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
                className="w-full max-w-3xl rounded-2xl bg-background border border-border shadow-2xl overflow-hidden my-8"
              >
                {/* Header */}
                <div className="relative p-8 pb-6 border-b border-border-subtle">
                  <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-lg hover:bg-surface-elevated transition-colors"
                  >
                    <X size={20} className="text-text-secondary" />
                  </button>
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: membership.logoColor }}
                    >
                      <span className="text-white" style={{ fontSize: '24px', fontWeight: 600 }}>
                        {membership.provider.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h2 style={{ fontSize: '24px', fontWeight: 300, letterSpacing: '-0.01em' }} className="text-text-primary mb-1">
                        Manage {membership.title}
                      </h2>
                      <p className="text-text-secondary" style={{ fontSize: '14px', fontWeight: 300 }}>
                        {membership.provider} · {membership.tier}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                  {/* Account Connection */}
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 400 }} className="text-text-primary mb-4">
                      Account Connection
                    </h3>
                    <div className="p-5 rounded-xl bg-surface border border-border">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={membership.connection.connected ? 'text-[#4ade80]' : 'text-text-tertiary'}>
                              <Link2 size={18} />
                            </div>
                            <span className="text-text-primary" style={{ fontSize: '15px', fontWeight: 400 }}>
                              {membership.connection.connected ? 'Connected' : 'Not Connected'}
                            </span>
                          </div>
                          {membership.connection.connected && membership.connection.email && (
                            <p className="text-text-tertiary" style={{ fontSize: '13px', fontWeight: 300 }}>
                              {membership.connection.email}
                            </p>
                          )}
                        </div>
                        <button
                          className={`px-4 py-2 rounded-lg transition-all ${
                            membership.connection.connected
                              ? 'bg-surface-elevated hover:bg-border text-text-secondary'
                              : 'bg-accent hover:bg-[#d4c4a6] text-background'
                          }`}
                          style={{ fontSize: '13px', fontWeight: 400 }}
                        >
                          {membership.connection.connected ? 'Disconnect' : 'Connect Account'}
                        </button>
                      </div>
                      {membership.connection.connected && (
                        <div className="pt-4 border-t border-border-subtle">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <StatusIcon size={16} className={getSyncStatusColor()} />
                              <span className="text-text-secondary" style={{ fontSize: '13px', fontWeight: 300 }}>
                                Last synced: {membership.connection.lastSync}
                              </span>
                            </div>
                            <button className="text-accent hover:text-[#d4c4a6] transition-colors" style={{ fontSize: '13px', fontWeight: 400 }}>
                              Sync Now
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notifications */}
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 400 }} className="text-text-primary mb-4">
                      Notifications
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-5 rounded-xl bg-surface border border-border">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Bell size={16} className="text-accent" />
                            <span className="text-text-primary" style={{ fontSize: '14px', fontWeight: 400 }}>
                              Benefit Reminders
                            </span>
                          </div>
                          <p className="text-text-tertiary" style={{ fontSize: '12px', fontWeight: 300 }}>
                            Get notified about unused benefits
                          </p>
                        </div>
                        <button
                          onClick={() => handleToggleNotification('benefitReminders')}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            notifications.benefitReminders ? 'bg-accent' : 'bg-border'
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                              notifications.benefitReminders ? 'translate-x-6' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-5 rounded-xl bg-surface border border-border">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar size={16} className="text-accent" />
                            <span className="text-text-primary" style={{ fontSize: '14px', fontWeight: 400 }}>
                              Renewal Alerts
                            </span>
                          </div>
                          <p className="text-text-tertiary" style={{ fontSize: '12px', fontWeight: 300 }}>
                            Reminders before renewal date
                          </p>
                        </div>
                        <button
                          onClick={() => handleToggleNotification('renewalAlerts')}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            notifications.renewalAlerts ? 'bg-accent' : 'bg-border'
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                              notifications.renewalAlerts ? 'translate-x-6' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-5 rounded-xl bg-surface border border-border">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Shield size={16} className="text-accent" />
                            <span className="text-text-primary" style={{ fontSize: '14px', fontWeight: 400 }}>
                              Usage Tracking
                            </span>
                          </div>
                          <p className="text-text-tertiary" style={{ fontSize: '12px', fontWeight: 300 }}>
                            Track benefit utilization
                          </p>
                        </div>
                        <button
                          onClick={() => handleToggleNotification('usageTracking')}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            notifications.usageTracking ? 'bg-accent' : 'bg-border'
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                              notifications.usageTracking ? 'translate-x-6' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Billing */}
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 400 }} className="text-text-primary mb-4">
                      Billing & Renewal
                    </h3>
                    <div className="p-5 rounded-xl bg-surface border border-border space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-text-tertiary mb-1" style={{ fontSize: '12px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Annual Fee
                          </p>
                          <p className="text-text-primary" style={{ fontSize: '18px', fontWeight: 400 }}>
                            {membership.payment.annualFee}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-text-tertiary mb-1" style={{ fontSize: '12px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Next Billing
                          </p>
                          <p className="text-text-primary" style={{ fontSize: '18px', fontWeight: 400 }}>
                            {membership.payment.nextBilling}
                          </p>
                        </div>
                      </div>
                      {membership.payment.paymentMethod && (
                        <div className="pt-4 border-t border-border-subtle">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CreditCard size={16} className="text-accent" />
                              <span className="text-text-secondary" style={{ fontSize: '14px', fontWeight: 300 }}>
                                {membership.payment.paymentMethod}
                              </span>
                            </div>
                            <button className="text-accent hover:text-[#d4c4a6] transition-colors" style={{ fontSize: '13px', fontWeight: 400 }}>
                              Update
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="pt-4 border-t border-border-subtle">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-text-primary mb-1" style={{ fontSize: '14px', fontWeight: 400 }}>
                              Auto-Renewal
                            </p>
                            <p className="text-text-tertiary" style={{ fontSize: '12px', fontWeight: 300 }}>
                              {autoRenew ? 'Enabled' : 'Disabled'}
                            </p>
                          </div>
                          <button
                            onClick={() => setAutoRenew(!autoRenew)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              autoRenew ? 'bg-accent' : 'bg-border'
                            }`}
                          >
                            <div
                              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                                autoRenew ? 'translate-x-6' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Links */}
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 400 }} className="text-text-primary mb-4">
                      Quick Links
                    </h3>
                    <div className="space-y-2">
                      <a
                        href="#"
                        className="flex items-center justify-between p-4 rounded-lg bg-surface border border-border hover:border-accent/40 transition-all group"
                      >
                        <span className="text-text-primary" style={{ fontSize: '14px', fontWeight: 400 }}>
                          View Account Online
                        </span>
                        <ExternalLink size={16} className="text-text-tertiary group-hover:text-accent transition-colors" />
                      </a>
                      <a
                        href="#"
                        className="flex items-center justify-between p-4 rounded-lg bg-surface border border-border hover:border-accent/40 transition-all group"
                      >
                        <span className="text-text-primary" style={{ fontSize: '14px', fontWeight: 400 }}>
                          Download Statements
                        </span>
                        <ExternalLink size={16} className="text-text-tertiary group-hover:text-accent transition-colors" />
                      </a>
                      <a
                        href="#"
                        className="flex items-center justify-between p-4 rounded-lg bg-surface border border-border hover:border-accent/40 transition-all group"
                      >
                        <span className="text-text-primary" style={{ fontSize: '14px', fontWeight: 400 }}>
                          Contact Support
                        </span>
                        <ExternalLink size={16} className="text-text-tertiary group-hover:text-accent transition-colors" />
                      </a>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="pt-6 border-t border-border-subtle">
                    <h3 style={{ fontSize: '18px', fontWeight: 400 }} className="text-text-primary mb-4">
                      Danger Zone
                    </h3>
                    <button className="flex items-center gap-2 px-4 py-3 rounded-lg bg-surface border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/5 text-red-400 transition-all w-full">
                      <Trash2 size={16} />
                      <span style={{ fontSize: '14px', fontWeight: 400 }}>
                        Remove Membership from Pier
                      </span>
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={onClose}
                      className="flex-1 px-6 py-3 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-text-primary transition-all"
                      style={{ fontSize: '14px', fontWeight: 400 }}
                    >
                      Cancel
                    </button>
                    <button
                      className="flex-1 px-6 py-3 rounded-lg bg-accent hover:bg-[#d4c4a6] text-background transition-all"
                      style={{ fontSize: '14px', fontWeight: 400 }}
                    >
                      Save Changes
                    </button>
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

