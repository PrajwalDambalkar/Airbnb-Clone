// src/pages/OwnerBookings.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../App';
import { 
  Calendar, 
  DollarSign, 
  Users, 
  Search, 
  Check,
  X,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Home,
  ChevronDown,
  Settings,
  LogOut,
  Heart,
  Plus
} from 'lucide-react';
import * as ownerBookingService from '../services/ownerBookingService';
import type { OwnerBooking, BookingStats } from '../services/ownerBookingService';

export default function OwnerBookings() {
  const { user, logout } = useAuth();
  const { isDark } = useDarkMode();
  const navigate = useNavigate();
  
  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [favCount, setFavCount] = useState<number>(0);

  // Fetch bookings and stats
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const filters: any = {};
      if (activeTab !== 'all') {
        filters.status = activeTab.toUpperCase();
      }
      if (searchTerm) {
        filters.search = searchTerm;
      }
      
      const [bookingsData, statsData] = await Promise.all([
        ownerBookingService.getOwnerBookings(filters),
        ownerBookingService.getOwnerBookingStats()
      ]);
      
      setBookings(bookingsData.data || []);
      setStats(statsData.data);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role !== 'owner') {
      navigate('/');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  // Load favourites count
  useEffect(() => {
    const loadFavs = () => {
      try {
        const raw = localStorage.getItem('favorites');
        const arr = raw ? JSON.parse(raw) : [];
        setFavCount(Array.isArray(arr) ? arr.length : 0);
      } catch (e) {
        setFavCount(0);
      }
    };
    loadFavs();
  }, []);

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

  const handleApprove = async (id: number) => {
    try {
      await ownerBookingService.approveBooking(id);
      fetchData(); // Refresh data
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve booking');
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Reason for rejection (optional):');
    try {
      await ownerBookingService.rejectBooking(id, reason || undefined);
      fetchData(); // Refresh data
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject booking');
    }
  };

  const handleCancel = async (id: number) => {
    const reason = prompt('Reason for cancellation (required):');
    if (!reason) {
      alert('Cancellation reason is required');
      return;
    }
    try {
      await ownerBookingService.cancelBooking(id, reason);
      fetchData(); // Refresh data
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock size={16} />;
      case 'ACCEPTED':
        return <CheckCircle size={16} />;
      case 'CANCELLED':
        return <XCircle size={16} />;
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-[10001] overflow-visible shadow-md ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Link to="/owner/dashboard" className="text-xl sm:text-2xl font-bold text-[#FF385C]">
                airbnb
              </Link>
              <span className={`hidden sm:inline-block px-2 py-1 text-xs font-medium rounded ${isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'}`}>
                Owner Portal
              </span>
            </div>

            <nav className="items-center hidden space-x-4 md:flex lg:space-x-6">
              <Link
                to="/owner/properties/new"
                className={`flex items-center space-x-2 text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}
              >
                <Plus className="w-4 h-4" />
                <span>Add Property</span>
              </Link>
              
              <div className={`h-6 w-px ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
              
              <Link
                to="/"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark ? 'bg-[#FF385C] text-white hover:bg-[#E31C5F]' : 'bg-[#FF385C] text-white hover:bg-[#E31C5F]'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Browse Properties</span>
              </Link>
              
              {/* Profile Dropdown */}
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

                {showProfileMenu && (
                  <div className={`absolute right-0 mt-2 w-56 rounded-lg shadow-lg border overflow-hidden z-[10000] ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.name}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email}</p>
                    </div>
                    
                    <div className="py-1">
                      <Link
                        to="/favorites"
                        onClick={() => setShowProfileMenu(false)}
                        className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${isDark ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        <Heart size={16} className="text-[#FF385C]" />
                        <span>Favourites</span>
                        {favCount > 0 && (
                          <span className="ml-auto inline-block bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{favCount}</span>
                        )}
                      </Link>
                      
                      <Link
                        to="/owner/bookings"
                        onClick={() => setShowProfileMenu(false)}
                        className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${isDark ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        <Calendar size={16} className="text-[#FF385C]" />
                        <span>Bookings</span>
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Bookings Management
          </h1>
          <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage reservations for your properties
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
            <div className={`p-6 rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Pending Bookings
                  </p>
                  <p className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {stats.pending_count}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full dark:bg-yellow-900">
                  <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Confirmed Bookings
                  </p>
                  <p className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {stats.confirmed_count}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full dark:bg-green-900">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-300" />
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total Revenue
                  </p>
                  <p className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    ${(Number(stats.total_revenue) || 0).toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full dark:bg-green-900">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-300" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className={`p-4 rounded-lg shadow mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            {/* Status Tabs */}
            <div className="flex flex-wrap gap-2">
              {['all', 'pending', 'accepted', 'cancelled'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab
                      ? 'bg-[#FF385C] text-white'
                      : isDark
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Search guest, property..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                className={`pl-10 pr-4 py-2 rounded-lg border text-sm ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#FF385C] border-t-transparent"></div>
            <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading bookings...</p>
          </div>
        ) : error ? (
          <div className={`text-center py-12 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            {error}
          </div>
        ) : bookings.length === 0 ? (
          <div className={`text-center py-12 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow`}>
            <Calendar className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              No bookings found
            </p>
            <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {activeTab === 'all' 
                ? 'Your bookings will appear here'
                : `No ${activeTab} bookings at the moment`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className={`p-6 rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              >
                <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                  {/* Booking Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Home size={18} className="text-[#FF385C]" />
                      <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {booking.property_name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        {booking.status}
                      </span>
                    </div>
                    
                    <div className={`flex flex-wrap items-center gap-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <div className="flex items-center gap-1">
                        <Users size={14} />
                        <span>{booking.guest_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>
                          {formatDate(booking.check_in)} → {formatDate(booking.check_out)}
                        </span>
                        <span className="ml-1">({calculateNights(booking.check_in, booking.check_out)} nights)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={14} />
                        <span>{booking.number_of_guests} guests</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign size={14} />
                        <span className="font-semibold">${(Number(booking.total_price) || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {booking.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleApprove(booking.id)}
                          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
                        >
                          <Check size={16} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(booking.id)}
                          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700"
                        >
                          <X size={16} />
                          Reject
                        </button>
                      </>
                    )}
                    {booking.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isDark
                            ? 'bg-red-900 text-red-300 hover:bg-red-800'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    )}
                    <Link
                      to={`/property/${booking.property_id}`}
                      className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isDark
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Eye size={16} />
                      View Property
                    </Link>
                  </div>
                </div>

                {/* Cancellation Info */}
                {booking.status === 'CANCELLED' && booking.cancellation_reason && (
                  <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <span className="font-semibold">Cancellation Reason:</span> {booking.cancellation_reason}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
