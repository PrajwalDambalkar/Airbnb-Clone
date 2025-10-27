import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, MapPin, Clock, CheckCircle, XCircle, AlertCircle, Sparkles } from 'lucide-react';
import bookingService, { type Booking } from '../services/bookingService';
import { useDarkMode } from '../App';
import AIAgentSidebar from '../components/AIAgentSidebar';

type BookingStatus = 'all' | 'PENDING' | 'ACCEPTED' | 'CANCELLED' | 'REJECTED';

export default function Bookings() {
  const { isDark } = useDarkMode();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<BookingStatus>('all');
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  
  // AI Agent state
  const [agentOpen, setAgentOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [activeTab, bookings]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getBookings();
      console.log('📋 Bookings:', response.data);
      setBookings(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    if (activeTab === 'all') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter(b => b.status === activeTab));
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      setCancellingId(bookingId);
      await bookingService.updateBookingStatus(bookingId, 'CANCELLED');
      // Refresh bookings
      await fetchBookings();
    } catch (err: any) {
      console.error('Error cancelling booking:', err);
      alert(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  const handleOpenAgent = (booking: Booking) => {
    setSelectedBooking(booking);
    setAgentOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock size={20} className="text-yellow-500" />;
      case 'ACCEPTED':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'CANCELLED':
      case 'REJECTED':
        return <XCircle size={20} className="text-red-500" />;
      default:
        return <AlertCircle size={20} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return isDark ? 'bg-yellow-900/30 text-yellow-400 border-yellow-500' : 'bg-yellow-50 text-yellow-700 border-yellow-300';
      case 'ACCEPTED':
        return isDark ? 'bg-green-900/30 text-green-400 border-green-500' : 'bg-green-50 text-green-700 border-green-300';
      case 'CANCELLED':
      case 'REJECTED':
        return isDark ? 'bg-red-900/30 text-red-400 border-red-500' : 'bg-red-50 text-red-700 border-red-300';
      default:
        return isDark ? 'bg-gray-800 text-gray-400 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const tabs: { key: BookingStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'ACCEPTED', label: 'Accepted' },
    { key: 'CANCELLED', label: 'Cancelled' },
  ];

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-950' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FF385C] mx-auto"></div>
          <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-950' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-4`}>{error}</p>
          <button
            onClick={fetchBookings}
            className="px-6 py-3 bg-[#FF385C] text-white rounded-lg hover:bg-[#E31C5F] transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-950' : 'bg-gray-50'} transition-colors`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            My Bookings
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            View and manage your property reservations
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-gray-700">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === tab.key
                    ? isDark 
                      ? 'text-[#FF385C] border-b-2 border-[#FF385C]' 
                      : 'text-[#FF385C] border-b-2 border-[#FF385C]'
                    : isDark
                      ? 'text-gray-400 hover:text-gray-300'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
                {tab.key !== 'all' && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.key
                      ? 'bg-[#FF385C] text-white'
                      : isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {bookings.filter(b => b.status === tab.key).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <Calendar size={64} className="mx-auto mb-4 opacity-50" />
            <p className="text-xl mb-2">No bookings found</p>
            <p className="mb-4">
              {activeTab === 'all' 
                ? "You haven't made any bookings yet"
                : `You don't have any ${activeTab.toLowerCase()} bookings`
              }
            </p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-[#FF385C] text-white rounded-lg hover:bg-[#E31C5F] transition"
            >
              Browse Properties
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredBookings.map(booking => {
              const images = Array.isArray(booking.images) ? booking.images : [];
              const mainImage = images[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9';
              
              return (
                <div
                  key={booking.id}
                  className={`rounded-2xl overflow-hidden ${
                    isDark ? 'bg-gray-900' : 'bg-white'
                  } shadow-lg hover:shadow-xl transition-shadow`}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="md:w-1/3">
                      <img
                        src={mainImage}
                        alt={booking.property_name}
                        className="w-full h-full object-cover min-h-[200px]"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9';
                        }}
                      />
                    </div>

                    {/* Details */}
                    <div className="md:w-2/3 p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {booking.property_name}
                          </h3>
                          <div className={`flex items-center gap-2 mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            <MapPin size={16} />
                            <span>{booking.city}, {booking.state}</span>
                          </div>
                        </div>
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          <span className="font-semibold capitalize">{booking.status.toLowerCase()}</span>
                        </div>
                      </div>

                      <div className={`grid grid-cols-2 gap-4 mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar size={16} className="text-[#FF385C]" />
                            <span className="font-semibold">Check-in</span>
                          </div>
                          <p>{formatDate(booking.check_in)}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar size={16} className="text-[#FF385C]" />
                            <span className="font-semibold">Check-out</span>
                          </div>
                          <p>{formatDate(booking.check_out)}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Users size={16} className="text-[#FF385C]" />
                            <span className="font-semibold">Guests</span>
                          </div>
                          <p>{booking.number_of_guests}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">Total Price</span>
                          </div>
                          <p className="text-xl font-bold text-[#FF385C]">
                            ${parseFloat(booking.total_price).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <p>Booked on {formatDate(booking.created_at)}</p>
                        {booking.owner_name && (
                          <p>Owner: {booking.owner_name}</p>
                        )}
                      </div>

                      <div className="flex gap-3 flex-wrap">
                        <Link
                          to={`/property/${booking.property_id}`}
                          className={`px-4 py-2 rounded-lg transition ${
                            isDark
                              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          View Property
                        </Link>
                        
                        {(booking.status === 'ACCEPTED' || booking.status === 'PENDING') && (
                          <button
                            onClick={() => handleOpenAgent(booking)}
                            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                              isDark
                                ? 'bg-[#FF385C] text-white hover:bg-[#E31C5F]'
                                : 'bg-[#FF385C] text-white hover:bg-[#E31C5F]'
                            }`}
                          >
                            <Sparkles size={16} />
                            AI Travel Planner
                          </button>
                        )}
                        
                        {booking.status === 'PENDING' && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={cancellingId === booking.id}
                            className={`px-4 py-2 rounded-lg transition ${
                              cancellingId === booking.id
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-red-500 hover:bg-red-600'
                            } text-white`}
                          >
                            {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* AI Agent Sidebar */}
      <AIAgentSidebar
        isOpen={agentOpen}
        onClose={() => setAgentOpen(false)}
        bookingId={selectedBooking?.id || 0}
        bookingDetails={selectedBooking ? {
          property_name: selectedBooking.property_name,
          city: selectedBooking.city,
          state: selectedBooking.state,
          check_in: selectedBooking.check_in,
          check_out: selectedBooking.check_out,
          number_of_guests: selectedBooking.number_of_guests
        } : undefined}
      />
    </div>
  );
}
