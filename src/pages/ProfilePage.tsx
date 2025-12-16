import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageLayout } from '../components/layout/PageLayout';
import { useAuth } from '../context/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  User, Edit2, Check, X, MapPin, CreditCard, Link2, 
  Mail, Calendar, LogOut, HelpCircle, ChevronRight, Plus, 
  Camera, Trash2, Building, Plane, Star, Globe, Award
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
  const [gmailIntegrations, setGmailIntegrations] = useState<any[]>([]);
  const [calendarIntegrations, setCalendarIntegrations] = useState<any[]>([]);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [disconnectModal, setDisconnectModal] = useState<{
    isOpen: boolean;
    type: 'gmail' | 'calendar' | 'membership' | null;
    name: string;
    email?: string;
    provider?: 'google_gmail' | 'google_calendar';
    integrationId?: string;
    membershipId?: string;
  }>({
    isOpen: false,
    type: null,
    name: '',
  });
  const [disconnectConfirmed, setDisconnectConfirmed] = useState(false);
  
  // Memberships - using mock data for now
  const [connectedMemberships, setConnectedMemberships] = useState<any[]>([]);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<typeof memberships[0] | null>(null);
  const [showMembershipForm, setShowMembershipForm] = useState(false);

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
      // Get ALL Gmail integrations (not just one)
      const { data: gmailInts, error: gmailError } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'google_gmail')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (gmailError) {
        console.error('Error fetching Gmail integrations:', gmailError);
        setGmailIntegrations([]);
      } else {
        // Transform Gmail integrations to include email from metadata
        const gmailAccounts = (gmailInts || []).map((int: any) => ({
          ...int,
          email: int.metadata?.email || user.email,
          display_name: int.metadata?.email || 'Gmail',
        }));
        setGmailIntegrations(gmailAccounts);
      }

      // Get calendar integration
      const { data: calInt } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'google_calendar')
        .eq('is_active', true)
        .maybeSingle();

      if (calInt) {
        // Get all unique calendar IDs from calendar_events
        const { data: calendarEvents } = await supabase
          .from('calendar_events')
          .select('gcal_calendar_id')
          .eq('user_id', user.id);

        // Get unique calendar IDs
        const uniqueCalendarIds = Array.from(
          new Set((calendarEvents || []).map((e: any) => e.gcal_calendar_id).filter(Boolean))
        );

        // Create calendar objects for each unique calendar
        const calendars = uniqueCalendarIds.map((calendarId: string, index: number) => {
          // Try to get calendar name from metadata or use a readable name
          let calendarName = calendarId;
          if (calendarId === 'primary') {
            calendarName = calInt.metadata?.calendar_name || calInt.metadata?.email || 'Primary Calendar';
          } else if (calendarId.includes('@')) {
            // If it's an email, use it as the name
            calendarName = calendarId;
          } else {
            // Try to extract a readable name
            calendarName = calInt.metadata?.calendar_name || `Calendar ${index + 1}`;
          }

          return {
            id: `${calInt.id}-${calendarId}`,
            integration_id: calInt.id,
            calendar_id: calendarId,
            calendar_name: calendarName,
            email: calInt.metadata?.email || user.email,
            metadata: calInt.metadata,
            ...calInt,
          };
        });

        // If no calendar events found, still show the integration
        if (calendars.length === 0 && calInt) {
          calendars.push({
            id: calInt.id,
            integration_id: calInt.id,
            calendar_id: 'primary',
            calendar_name: calInt.metadata?.calendar_name || calInt.metadata?.email || 'Google Calendar',
            email: calInt.metadata?.email || user.email,
            metadata: calInt.metadata,
            ...calInt,
          });
        }

        setCalendarIntegrations(calendars);
      } else {
        setCalendarIntegrations([]);
      }
    } catch (error) {
      console.error('Error checking connections:', error);
      setCalendarIntegrations([]);
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

      // Close modal and reset confirmation
      setDisconnectModal({ isOpen: false, type: null, name: '' });
      setDisconnectConfirmed(false);
      await checkConnections();
    } catch (error) {
      console.error('Error disconnecting service:', error);
      setUpdateError('Failed to disconnect service');
    }
  }

  async function disconnectMembership(membershipId: string) {
    // TODO: Implement membership disconnection
    console.log('Disconnect membership:', membershipId);
    setDisconnectModal({ isOpen: false, type: null, name: '' });
    setDisconnectConfirmed(false);
  }

  const handleDisconnectClick = (
    type: 'gmail' | 'calendar' | 'membership',
    name: string,
    email?: string,
    provider?: 'google_gmail' | 'google_calendar',
    integrationId?: string,
    membershipId?: string
  ) => {
    setDisconnectModal({
      isOpen: true,
      type,
      name,
      email,
      provider,
      integrationId,
      membershipId,
    });
    setDisconnectConfirmed(false);
  };

  const handleConfirmDisconnect = () => {
    if (!disconnectConfirmed) return;

    const { type, provider, integrationId, membershipId } = disconnectModal;
    
    if (type === 'gmail' || type === 'calendar') {
      if (provider) {
        disconnectService(provider, integrationId);
      }
    } else if (type === 'membership') {
      if (membershipId) {
        disconnectMembership(membershipId);
      }
    }
  };


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
                    onClick={() => setShowMembershipModal(true)}
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
                            <button 
                              onClick={() => handleDisconnectClick('membership', membership.name, undefined, undefined, undefined, membership.id)}
                              className="p-2 hover:bg-border rounded-lg transition-colors"
                            >
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
                className="rounded-2xl bg-surface border border-border p-4 md:p-8"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 md:mb-6">
                  <div className="flex items-center gap-2">
                    <Link2 size={18} className="text-accent md:w-5 md:h-5" />
                    <h3 style={{ fontSize: '18px', fontWeight: 400 }} className="text-text-primary md:text-xl">
                      Connected Accounts
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowConnectModal(true)}
                    className="text-accent hover:text-[#d4c4a6] transition-colors text-left sm:text-right text-xs md:text-sm"
                    style={{ fontSize: '12px', fontWeight: 400 }}
                  >
                    + Connect Account
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Gmail - Show all connected Gmail accounts */}
                  {gmailIntegrations.map((gmailInt) => (
                    <div key={gmailInt.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 p-3 md:p-4 rounded-xl bg-surface-elevated border border-border hover:border-accent/20 transition-all">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EA4335' }}>
                          <Mail size={18} className="text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-text-primary mb-1 truncate" style={{ fontSize: '14px', fontWeight: 400 }}>
                            Gmail
                          </p>
                          <p className="text-text-tertiary truncate" style={{ fontSize: '12px', fontWeight: 300 }}>
                            {gmailInt.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-center sm:justify-end gap-2 flex-shrink-0 sm:ml-2 w-full sm:w-auto">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <button
                          onClick={() => handleDisconnectClick('gmail', 'Gmail', gmailInt.email, 'google_gmail', gmailInt.id)}
                          className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 text-red-400 transition-all whitespace-nowrap"
                          style={{ fontSize: '13px', fontWeight: 400 }}
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Show "Connect Gmail" if no Gmail accounts connected */}
                  {gmailIntegrations.length === 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 p-3 md:p-4 rounded-xl bg-surface-elevated border border-border border-dashed">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EA4335' }}>
                          <Mail size={18} className="text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-text-primary mb-1" style={{ fontSize: '14px', fontWeight: 400 }}>
                            Gmail
                          </p>
                          <p className="text-text-tertiary" style={{ fontSize: '12px', fontWeight: 300 }}>
                            Not connected
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowConnectModal(false);
                          connectGmail();
                        }}
                        className="px-4 py-2 rounded-lg bg-accent hover:bg-[#d4c4a6] text-background transition-all whitespace-nowrap flex-shrink-0 border border-accent/20"
                        style={{ fontSize: '13px', fontWeight: 500 }}
                      >
                        Connect
                      </button>
                    </div>
                  )}

                  {/* Google Calendar - Show each connected calendar individually */}
                  {calendarIntegrations.map((calendar) => (
                    <div key={calendar.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 p-3 md:p-4 rounded-xl bg-surface-elevated border border-border hover:border-accent/20 transition-all">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#4285F4' }}>
                          <Calendar size={18} className="text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-text-primary mb-1 truncate" style={{ fontSize: '14px', fontWeight: 400 }}>
                            {calendar.calendar_name || calendar.calendar_id}
                          </p>
                          <p className="text-text-tertiary truncate" style={{ fontSize: '12px', fontWeight: 300 }}>
                            {calendar.email || user.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-center sm:justify-end gap-2 flex-shrink-0 sm:ml-2 w-full sm:w-auto">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <button
                          onClick={() => handleDisconnectClick('calendar', calendar.calendar_name || calendar.calendar_id, calendar.email, 'google_calendar', calendar.integration_id)}
                          className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 text-red-400 transition-all whitespace-nowrap"
                          style={{ fontSize: '13px', fontWeight: 400 }}
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Show "Connect Calendar" if no calendar accounts connected */}
                  {calendarIntegrations.length === 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 p-3 md:p-4 rounded-xl bg-surface-elevated border border-border border-dashed">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#4285F4' }}>
                          <Calendar size={18} className="text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-text-primary mb-1" style={{ fontSize: '14px', fontWeight: 400 }}>
                            Google Calendar
                          </p>
                          <p className="text-text-tertiary" style={{ fontSize: '12px', fontWeight: 300 }}>
                            Not connected
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowConnectModal(false);
                          connectCalendar();
                        }}
                        className="px-4 py-2 rounded-lg bg-accent hover:bg-[#d4c4a6] text-background transition-all whitespace-nowrap flex-shrink-0 border border-accent/20"
                        style={{ fontSize: '13px', fontWeight: 500 }}
                      >
                        Connect
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Connect Account Modal */}
              <AnimatePresence>
                {showConnectModal && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowConnectModal(false)}
                      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md rounded-2xl bg-background border border-border shadow-2xl overflow-hidden"
                      >
                        <div className="p-6 border-b border-border-subtle">
                          <h3 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary mb-2">
                            Connect Account
                          </h3>
                          <p className="text-text-secondary" style={{ fontSize: '14px', fontWeight: 300 }}>
                            Choose an account to connect
                          </p>
                        </div>
                        <div className="p-4 space-y-2">
                          <button
                            onClick={() => {
                              setShowConnectModal(false);
                              connectGmail();
                            }}
                            className="w-full flex items-center gap-3 p-4 rounded-xl bg-surface-elevated border border-border hover:border-accent/40 transition-all text-left"
                          >
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EA4335' }}>
                              <Mail size={18} className="text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-text-primary mb-1" style={{ fontSize: '15px', fontWeight: 400 }}>
                                Gmail
                              </p>
                              <p className="text-text-tertiary" style={{ fontSize: '12px', fontWeight: 300 }}>
                                Connect your Gmail account
                              </p>
                            </div>
                            <ChevronRight size={18} className="text-text-tertiary flex-shrink-0" />
                          </button>
                          <button
                            onClick={() => {
                              setShowConnectModal(false);
                              connectCalendar();
                            }}
                            className="w-full flex items-center gap-3 p-4 rounded-xl bg-surface-elevated border border-border hover:border-accent/40 transition-all text-left"
                          >
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#4285F4' }}>
                              <Calendar size={18} className="text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-text-primary mb-1" style={{ fontSize: '15px', fontWeight: 400 }}>
                                Google Calendar
                              </p>
                              <p className="text-text-tertiary" style={{ fontSize: '12px', fontWeight: 300 }}>
                                Connect your Google Calendar
                              </p>
                            </div>
                            <ChevronRight size={18} className="text-text-tertiary flex-shrink-0" />
                          </button>
                        </div>
                        <div className="p-4 border-t border-border-subtle">
                          <button
                            onClick={() => setShowConnectModal(false)}
                            className="w-full px-4 py-2.5 rounded-lg bg-surface hover:bg-surface-elevated text-text-primary transition-colors"
                            style={{ fontSize: '14px', fontWeight: 400 }}
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* Disconnect Confirmation Modal */}
      <AnimatePresence>
        {disconnectModal.isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setDisconnectModal({ isOpen: false, type: null, name: '' });
                setDisconnectConfirmed(false);
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-2xl bg-background border border-border shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-border-subtle">
                  <h3 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary mb-2">
                    Disconnect Account
                  </h3>
                  <p className="text-text-secondary" style={{ fontSize: '14px', fontWeight: 300 }}>
                    Are you sure you want to disconnect <span className="text-text-primary font-medium">{disconnectModal.name}</span>?
                  </p>
                  {disconnectModal.email && (
                    <p className="text-text-tertiary mt-1" style={{ fontSize: '13px', fontWeight: 300 }}>
                      {disconnectModal.email}
                    </p>
                  )}
                </div>
                <div className="p-6 space-y-4">
                  <div className="p-4 rounded-xl bg-surface-elevated border border-border">
                    <p className="text-text-secondary mb-3" style={{ fontSize: '13px', fontWeight: 300 }}>
                      This will:
                    </p>
                    <ul className="space-y-2 text-text-secondary" style={{ fontSize: '13px', fontWeight: 300 }}>
                      {disconnectModal.type === 'calendar' && (
                        <>
                          <li className="flex items-start gap-2">
                            <span className="text-red-400 mt-0.5">•</span>
                            <span>Remove all synced calendar events</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-red-400 mt-0.5">•</span>
                            <span>Stop future calendar syncing</span>
                          </li>
                        </>
                      )}
                      {disconnectModal.type === 'gmail' && (
                        <>
                          <li className="flex items-start gap-2">
                            <span className="text-red-400 mt-0.5">•</span>
                            <span>Stop Gmail syncing</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-red-400 mt-0.5">•</span>
                            <span>Remove Gmail integration access</span>
                          </li>
                        </>
                      )}
                      {disconnectModal.type === 'membership' && (
                        <>
                          <li className="flex items-start gap-2">
                            <span className="text-red-400 mt-0.5">•</span>
                            <span>Remove membership connection</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-red-400 mt-0.5">•</span>
                            <span>Stop membership benefits syncing</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                  <label className="flex items-start gap-3 p-4 rounded-xl bg-surface-elevated border border-border cursor-pointer hover:border-accent/20 transition-colors">
                    <input
                      type="checkbox"
                      checked={disconnectConfirmed}
                      onChange={(e) => setDisconnectConfirmed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-border bg-surface text-accent focus:ring-accent focus:ring-offset-0 focus:ring-2"
                    />
                    <span className="text-text-primary" style={{ fontSize: '14px', fontWeight: 400 }}>
                      I understand and want to disconnect this account
                    </span>
                  </label>
                </div>
                <div className="p-6 border-t border-border-subtle flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setDisconnectModal({ isOpen: false, type: null, name: '' });
                      setDisconnectConfirmed(false);
                    }}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-surface hover:bg-surface-elevated text-text-primary transition-colors"
                    style={{ fontSize: '14px', fontWeight: 400 }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDisconnect}
                    disabled={!disconnectConfirmed}
                    className={`flex-1 px-4 py-2.5 rounded-lg transition-colors ${
                      disconnectConfirmed
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-surface-elevated text-text-tertiary cursor-not-allowed'
                    }`}
                    style={{ fontSize: '14px', fontWeight: 400 }}
                  >
                    Disconnect
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Membership Selection Modal */}
      <AnimatePresence>
        {showMembershipModal && !showMembershipForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMembershipModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-background border border-border shadow-2xl overflow-hidden flex flex-col"
              >
                <div className="p-6 border-b border-border-subtle flex-shrink-0">
                  <div className="flex items-center justify-between mb-4">
                    <h3 style={{ fontSize: '20px', fontWeight: 400 }} className="text-text-primary">
                      Connect Membership
                    </h3>
                    <button
                      onClick={() => setShowMembershipModal(false)}
                      className="p-2 hover:bg-surface-elevated rounded-lg transition-colors"
                    >
                      <X size={20} className="text-text-tertiary" />
                    </button>
                  </div>
                  <p className="text-text-secondary" style={{ fontSize: '14px', fontWeight: 300 }}>
                    Select a membership partner to connect
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {memberships.map((membership) => {
                      const Icon = membership.icon;
                      const isConnected = connectedMemberships.some(m => m.id === membership.id);
                      return (
                        <button
                          key={membership.id}
                          onClick={() => {
                            setSelectedMembership(membership);
                            setShowMembershipForm(true);
                          }}
                          disabled={isConnected}
                          className={`relative p-5 rounded-xl border transition-all text-left ${
                            isConnected
                              ? 'bg-surface-elevated/50 border-border/50 opacity-60 cursor-not-allowed'
                              : 'bg-surface-elevated border-border hover:border-accent/40 hover:bg-surface'
                          }`}
                        >
                          {isConnected && (
                            <div className="absolute top-3 right-3">
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                            </div>
                          )}
                          <div className="flex items-start gap-4">
                            <div
                              className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: membership.logoColor }}
                            >
                              <Icon size={24} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-text-primary mb-1 truncate" style={{ fontSize: '16px', fontWeight: 400 }}>
                                {membership.title}
                              </h4>
                              <p className="text-text-tertiary mb-2" style={{ fontSize: '12px', fontWeight: 300 }}>
                                {membership.provider}
                              </p>
                              <p className="text-text-secondary line-clamp-2" style={{ fontSize: '13px', fontWeight: 300 }}>
                                {membership.description}
                              </p>
                              {isConnected && (
                                <p className="text-green-400 mt-2" style={{ fontSize: '12px', fontWeight: 400 }}>
                                  Already connected
                                </p>
                              )}
                            </div>
                            {!isConnected && (
                              <ChevronRight size={18} className="text-text-tertiary flex-shrink-0 mt-1" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Membership Connection Form Modal */}
      <AnimatePresence>
        {showMembershipForm && selectedMembership && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowMembershipForm(false);
                setSelectedMembership(null);
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-2xl bg-background border border-border shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-border-subtle">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: selectedMembership.logoColor }}
                      >
                        {React.createElement(selectedMembership.icon, { size: 20, className: 'text-white' })}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 400 }} className="text-text-primary">
                          {selectedMembership.title}
                        </h3>
                        <p className="text-text-tertiary" style={{ fontSize: '12px', fontWeight: 300 }}>
                          {selectedMembership.provider}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowMembershipForm(false);
                        setSelectedMembership(null);
                      }}
                      className="p-2 hover:bg-surface-elevated rounded-lg transition-colors"
                    >
                      <X size={20} className="text-text-tertiary" />
                    </button>
                  </div>
                  <p className="text-text-secondary" style={{ fontSize: '14px', fontWeight: 300 }}>
                    Connect your membership account to track benefits and usage
                  </p>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-text-primary mb-2" style={{ fontSize: '14px', fontWeight: 400 }}>
                      Account Email
                    </label>
                    <input
                      type="email"
                      placeholder="your.email@example.com"
                      className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border focus:border-accent focus:outline-none text-text-primary placeholder-text-tertiary"
                      style={{ fontSize: '14px', fontWeight: 300 }}
                    />
                  </div>
                  <div>
                    <label className="block text-text-primary mb-2" style={{ fontSize: '14px', fontWeight: 400 }}>
                      Membership Number / Account ID
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your membership number"
                      className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border focus:border-accent focus:outline-none text-text-primary placeholder-text-tertiary"
                      style={{ fontSize: '14px', fontWeight: 300 }}
                    />
                  </div>
                  <div>
                    <label className="block text-text-primary mb-2" style={{ fontSize: '14px', fontWeight: 400 }}>
                      Tier / Status Level
                    </label>
                    <input
                      type="text"
                      placeholder={selectedMembership.tier || "e.g., Platinum, Gold, Elite"}
                      className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border focus:border-accent focus:outline-none text-text-primary placeholder-text-tertiary"
                      style={{ fontSize: '14px', fontWeight: 300 }}
                    />
                  </div>
                  <div className="p-4 rounded-xl bg-surface-elevated border border-border">
                    <p className="text-text-secondary" style={{ fontSize: '13px', fontWeight: 300 }}>
                      <strong className="text-text-primary">Note:</strong> We're currently setting up the infrastructure to automatically sync your membership data. For now, you can manually add your membership information, and we'll notify you when automatic syncing becomes available.
                    </p>
                  </div>
                </div>
                <div className="p-6 border-t border-border-subtle flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setShowMembershipForm(false);
                      setSelectedMembership(null);
                    }}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-surface hover:bg-surface-elevated text-text-primary transition-colors"
                    style={{ fontSize: '14px', fontWeight: 400 }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Save membership connection
                      // For now, just close the modal
                      setShowMembershipForm(false);
                      setSelectedMembership(null);
                      setShowMembershipModal(false);
                      // In the future, this will call an API to save the membership
                    }}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-accent hover:bg-[#d4c4a6] text-background transition-colors"
                    style={{ fontSize: '14px', fontWeight: 400 }}
                  >
                    Connect Membership
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

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
