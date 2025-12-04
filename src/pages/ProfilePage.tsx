import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageLayout } from '../components/layout/PageLayout';
import { useAuth } from '../context/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  User, Edit2, Check, X, MapPin, CreditCard, Link2, 
  Mail, Calendar, LogOut, HelpCircle, ChevronRight, Plus, 
  Camera, Trash2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';
import { MemberCard } from '../components/features/MemberCard';
import { memberships } from '../data/memberships';

const ProfilePage: React.FC = () => {
  const { user, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showMemberCard, setShowMemberCard] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  
  // Profile data state
  const [profileData, setProfileData] = useState({
    profilePhotoUrl: '',
    preferredCities: [] as string[],
    interests: [] as string[],
  });
  
  // Connections state
  const [gmailConnected, setGmailConnected] = useState(false);
  const [calendarIntegrations, setCalendarIntegrations] = useState<any[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Memberships - using mock data for now
  const [connectedMemberships, setConnectedMemberships] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadProfileData();
      checkConnections();
    }

    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    if (connected) {
      setTimeout(() => {
        checkConnections();
        window.history.replaceState({}, '', '/profile');
      }, 1000);
    }
    if (error) {
      setUpdateError(`OAuth error: ${error}`);
      window.history.replaceState({}, '', '/profile');
    }
  }, [user, searchParams]);

  async function loadProfileData() {
    if (!user) return;

    try {
      // Fetch profile data including personal_context
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('profile_photo_url, personal_context')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (profile) {
        const personalContext = profile.personal_context || {};
        setProfileData({
          profilePhotoUrl: profile.profile_photo_url || '',
          preferredCities: personalContext.preferred_cities || [],
          interests: personalContext.interests || [],
        });
      }

      // Load connected memberships (for now using mock data, filter by status)
      const activeMemberships = memberships
        .filter(m => m.status === 'active')
        .slice(0, 3)
        .map(m => ({
          id: m.id,
          name: m.title,
          provider: m.provider,
          icon: m.icon,
          color: m.logoColor,
          connected: true,
          lastSync: '2 hours ago', // Mock data
        }));
      setConnectedMemberships(activeMemberships);
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  }

  async function checkConnections() {
    if (!user) return;

    try {
      const { data: gmailInt } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'google_gmail')
        .eq('is_active', true)
        .maybeSingle();

      setGmailConnected(!!gmailInt);

      const { data: calInts } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'google_calendar')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      setCalendarIntegrations(calInts || []);
    } catch (error) {
      console.error('Error checking connections:', error);
    }
  }

  async function disconnectService(provider: 'google_gmail' | 'google_calendar', integrationId?: string) {
    if (!user) return;

    try {
      if (integrationId) {
        const { error } = await supabase
          .from('integrations')
          .update({ is_active: false })
          .eq('id', integrationId)
          .eq('user_id', user.id);

        if (error) throw error;

        if (provider === 'google_calendar') {
          await supabase
            .from('calendar_events')
            .delete()
            .eq('user_id', user.id);
        }
      } else {
        const { error } = await supabase
          .from('integrations')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .eq('provider', provider);

        if (error) throw error;

        if (provider === 'google_calendar') {
          await supabase
            .from('calendar_events')
            .delete()
            .eq('user_id', user.id);
        }
      }

      setOpenDropdown(null);
      await checkConnections();
    } catch (error) {
      console.error('Error disconnecting service:', error);
      setUpdateError('Failed to disconnect service');
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openDropdown]);

  async function connectGmail() {
    if (!user) return;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!anonKey) {
      setUpdateError('Configuration error: Missing API key');
      return;
    }
    
    setUpdateError(null);
    const oauthUrl = `${supabaseUrl}/functions/v1/auth-google?user_id=${user.id}&provider=gmail&apikey=${anonKey}`;
    const popup = window.open(oauthUrl, 'Google OAuth', 'width=500,height=600,left=' + (window.screen.width / 2 - 250) + ',top=' + (window.screen.height / 2 - 300));
    
    if (!popup) {
      setUpdateError('Please allow popups to connect your account');
      return;
    }
    
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        setTimeout(() => checkConnections(), 1000);
      }
    }, 500);
    
    const messageHandler = (event: MessageEvent) => {
      const messageType = typeof event.data === 'string' ? event.data : event.data?.type;
      
      if (messageType === 'oauth-success' || messageType === 'oauth-complete') {
        if (popup && !popup.closed) popup.close();
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        setTimeout(() => checkConnections(), 500);
      } else if (messageType === 'oauth-error') {
        if (popup && !popup.closed) popup.close();
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        setUpdateError('Authorization was cancelled or failed');
      }
    };
    
    window.addEventListener('message', messageHandler);
    setTimeout(() => {
      if (popup && !popup.closed) {
        popup.close();
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
      }
    }, 5 * 60 * 1000);
  }

  async function connectCalendar() {
    if (!user) return;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!anonKey) {
      setUpdateError('Configuration error: Missing API key');
      return;
    }
    
    setUpdateError(null);
    const oauthUrl = `${supabaseUrl}/functions/v1/auth-google?user_id=${user.id}&provider=calendar&apikey=${anonKey}`;
    const popup = window.open(oauthUrl, 'Google OAuth', 'width=500,height=600,left=' + (window.screen.width / 2 - 250) + ',top=' + (window.screen.height / 2 - 300));
    
    if (!popup) {
      setUpdateError('Please allow popups to connect your account');
      return;
    }
    
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        setTimeout(() => checkConnections(), 1000);
      }
    }, 500);
    
    const messageHandler = (event: MessageEvent) => {
      const messageType = typeof event.data === 'string' ? event.data : event.data?.type;
      
      if (messageType === 'oauth-success' || messageType === 'oauth-complete') {
        if (popup && !popup.closed) popup.close();
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        setTimeout(() => checkConnections(), 500);
      } else if (messageType === 'oauth-error') {
        if (popup && !popup.closed) popup.close();
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        setUpdateError('Authorization was cancelled or failed');
      }
    };
    
    window.addEventListener('message', messageHandler);
    setTimeout(() => {
      if (popup && !popup.closed) {
        popup.close();
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
      }
    }, 5 * 60 * 1000);
  }

  const handleEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue);
  };

  const handleSave = async (field: string) => {
    if (!user) return;
    setIsSaving(true);
    setUpdateError(null);

    try {
      if (field === 'name') {
        const [firstName, ...lastNameParts] = tempValue.split(' ');
        const lastName = lastNameParts.join(' ') || '';
        
        // Update members table
        const { error: membersError } = await supabase
          .from('members')
          .update({
            first_name: firstName,
            last_name: lastName,
          })
          .eq('id', user.id);
        
        if (membersError) throw membersError;
        
        // Update profiles table
        const { error: profilesError } = await supabase
          .from('profiles')
          .update({
            full_name: tempValue,
            first_name: firstName,
            last_name: lastName,
          })
          .eq('id', user.id);
        
        if (profilesError) throw profilesError;
        
        // Refresh user data
        window.location.reload(); // Simple refresh to get updated data
      } else if (field === 'email') {
        // Email updates require re-authentication via AuthContext
        setUpdateError('Email updates require re-authentication. Please contact support.');
        setIsSaving(false);
        setEditingField(null);
        return;
      } else if (field === 'phone') {
        const { error } = await updateProfile({ phone: tempValue });
        if (error) throw error;
      }

      setEditingField(null);
      setTempValue('');
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setTempValue('');
  };

  const handleAddCity = () => {
    if (profileData.preferredCities.length < 3) {
      const city = prompt('Enter city name:');
      if (city && city.trim()) {
        updatePreferredCities([...profileData.preferredCities, city.trim()]);
      }
    }
  };

  const handleRemoveCity = (city: string) => {
    updatePreferredCities(profileData.preferredCities.filter(c => c !== city));
  };

  const handleAddInterest = () => {
    const interest = prompt('Enter interest:');
    if (interest && interest.trim()) {
      updateInterests([...profileData.interests, interest.trim()]);
    }
  };

  const handleRemoveInterest = (interest: string) => {
    updateInterests(profileData.interests.filter(i => i !== interest));
  };

  async function updatePreferredCities(cities: string[]) {
    if (!user) return;
    try {
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('personal_context')
        .eq('id', user.id)
        .maybeSingle();

      const personalContext = currentProfile?.personal_context || {};
      personalContext.preferred_cities = cities;

      const { error } = await supabase
        .from('profiles')
        .update({ personal_context: personalContext })
        .eq('id', user.id);

      if (error) throw error;
      setProfileData(prev => ({ ...prev, preferredCities: cities }));
    } catch (error) {
      console.error('Error updating preferred cities:', error);
      setUpdateError('Failed to update preferred cities');
    }
  }

  async function updateInterests(interests: string[]) {
    if (!user) return;
    try {
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('personal_context')
        .eq('id', user.id)
        .maybeSingle();

      const personalContext = currentProfile?.personal_context || {};
      personalContext.interests = interests;

      const { error } = await supabase
        .from('profiles')
        .update({ personal_context: personalContext })
        .eq('id', user.id);

      if (error) throw error;
      setProfileData(prev => ({ ...prev, interests }));
    } catch (error) {
      console.error('Error updating interests:', error);
      setUpdateError('Failed to update interests');
    }
  }

  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    
    const file = e.target.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUpdateError('Please select an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUpdateError('Image must be less than 5MB');
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
    const filePath = `profile-photos/${fileName}`;

    try {
      // Try to upload to Supabase Storage (bucket may not exist yet)
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        // If bucket doesn't exist, use a data URL as fallback
        const reader = new FileReader();
        reader.onloadend = async () => {
          const dataUrl = reader.result as string;
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ profile_photo_url: dataUrl })
            .eq('id', user.id);

          if (updateError) {
            console.error('Error updating profile photo URL:', updateError);
            setUpdateError('Failed to save profile photo');
          } else {
            setProfileData(prev => ({ ...prev, profilePhotoUrl: dataUrl }));
          }
        };
        reader.readAsDataURL(file);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_photo_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;
      setProfileData(prev => ({ ...prev, profilePhotoUrl: publicUrl }));
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      setUpdateError('Failed to upload profile photo');
    }
  };

  const formatMemberSince = (createdAt: string | undefined) => {
    if (!createdAt) return 'N/A';
    const date = new Date(createdAt);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getMembershipTierDisplay = (level: string | undefined) => {
    if (!level) return 'Standard Member';
    const tierMap: Record<string, string> = {
      'Standard': 'Standard Member',
      'Premium': 'Premium Member',
      'Executive': 'Executive Member',
      'Founding Member': 'Founding Member',
    };
    return tierMap[level] || level;
  };

  if (!user) {
    return (
      <PageLayout>
        <main className="pt-24 pb-20 bg-background min-h-screen flex items-center justify-center">
          <div className="text-text-secondary">Loading...</div>
        </main>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <main className="pt-24 pb-20 bg-background min-h-screen">
        <div className="max-w-5xl mx-auto px-6">
          {/* Header */}
          <div className="mb-12">
            <h1 style={{ fontSize: '36px', fontWeight: 300, letterSpacing: '-0.02em' }} className="text-text-primary mb-2">
              Profile
            </h1>
            <p className="text-text-secondary" style={{ fontSize: '16px', fontWeight: 300 }}>
              Manage your personal information and account settings
            </p>
          </div>

          {/* Error Message */}
          {updateError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400"
            >
              {updateError}
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Profile Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-surface border border-border p-8"
                >
                  {/* Profile Photo */}
                  <div className="relative w-32 h-32 mx-auto mb-6 group">
                    <div className="w-full h-full rounded-full overflow-hidden bg-surface-elevated border-2 border-accent/20">
                      <ImageWithFallback
                        src={profileData.profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.first_name + ' ' + user.last_name)}&background=1a1a1a&color=e5c896`}
                        alt={user.first_name + ' ' + user.last_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <label className="absolute inset-0 rounded-full bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <Camera size={24} className="text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePhotoChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Name & Tier */}
                  <div className="text-center mb-6">
                    <h2 style={{ fontSize: '24px', fontWeight: 300, letterSpacing: '-0.01em' }} className="text-text-primary mb-2">
                      {user.first_name} {user.last_name}
                    </h2>
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-1">
                      <span className="text-accent" style={{ fontSize: '13px', fontWeight: 400 }}>
                        {getMembershipTierDisplay(user.membership_level)}
                      </span>
                    </div>
                    <button
                      onClick={() => navigate('/memberships')}
                      className="block w-full mt-2 text-accent hover:text-[#d4c4a6] transition-colors"
                      style={{ fontSize: '13px', fontWeight: 400 }}
                    >
                      Upgrade Membership →
                    </button>
                  </div>

                  {/* Member Info */}
                  <div className="space-y-3 mb-6 pb-6 border-b border-border/50">
                    <div>
                      <p className="text-text-tertiary mb-1" style={{ fontSize: '11px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Member ID
                      </p>
                      <p className="text-text-primary font-mono" style={{ fontSize: '13px', fontWeight: 400 }}>
                        {user.member_id || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-tertiary mb-1" style={{ fontSize: '11px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Member Since
                      </p>
                      <p className="text-text-primary" style={{ fontSize: '13px', fontWeight: 400 }}>
                        {formatMemberSince(user.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Member Card Button */}
                  <button
                    onClick={() => setShowMemberCard(true)}
                    className="w-full px-6 py-3 rounded-xl bg-accent hover:bg-[#d4c4a6] text-background transition-all mb-3"
                    style={{ fontSize: '14px', fontWeight: 400 }}
                  >
                    View Member Card
                  </button>

                  {/* Quick Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={() => navigate('/')}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-surface-elevated hover:bg-border text-text-primary transition-all"
                      style={{ fontSize: '14px', fontWeight: 400 }}
                    >
                      <div className="flex items-center gap-2">
                        <HelpCircle size={16} />
                        <span>Contact Support</span>
                      </div>
                      <ChevronRight size={16} className="text-text-tertiary" />
                    </button>
                    <button
                      onClick={signOut}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-surface-elevated hover:bg-border text-red-400 transition-all"
                      style={{ fontSize: '14px', fontWeight: 400 }}
                    >
                      <div className="flex items-center gap-2">
                        <LogOut size={16} />
                        <span>Log Out</span>
                      </div>
                      <ChevronRight size={16} className="text-text-tertiary" />
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Right Column - Detailed Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-surface border border-border p-8"
              >
                <div className="flex items-center gap-2 mb-6">
                  <User size={20} className="text-accent" />
                  <h3 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary">
                    Personal Information
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-text-tertiary mb-2" style={{ fontSize: '12px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Full Name
                    </label>
                    {editingField === 'name' ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          className="flex-1 px-4 py-3 rounded-lg bg-surface-elevated border border-accent/40 text-text-primary focus:outline-none focus:border-accent"
                          style={{ fontSize: '14px', fontWeight: 400 }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleSave('name')}
                          disabled={isSaving}
                          className="p-3 rounded-lg bg-accent hover:bg-[#d4c4a6] text-background transition-all disabled:opacity-50"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-3 rounded-lg bg-surface-elevated hover:bg-border text-text-primary transition-all"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-surface-elevated border border-border">
                        <span className="text-text-primary" style={{ fontSize: '14px', fontWeight: 400 }}>
                          {user.first_name} {user.last_name}
                        </span>
                        <button
                          onClick={() => handleEdit('name', `${user.first_name} ${user.last_name}`)}
                          className="p-1 hover:bg-border rounded transition-colors"
                        >
                          <Edit2 size={16} className="text-text-tertiary" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-text-tertiary mb-2" style={{ fontSize: '12px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Email Address
                    </label>
                    {editingField === 'email' ? (
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          className="flex-1 px-4 py-3 rounded-lg bg-surface-elevated border border-accent/40 text-text-primary focus:outline-none focus:border-accent"
                          style={{ fontSize: '14px', fontWeight: 400 }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleSave('email')}
                          disabled={isSaving}
                          className="p-3 rounded-lg bg-accent hover:bg-[#d4c4a6] text-background transition-all disabled:opacity-50"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-3 rounded-lg bg-surface-elevated hover:bg-border text-text-primary transition-all"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-surface-elevated border border-border">
                        <span className="text-text-primary" style={{ fontSize: '14px', fontWeight: 400 }}>
                          {user.email}
                        </span>
                        <button
                          onClick={() => handleEdit('email', user.email)}
                          className="p-1 hover:bg-border rounded transition-colors"
                        >
                          <Edit2 size={16} className="text-text-tertiary" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-text-tertiary mb-2" style={{ fontSize: '12px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Phone Number
                    </label>
                    {editingField === 'phone' ? (
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          className="flex-1 px-4 py-3 rounded-lg bg-surface-elevated border border-accent/40 text-text-primary focus:outline-none focus:border-accent"
                          style={{ fontSize: '14px', fontWeight: 400 }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleSave('phone')}
                          disabled={isSaving}
                          className="p-3 rounded-lg bg-accent hover:bg-[#d4c4a6] text-background transition-all disabled:opacity-50"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-3 rounded-lg bg-surface-elevated hover:bg-border text-text-primary transition-all"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-surface-elevated border border-border">
                        <span className="text-text-primary" style={{ fontSize: '14px', fontWeight: 400 }}>
                          {user.phone || 'Not provided'}
                        </span>
                        <button
                          onClick={() => handleEdit('phone', user.phone || '')}
                          className="p-1 hover:bg-border rounded transition-colors"
                        >
                          <Edit2 size={16} className="text-text-tertiary" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Preferences */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl bg-surface border border-border p-8"
              >
                <div className="flex items-center gap-2 mb-6">
                  <MapPin size={20} className="text-accent" />
                  <h3 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary">
                    Preferences
                  </h3>
                </div>

                {/* Preferred Cities */}
                <div className="mb-6">
                  <label className="block text-text-tertiary mb-3" style={{ fontSize: '12px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Preferred Cities (Max 3)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {profileData.preferredCities.map((city) => (
                      <div
                        key={city}
                        className="group flex items-center gap-2 px-4 py-2 rounded-full bg-surface-elevated border border-border hover:border-accent/40 transition-all"
                      >
                        <span className="text-text-primary" style={{ fontSize: '13px', fontWeight: 400 }}>
                          {city}
                        </span>
                        <button
                          onClick={() => handleRemoveCity(city)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} className="text-text-tertiary hover:text-text-primary" />
                        </button>
                      </div>
                    ))}
                    {profileData.preferredCities.length < 3 && (
                      <button
                        onClick={handleAddCity}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-elevated border border-border hover:border-accent/40 text-accent transition-all"
                        style={{ fontSize: '13px', fontWeight: 400 }}
                      >
                        <Plus size={14} />
                        Add City
                      </button>
                    )}
                  </div>
                </div>

                {/* Interests */}
                <div>
                  <label className="block text-text-tertiary mb-3" style={{ fontSize: '12px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Interests
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {profileData.interests.map((interest) => (
                      <div
                        key={interest}
                        className="group flex items-center gap-2 px-4 py-2 rounded-full bg-surface-elevated border border-border hover:border-accent/40 transition-all"
                      >
                        <span className="text-text-primary" style={{ fontSize: '13px', fontWeight: 400 }}>
                          {interest}
                        </span>
                        <button
                          onClick={() => handleRemoveInterest(interest)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} className="text-text-tertiary hover:text-text-primary" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={handleAddInterest}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-elevated border border-border hover:border-accent/40 text-accent transition-all"
                      style={{ fontSize: '13px', fontWeight: 400 }}
                    >
                      <Plus size={14} />
                      Add Interest
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Connected Memberships */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl bg-surface border border-border p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <CreditCard size={20} className="text-accent" />
                    <h3 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary">
                      Connected Memberships
                    </h3>
                  </div>
                  <button
                    onClick={() => navigate('/memberships')}
                    className="text-accent hover:text-[#d4c4a6] transition-colors"
                    style={{ fontSize: '13px', fontWeight: 400 }}
                  >
                    + Add New
                  </button>
                </div>

                <div className="space-y-3">
                  {connectedMemberships.length === 0 ? (
                    <p className="text-text-tertiary text-center py-8" style={{ fontSize: '14px', fontWeight: 300 }}>
                      No memberships connected yet
                    </p>
                  ) : (
                    connectedMemberships.map((membership) => {
                      const Icon = membership.icon;
                      return (
                        <div
                          key={membership.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-surface-elevated border border-border hover:border-accent/20 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: membership.color }}
                            >
                              <Icon size={18} className="text-white" />
                            </div>
                            <div>
                              <p className="text-text-primary mb-1" style={{ fontSize: '14px', fontWeight: 400 }}>
                                {membership.name}
                              </p>
                              <p className="text-text-tertiary" style={{ fontSize: '12px', fontWeight: 300 }}>
                                Last synced {membership.lastSync}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <button className="p-2 hover:bg-border rounded-lg transition-colors">
                              <Trash2 size={14} className="text-text-tertiary hover:text-red-400" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>

              {/* Connected Accounts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl bg-surface border border-border p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Link2 size={20} className="text-accent" />
                    <h3 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary">
                      Connected Accounts
                    </h3>
                  </div>
                  <button
                    onClick={connectCalendar}
                    className="text-accent hover:text-[#d4c4a6] transition-colors"
                    style={{ fontSize: '13px', fontWeight: 400 }}
                  >
                    + Connect Account
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Gmail */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-surface-elevated border border-border hover:border-accent/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#EA4335' }}>
                        <Mail size={18} className="text-white" />
                      </div>
                      <div>
                        <p className="text-text-primary mb-1" style={{ fontSize: '14px', fontWeight: 400 }}>
                          Gmail
                        </p>
                        <p className="text-text-tertiary" style={{ fontSize: '12px', fontWeight: 300 }}>
                          {user.email}
                        </p>
                      </div>
                    </div>
                    {gmailConnected ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <div className="relative" ref={dropdownRef}>
                          <button
                            onClick={() => setOpenDropdown(openDropdown === 'gmail' ? null : 'gmail')}
                            className="px-3 py-1.5 rounded-lg bg-surface hover:bg-border text-text-primary transition-all"
                            style={{ fontSize: '12px', fontWeight: 400 }}
                          >
                            Disconnect
                          </button>
                          <AnimatePresence>
                            {openDropdown === 'gmail' && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute right-0 top-full mt-2 w-48 rounded-lg bg-surface border border-border shadow-xl z-10"
                              >
                                <button
                                  onClick={() => disconnectService('google_gmail')}
                                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-surface-elevated transition-colors text-red-400"
                                  style={{ fontSize: '13px', fontWeight: 400 }}
                                >
                                  <LogOut size={14} />
                                  Disconnect
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={connectGmail}
                        className="px-3 py-1.5 rounded-lg bg-accent hover:bg-[#d4c4a6] text-background transition-all"
                        style={{ fontSize: '12px', fontWeight: 400 }}
                      >
                        Connect
                      </button>
                    )}
                  </div>

                  {/* Google Calendar */}
                  {calendarIntegrations.map((integration, idx) => (
                    <div key={integration.id} className="flex items-center justify-between p-4 rounded-xl bg-surface-elevated border border-border hover:border-accent/20 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#4285F4' }}>
                          <Calendar size={18} className="text-white" />
                        </div>
                        <div>
                          <p className="text-text-primary mb-1" style={{ fontSize: '14px', fontWeight: 400 }}>
                            {integration.metadata?.calendar_name || `Google Calendar ${idx + 1}`}
                          </p>
                          <p className="text-text-tertiary" style={{ fontSize: '12px', fontWeight: 300 }}>
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <div className="relative" ref={dropdownRef}>
                          <button
                            onClick={() => setOpenDropdown(openDropdown === integration.id ? null : integration.id)}
                            className="px-3 py-1.5 rounded-lg bg-surface hover:bg-border text-text-primary transition-all"
                            style={{ fontSize: '12px', fontWeight: 400 }}
                          >
                            Disconnect
                          </button>
                          <AnimatePresence>
                            {openDropdown === integration.id && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute right-0 top-full mt-2 w-48 rounded-lg bg-surface border border-border shadow-xl z-10"
                              >
                                <button
                                  onClick={() => disconnectService('google_calendar', integration.id)}
                                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-surface-elevated transition-colors text-red-400"
                                  style={{ fontSize: '13px', fontWeight: 400 }}
                                >
                                  <LogOut size={14} />
                                  Disconnect
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add Calendar Button */}
                  {calendarIntegrations.length === 0 && (
                    <div className="flex items-center justify-between p-4 rounded-xl bg-surface-elevated border border-border border-dashed">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#4285F4' }}>
                          <Calendar size={18} className="text-white" />
                        </div>
                        <div>
                          <p className="text-text-primary mb-1" style={{ fontSize: '14px', fontWeight: 400 }}>
                            Google Calendar
                          </p>
                          <p className="text-text-tertiary" style={{ fontSize: '12px', fontWeight: 300 }}>
                            Not connected
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={connectCalendar}
                        className="px-3 py-1.5 rounded-lg bg-accent hover:bg-[#d4c4a6] text-background transition-all"
                        style={{ fontSize: '12px', fontWeight: 400 }}
                      >
                        Connect
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {/* Member Card Modal */}
      <AnimatePresence>
        {showMemberCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowMemberCard(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface rounded-2xl border border-border p-8 max-w-md w-full"
            >
              <MemberCard
                firstName={user.first_name}
                lastName={user.last_name}
                memberId={user.member_id || 'N/A'}
                membershipLevel={getMembershipTierDisplay(user.membership_level)}
              />
              <button
                onClick={() => setShowMemberCard(false)}
                className="mt-4 w-full px-4 py-2 rounded-lg bg-surface-elevated hover:bg-border text-text-primary transition-colors"
                style={{ fontSize: '14px', fontWeight: 400 }}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
};

export default ProfilePage;
