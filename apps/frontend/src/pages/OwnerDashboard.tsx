// src/pages/OwnerDashboard.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../App';
import api from '../services/api';
import { Home, Plus, Calendar, DollarSign, Eye, Edit, Trash2, ChevronDown, Settings, LogOut } from 'lucide-react';
import { getFirstImage } from '../utils/imageUtils';
import * as ownerBookingService from '../services/ownerBookingService';
import type { BookingStats } from '../services/ownerBookingService';

interface Property {
  id: number;
  property_name: string;
  property_type: string;
  description: string;
  city: string;
  state: string;
  country: string;
  price_per_night: number;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  images: string[];
  amenities: string[];
  available: boolean;
  created_at: string;
}

export default function OwnerDashboard() {
  const { user, logout } = useAuth();
  const { isDark } = useDarkMode();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [bookingStats, setBookingStats] = useState<BookingStats | null>(null);

  const fetchMyProperties = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/properties/my/properties');
      setProperties(data.data || []);
    } catch (err: any) {
      console.error('Error fetching properties:', err);
      setError(err.response?.data?.message || 'Failed to load your properties');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingStats = async () => {
    try {
      const response = await ownerBookingService.getOwnerBookingStats();
      setBookingStats(response.data);
    } catch (err) {
      console.error('Error fetching booking stats:', err);
    }
  };

  useEffect(() => {
    // Redirect if not owner
    if (user && user.role !== 'owner') {
      navigate('/');
      return;
    }

    fetchMyProperties();
    fetchBookingStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.profile-dropdown')) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showProfileMenu]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header/Navigation */}
      <header className={`sticky top-0 z-[10001] overflow-visible shadow-md ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <Link to="/owner/dashboard" className="text-xl sm:text-2xl font-bold text-[#FF385C]">
                airbnb
              </Link>
              <span className={`hidden sm:inline-block px-2 py-1 text-xs font-medium rounded ${isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'}`}>
                Owner Portal
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="items-center hidden space-x-4 md:flex lg:space-x-6">
              <Link
                to="/owner/properties/new"
                className={`flex items-center space-x-2 text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}
              >
                <Plus className="w-4 h-4" />
                <span>Add Property</span>
              </Link>
              
              <Link
                to="/owner/bookings"
                className={`flex items-center space-x-2 text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}
              >
                <Calendar className="w-4 h-4" />
                <span>Manage Bookings</span>
              </Link>
              
              {/* Divider */}
              <div className={`h-6 w-px ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
              
              {/* Browse Properties Link - styled like Manage Properties */}
              <Link
                to="/"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark ? 'bg-[#FF385C] text-white hover:bg-[#E31C5F]' : 'bg-[#FF385C] text-white hover:bg-[#E31C5F]'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Browse Properties</span>
              </Link>
              
              {/* User Menu - Profile Dropdown */}
              <div className="relative profile-dropdown z-[10000]">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600' : 'bg-white hover:bg-gray-50 border border-gray-300'}`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF385C] to-[#E31C5F] flex items-center justify-center text-white font-semibold text-sm">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown size={16} className={`transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <div className={`absolute right-0 mt-2 w-56 rounded-lg shadow-lg border overflow-hidden z-[10000] ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.name}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email}</p>
                    </div>
                    
                    <div className="py-1">
                      <Link
                        to="/owner/bookings"
                        onClick={() => setShowProfileMenu(false)}
                        className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${isDark ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        <Calendar size={16} className="text-[#FF385C]" />
                        <span>Manage Bookings</span>
                      </Link>
                      
                      <button
                        disabled
                        className={`flex items-center gap-3 px-4 py-2 text-sm w-full text-left cursor-not-allowed opacity-50 ${isDark ? 'text-gray-400' : 'text-gray-400'}`}
                      >
                        <Settings size={16} />
                        <span>Edit Profile</span>
                        <span className="ml-auto text-xs">(Soon)</span>
                      </button>
                    </div>

                    <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          handleLogout();
                        }}
                        className={`flex items-center gap-3 px-4 py-2 text-sm w-full text-left transition-colors ${isDark ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50'}`}
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* Mobile Navigation */}
            <div className="flex items-center space-x-2 md:hidden">
              <Link
                to="/"
                className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-[#FF385C] text-white hover:bg-[#E31C5F]' : 'bg-[#FF385C] text-white hover:bg-[#E31C5F]'}`}
                title="Browse Properties"
              >
                <Eye className="w-5 h-5" />
              </Link>
              <Link
                to="/owner/properties/new"
                className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
              >
                <Plus className="w-5 h-5" />
              </Link>
              <button
                onClick={handleLogout}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${isDark ? 'bg-red-900 text-red-300 hover:bg-red-800' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Welcome back, {user?.name}! 👋
          </h1>
          <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage your properties and bookings from your dashboard
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
          {/* Total Properties */}
          <div className={`p-6 rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Properties
                </p>
                <p className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {properties.length}
                </p>
              </div>
              <div className={`p-3 rounded-full ${isDark ? 'bg-blue-900' : 'bg-blue-100'}`}>
                <Home className={`w-6 h-6 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
              </div>
            </div>
          </div>

          {/* Pending Bookings */}
          <div className={`p-6 rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Pending Bookings
                </p>
                <p className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {bookingStats?.pending_count || 0}
                </p>
              </div>
              <div className={`p-3 rounded-full ${isDark ? 'bg-yellow-900' : 'bg-yellow-100'}`}>
                <Calendar className={`w-6 h-6 ${isDark ? 'text-yellow-300' : 'text-yellow-600'}`} />
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className={`p-6 rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Revenue
                </p>
                <p className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  ${(Number(bookingStats?.total_revenue) || 0).toFixed(2)}
                </p>
              </div>
              <div className={`p-3 rounded-full ${isDark ? 'bg-green-900' : 'bg-green-100'}`}>
                <DollarSign className={`w-6 h-6 ${isDark ? 'text-green-300' : 'text-green-600'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Properties Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Your Properties
            </h2>
            <Link
              to="/owner/properties/new"
              className="flex items-center px-4 py-2 space-x-2 text-sm font-medium text-white transition-colors bg-[#FF385C] rounded-lg hover:bg-[#E31C5F]"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Property</span>
            </Link>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="py-12 text-center">
              <div className={`inline-block w-8 h-8 border-4 border-t-[#FF385C] rounded-full animate-spin ${isDark ? 'border-gray-700' : 'border-gray-300'}`}></div>
              <p className={`mt-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Loading your properties...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className={`p-4 rounded-lg ${isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'} border`}>
              <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && properties.length === 0 && (
            <div className={`py-12 text-center rounded-lg border-2 border-dashed ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50'}`}>
              <Home className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                No properties yet
              </h3>
              <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Get started by adding your first property
              </p>
              <Link
                to="/owner/properties/new"
                className="inline-flex items-center px-4 py-2 mt-6 space-x-2 text-sm font-medium text-white bg-[#FF385C] rounded-lg hover:bg-[#E31C5F] transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Property</span>
              </Link>
            </div>
          )}

          {/* Properties Grid */}
          {!loading && !error && properties.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className={`overflow-hidden rounded-lg shadow-md transition-shadow hover:shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                >
                  {/* Property Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={getFirstImage(property.images)}
                      alt={property.property_name}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        // Prevent infinite loop by checking if already using fallback
                        if (!target.dataset.errorHandled) {
                          target.dataset.errorHandled = 'true';
                          target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                        }
                      }}
                    />
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          property.available
                            ? isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                            : isDark ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {property.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>

                  {/* Property Details */}
                  <div className="p-4">
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {property.property_name}
                    </h3>
                    <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {property.city}, {property.state}
                    </p>
                    <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {property.bedrooms} bed • {property.bathrooms} bath • {property.max_guests} guests
                    </p>
                    <p className={`mt-3 text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      ${property.price_per_night}
                      <span className={`text-sm font-normal ${isDark ? 'text-gray-400' : 'text-gray-600'}`}> / night</span>
                    </p>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => navigate(`/property/${property.id}`)}
                        className={`flex items-center justify-center flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => navigate(`/owner/properties/${property.id}/edit`)}
                        className={`flex items-center justify-center flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isDark ? 'bg-blue-900 text-blue-300 hover:bg-blue-800' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this property?')) {
                            // TODO: Implement delete
                            alert('Delete functionality coming soon!');
                          }
                        }}
                        className={`flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isDark ? 'bg-red-900 text-red-300 hover:bg-red-800' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
