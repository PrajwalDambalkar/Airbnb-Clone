// src/pages/EditProfile.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../App';
import { Camera, Save, X, User, Mail, Phone, MapPin, Globe, Languages, Users } from 'lucide-react';
import { profileAPI } from '../services/profileService';

interface ProfileData {
  name: string;
  email: string;
  phone_number: string;
  about_me: string;
  city: string;
  state: string;
  country: string;
  languages: string;
  gender: string;
  profile_picture?: string;
}

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 
  'Spain', 'Italy', 'Japan', 'China', 'India', 'Brazil', 'Mexico', 'Argentina',
  'South Korea', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Finland',
  'Switzerland', 'Austria', 'Belgium', 'Portugal', 'Greece', 'Ireland',
  'New Zealand', 'Singapore', 'Thailand', 'Malaysia', 'Indonesia', 'Philippines',
  'Vietnam', 'South Africa', 'Egypt', 'Turkey', 'Russia', 'Poland', 'Czech Republic',
  'Hungary', 'Romania', 'Bulgaria', 'Croatia', 'Ukraine', 'Israel', 'UAE',
  'Saudi Arabia', 'Chile', 'Colombia', 'Peru', 'Costa Rica', 'Other'
].sort();

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' }
];

export default function EditProfile() {
  const { user, refreshUser } = useAuth();
  const { isDark } = useDarkMode();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewImage, setPreviewImage] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  // Phone number validation function
  const validatePhone = (phone: string): boolean => {
    // If phone is empty, it's valid (optional field)
    if (!phone.trim()) {
      setPhoneError('');
      return true;
    }
    
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    
    if (digitsOnly.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits');
      return false;
    }
    
    setPhoneError('');
    return true;
  };

  const [formData, setFormData] = useState<ProfileData>({
    name: '',
    email: '',
    phone_number: '',
    about_me: '',
    city: '',
    state: '',
    country: '',
    languages: '',
    gender: '',
    profile_picture: ''
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const profile = await profileAPI.getProfile();
        setFormData({
          name: profile.name || '',
          email: profile.email || '',
          phone_number: profile.phone_number || '',
          about_me: profile.about_me || '',
          city: profile.city || '',
          state: profile.state || '',
          country: profile.country || '',
          languages: profile.languages || '',
          gender: profile.gender || '',
          profile_picture: profile.profile_picture || ''
        });
        if (profile.profile_picture) {
          setPreviewImage(`http://localhost:5001${profile.profile_picture}`);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Real-time validation
    if (name === 'email') {
      validateEmail(value);
    } else if (name === 'phone_number') {
      validatePhone(value);
    }
    
    setError('');
    setSuccess('');
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    
    const isEmailValid = validateEmail(formData.email);
    const isPhoneValid = validatePhone(formData.phone_number);
    
    if (!isEmailValid || !isPhoneValid) {
      setError('Please fix the validation errors before submitting');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      data.append('phone_number', formData.phone_number);
      data.append('about_me', formData.about_me);
      data.append('city', formData.city);
      data.append('state', formData.state);
      data.append('country', formData.country);
      data.append('languages', formData.languages);
      data.append('gender', formData.gender);
      
      if (selectedFile) {
        data.append('profile_picture', selectedFile);
      }

      await profileAPI.updateProfile(data);
      await refreshUser(); // Refresh user data to update profile picture in header
      setSuccess('Profile updated successfully!');
      
      // Navigate with success message after 2 seconds
      setTimeout(() => {
        const redirectPath = user?.role === 'owner' ? '/owner/dashboard' : '/';
        navigate(redirectPath, { 
          state: { successMessage: 'Profile updated successfully!' }
        });
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-b-2 border-pink-500 rounded-full animate-spin"></div>
          <p className={`mt-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} py-8`}>
      {/* Fixed Success Toast */}
      {success && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[10002] animate-fade-in-down">
          <div className="px-6 py-4 text-white bg-green-500 rounded-lg shadow-xl flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">{success}</span>
          </div>
        </div>
      )}
      
      <div className="max-w-4xl px-4 mx-auto sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className={`mb-4 flex items-center gap-2 ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
          >
            <X size={20} />
            <span>Cancel</span>
          </button>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Edit Profile
          </h1>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Update your personal information and profile picture
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 space-y-6`}>
          {/* Error Message */}
          {error && (
            <div className="px-4 py-3 text-red-700 border border-red-200 rounded-lg bg-red-50">
              {error}
            </div>
          )}

          {/* Profile Picture */}
          <div className="flex flex-col items-center">
            <div className="relative">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Profile"
                  className="object-cover w-32 h-32 border-4 border-pink-500 rounded-full"
                />
              ) : (
                <div className={`w-32 h-32 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center`}>
                  <User size={48} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 text-white transition-colors bg-pink-500 rounded-full hover:bg-pink-600"
              >
                <Camera size={20} />
              </button>
              {previewImage && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-0 right-0 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Click camera icon to upload photo (max 5MB)
            </p>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Name */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                <User size={16} className="inline mr-2" />
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
                placeholder="Enter your full name"
              />
            </div>

            {/* Email */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                <Mail size={16} className="inline mr-2" />
                Email *
              </label>
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className={`w-full px-4 py-2 rounded-lg border ${
                  emailError
                    ? 'border-red-500 focus:ring-red-500'
                    : isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900'
                } ${isDark ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-white text-gray-900'} focus:ring-2 focus:border-transparent ${!emailError && 'focus:ring-pink-500'}`}
                placeholder="your.email@example.com"
              />
              {emailError && (
                <p className="mt-1 text-sm text-red-600">
                  {emailError}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                <Phone size={16} className="inline mr-2" />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 rounded-lg border ${
                  phoneError
                    ? 'border-red-500 focus:ring-red-500'
                    : isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900'
                } ${isDark ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-white text-gray-900'} focus:ring-2 focus:border-transparent ${!phoneError && 'focus:ring-pink-500'}`}
                placeholder="1234567890"
              />
              {phoneError ? (
                <p className="mt-1 text-sm text-red-600">
                  {phoneError}
                </p>
              ) : (
                <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Optional - Must be 10 digits if provided
                </p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                <Users size={16} className="inline mr-2" />
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
              >
                <option value="">Select gender</option>
                {GENDER_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* About Me */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              About Me
            </label>
            <textarea
              name="about_me"
              value={formData.about_me}
              onChange={handleInputChange}
              rows={4}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
              placeholder="Tell us about yourself..."
            />
          </div>

          {/* Location Information */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* City */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                <MapPin size={16} className="inline mr-2" />
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
                placeholder="City"
              />
            </div>

            {/* State */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                State (US)
              </label>
              <select
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
              >
                <option value="">Select state</option>
                {US_STATES.map(state => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            {/* Country */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                <Globe size={16} className="inline mr-2" />
                Country
              </label>
              <select
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
              >
                <option value="">Select country</option>
                {COUNTRIES.map(country => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Languages */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              <Languages size={16} className="inline mr-2" />
              Languages
            </label>
            <input
              type="text"
              name="languages"
              value={formData.languages}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
              placeholder="e.g., English, Spanish, French"
            />
            <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Separate multiple languages with commas
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className={`flex-1 flex items-center justify-center gap-2 bg-pink-500 text-white py-3 rounded-lg font-semibold hover:bg-pink-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors`}
            >
              <Save size={20} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className={`px-6 py-3 rounded-lg font-semibold ${
                isDark
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } transition-colors`}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
