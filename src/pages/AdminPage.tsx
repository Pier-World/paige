import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PageLayout } from '../components/layout/PageLayout';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Check, X } from 'lucide-react';

interface CreateMemberForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  membershipLevel: 'Standard' | 'Premium' | 'Executive' | 'Founding Member';
  memberId: string;
}

interface CreatedMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  memberId: string;
  membershipLevel: string;
  createdAt: string;
}

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [createdMembers, setCreatedMembers] = useState<CreatedMember[]>([]);
  const [formData, setFormData] = useState<CreateMemberForm>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    membershipLevel: 'Standard',
    memberId: ''
  });

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <PageLayout>
        <div className="container-custom py-20 text-center">
          <div className="flex items-center justify-center mb-4">
            <X className="text-red-500 mr-2" size={24} />
            <h2 className="text-3xl font-display">Access Denied</h2>
          </div>
          <p className="text-primary-600">You don't have permission to access this page.</p>
        </div>
      </PageLayout>
    );
  }

  const generateMemberId = () => {
    const prefix = 'PIER';
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}${randomDigits}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerateMemberId = () => {
    setFormData(prev => ({ ...prev, memberId: generateMemberId() }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      // Call the Supabase Edge Function to create the member
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-member`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          membershipLevel: formData.membershipLevel,
          memberId: formData.memberId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create member');
      }

      // Add to created members list
      const newMember: CreatedMember = result.member;
      setCreatedMembers(prev => [newMember, ...prev]);
      setSubmitSuccess(`Member ${formData.firstName} ${formData.lastName} created successfully!`);
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        membershipLevel: 'Standard',
        memberId: ''
      });

    } catch (error) {
      console.error('Error creating member:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to create member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <div className="min-h-[40vh] bg-primary-950 flex items-center">
        <div className="container-custom py-12 text-white">
          <div className="flex items-center mb-4">
            <UserPlus className="mr-3" size={32} />
            <h1 className="text-4xl md:text-5xl font-display font-medium">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-lg text-primary-200 max-w-2xl">
            Create new member accounts and manage membership details.
          </p>
        </div>
      </div>

      <div className="container-custom py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Create Member Form */}
          <div>
            <h2 className="text-2xl font-display font-medium mb-6">Create New Member</h2>
            
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md mb-6">
                {submitError}
              </div>
            )}

            {submitSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-600 p-4 rounded-md mb-6 flex items-center">
                <Check className="mr-2" size={20} />
                {submitSuccess}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-primary-700 mb-1">
                    First Name *
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="input w-full"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-primary-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="input w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-primary-700 mb-1">
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-primary-700 mb-1">
                  Initial Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="input w-full"
                  required
                  minLength={6}
                />
                <p className="text-xs text-primary-500 mt-1">Minimum 6 characters</p>
              </div>

              <div>
                <label htmlFor="membershipLevel" className="block text-sm font-medium text-primary-700 mb-1">
                  Membership Level *
                </label>
                <select
                  id="membershipLevel"
                  name="membershipLevel"
                  value={formData.membershipLevel}
                  onChange={handleInputChange}
                  className="input w-full"
                  required
                >
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                  <option value="Executive">Executive</option>
                  <option value="Founding Member">Founding Member</option>
                </select>
              </div>

              <div>
                <label htmlFor="memberId" className="block text-sm font-medium text-primary-700 mb-1">
                  Member ID *
                </label>
                <div className="flex gap-2">
                  <input
                    id="memberId"
                    name="memberId"
                    type="text"
                    value={formData.memberId}
                    onChange={handleInputChange}
                    className="input flex-1"
                    required
                    placeholder="PIER12345"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateMemberId}
                  >
                    Generate
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                isLoading={isSubmitting}
              >
                Create Member Account
              </Button>
            </form>
          </div>

          {/* Recently Created Members */}
          <div>
            <h2 className="text-2xl font-display font-medium mb-6">Recently Created Members</h2>
            
            {createdMembers.length === 0 ? (
              <div className="bg-primary-50 rounded-lg p-6 text-center">
                <p className="text-primary-600">No members created yet in this session.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {createdMembers.map((member) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-primary-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">
                        {member.firstName} {member.lastName}
                      </h3>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Created
                      </span>
                    </div>
                    <div className="text-sm text-primary-600 space-y-1">
                      <p><strong>Email:</strong> {member.email}</p>
                      <p><strong>Member ID:</strong> {member.memberId}</p>
                      <p><strong>Level:</strong> {member.membershipLevel}</p>
                      <p><strong>Created:</strong> {new Date(member.createdAt).toLocaleString()}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default AdminPage;