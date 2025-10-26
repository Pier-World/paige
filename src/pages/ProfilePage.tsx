import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PageLayout } from '../components/layout/PageLayout';
import { MemberCard } from '../components/features/MemberCard';
import { Button } from '../components/ui/Button';
import { TagSelector } from '../components/ui/TagSelector';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user, updateProfile, updateEmail } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailUpdateError, setEmailUpdateError] = useState<string | null>(null);
  const [emailUpdateSuccess, setEmailUpdateSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    phone: user?.phone || '',
    preferredCities: user?.preferences?.preferred_cities || [],
    interests: user?.preferences?.interests || [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Options for form selects
  const cityOptions = [
    'New York',
    'Los Angeles',
    'Miami',
    'London',
    'Paris',
    'Tokyo',
    'Hong Kong',
  ];

  const interestOptions = [
    'Dining',
    'Hotels',
    'Travel',
    'Experiences',
    'Wellness',
    'Shopping',
    'Entertainment',
    'Arts & Culture',
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCitiesChange = (cities: string[]) => {
    setFormData(prev => ({ ...prev, preferredCities: cities }));
  };

  const handleInterestsChange = (interests: string[]) => {
    setFormData(prev => ({ ...prev, interests: interests }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setUpdateError(null);
    
    try {
      const { error } = await updateProfile({
        phone: formData.phone,
        preferences: {
          preferred_cities: formData.preferredCities,
          interests: formData.interests,
        },
      });

      if (error) {
        throw error;
      }

      setIsEditing(false);
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailUpdateError(null);
    setEmailUpdateSuccess(null);
    
    try {
      const { data, error } = await updateEmail(newEmail, currentPassword);
      
      if (error) {
        setEmailUpdateError(error.message);
        return;
      }

      setEmailUpdateSuccess(data.message);
      setTimeout(() => {
        setIsEmailDialogOpen(false);
        setNewEmail('');
        setCurrentPassword('');
      }, 3000);
    } catch (error) {
      setEmailUpdateError(error instanceof Error ? error.message : 'Failed to update email');
    }
  };

  if (!user) {
    return (
      <PageLayout>
        <div className="container-custom py-20 text-center">
          <h2 className="text-3xl font-display mb-4">Not Authorized</h2>
          <p>Please log in to view your profile.</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container-custom py-12">
        {/* Mobile Member Card */}
        <div className="md:hidden mb-8">
          <MemberCard 
            firstName={user.first_name}
            lastName={user.last_name}
            memberId={user.member_id}
            membershipLevel={user.membership_level}
          />
        </div>

        <h1 className="text-4xl font-display font-medium mb-8">Member Profile</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Desktop Member Card */}
          <div className="hidden md:block lg:col-span-1 order-2 lg:order-1">
            <div className="sticky top-24">
              <h2 className="text-2xl font-display font-medium mb-6">Digital Member Card</h2>
              <MemberCard 
                firstName={user.first_name}
                lastName={user.last_name}
                memberId={user.member_id}
                membershipLevel={user.membership_level}
              />
            </div>
          </div>
          
          {/* Member Info */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="mb-8 flex justify-between items-center">
              <h2 className="text-2xl font-display font-medium">Member Information</h2>
              {!isEditing && (
                <Button 
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              )}
            </div>

            {updateError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
                {updateError}
              </div>
            )}
            
            {isEditing ? (
              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">
                      First Name
                    </label>
                    <p className="input w-full bg-primary-50">{user.first_name}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">
                      Last Name
                    </label>
                    <p className="input w-full bg-primary-50">{user.last_name}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-primary-700 mb-1">
                      Email
                    </label>
                    <div className="mt-1">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEmailDialogOpen(true)}
                        className="w-full justify-center"
                      >
                        Change Email Address
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-primary-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="input w-full"
                    />
                  </div>
                </div>
                
                <TagSelector
                  label="Preferred Cities"
                  options={cityOptions}
                  selected={formData.preferredCities}
                  onChange={handleCitiesChange}
                  placeholder="Add your preferred cities"
                />

                <TagSelector
                  label="Interests"
                  options={interestOptions}
                  selected={formData.interests}
                  onChange={handleInterestsChange}
                  placeholder="Select your interests"
                />
                
                <div className="flex justify-end space-x-4 pt-4">
                  <Button 
                    variant="ghost" 
                    type="button"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    isLoading={isSaving}
                  >
                    Save Changes
                  </Button>
                </div>
              </motion.form>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-sm font-medium text-primary-500 mb-1">Member ID</h3>
                    <p className="font-mono">{user.member_id}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-primary-500 mb-1">Member Since</h3>
                    <p>{new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-sm font-medium text-primary-500 mb-1">Name</h3>
                    <p>{user.first_name} {user.last_name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-primary-500 mb-1">Email</h3>
                    <p>{user.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-sm font-medium text-primary-500 mb-1">Phone</h3>
                    <p>{user.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-primary-500 mb-1">Membership Level</h3>
                    <p>{user.membership_level}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-neutral-500 mb-2">Preferred Cities</h3>
                  {user.preferences?.preferred_cities && user.preferences.preferred_cities.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.preferences.preferred_cities.map(city => (
                        <span key={city} className="inline-flex items-center px-4 py-2 bg-neutral-100 text-neutral-800 rounded-full text-sm font-medium">
                          {city}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-neutral-400 italic text-sm">No preferred cities selected</p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-neutral-500 mb-2">Interests</h3>
                  {user.preferences?.interests && user.preferences.interests.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.preferences.interests.map(interest => (
                        <span key={interest} className="inline-flex items-center px-4 py-2 bg-neutral-100 text-neutral-800 rounded-full text-sm font-medium">
                          {interest}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-neutral-400 italic text-sm">No interests selected</p>
                  )}
                </div>
                
                <div className="pt-4 border-t border-primary-100 flex flex-wrap gap-4">
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = '/reset-password'}
                  >
                    Change Password
                  </Button>
                  <Link to="/membership">
                    <Button variant="outline">
                      Manage Membership
                    </Button>
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin">
                      <Button 
                        variant="outline"
                        className="flex items-center"
                      >
                        <Shield size={16} className="mr-2" />
                        Admin Dashboard
                      </Button>
                    </Link>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Email Change Dialog */}
      {isEmailDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-medium mb-4">Change Email Address</h3>
            
            {emailUpdateError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">
                {emailUpdateError}
              </div>
            )}
            
            {emailUpdateSuccess && (
              <div className="bg-green-50 text-green-600 p-4 rounded-md mb-4">
                {emailUpdateSuccess}
              </div>
            )}
            
            <form onSubmit={handleEmailUpdate} className="space-y-4">
              <div>
                <label htmlFor="newEmail" className="block text-sm font-medium text-primary-700 mb-1">
                  New Email Address
                </label>
                <input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-primary-700 mb-1">
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-4 pt-4">
                <Button 
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setIsEmailDialogOpen(false);
                    setNewEmail('');
                    setCurrentPassword('');
                    setEmailUpdateError(null);
                    setEmailUpdateSuccess(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Update Email
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default ProfilePage;