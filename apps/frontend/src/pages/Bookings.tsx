import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, MapPin, Clock, CheckCircle, XCircle, AlertCircle, Sparkles } from 'lucide-react';
import bookingService, { type Booking } from '../services/bookingService';
import { useDarkMode } from '../App';
import AIAgentSidebar from '../components/AIAgentSidebar';
import { getImageUrl } from '../utils/imageUtils';

type BookingStatus = 'all' | 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED' | 'HISTORY';

export default function Bookings() {
  const { isDark } = useDarkMode();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<BookingStatus>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  
  // Cancellation modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  
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
      // Sort by priority: PENDING > ACCEPTED > CANCELLED > COMPLETED
      const statusPriority: Record<string, number> = {
        'PENDING': 1,
        'ACCEPTED': 2,
        'CANCELLED': 3,
        'COMPLETED': 4,
        'REJECTED': 3 // Same priority as CANCELLED
      };
      
      const sorted = [...bookings].sort((a, b) => {
        const priorityA = statusPriority[a.status] || 999;
        const priorityB = statusPriority[b.status] || 999;
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        
        // If same priority, sort by check-in date (upcoming first)
        return new Date(a.check_in).getTime() - new Date(b.check_in).getTime();
      });
      
      setFilteredBookings(sorted);
    } else if (activeTab === 'HISTORY') {
      // Show completed bookings only
      setFilteredBookings(bookings.filter(b => b.status === 'COMPLETED'));
    } else {
      setFilteredBookings(bookings.filter(b => b.status === activeTab));
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    setBookingToCancel(bookingId);
    setShowCancelModal(true);
  };

  const confirmCancellation = async () => {
    if (!bookingToCancel) return;

    try {
      setCancellingId(bookingToCancel);
      await bookingService.cancelBooking(bookingToCancel, cancellationReason);
      // Refresh bookings
      await fetchBookings();
      // Close modal and reset
      setShowCancelModal(false);
      setBookingToCancel(null);
      setCancellationReason('');
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
      case 'COMPLETED':
        return <CheckCircle size={20} className="text-blue-500" />;
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
      case 'COMPLETED':
        return isDark ? 'bg-blue-900/30 text-blue-400 border-blue-500' : 'bg-blue-50 text-blue-700 border-blue-300';
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
    { key: 'HISTORY', label: 'History' },
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
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
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
                    {tab.key === 'HISTORY' 
                      ? bookings.filter(b => b.status === 'COMPLETED').length
                      : bookings.filter(b => b.status === tab.key).length
                    }
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
            <p className="mb-2 text-xl">No bookings found</p>
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
              const mainImage = images.length > 0 ? getImageUrl(images[0]) : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9';
              
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
                    <div className="p-6 md:w-2/3">
                      <div className="flex items-start justify-between mb-4">
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

                      {/* Cancellation Info */}
                      {booking.status === 'CANCELLED' && booking.cancellation_reason && (
                        <div className={`mb-4 p-4 rounded-lg border ${
                          isDark 
                            ? 'bg-red-900/20 border-red-800 text-red-400' 
                            : 'bg-red-50 border-red-200 text-red-700'
                        }`}>
                          <p className="mb-1 font-semibold">
                            Cancellation Reason {booking.cancelled_by && `(by ${booking.cancelled_by})`}:
                          </p>
                          <p>{booking.cancellation_reason}</p>
                          {booking.cancelled_at && (
                            <p className="mt-1 text-sm opacity-75">
                              Cancelled on {formatDate(booking.cancelled_at)}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3">
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
        bookingId={selectedBooking?.id}
        bookingDetails={selectedBooking ? {
          property_name: selectedBooking.property_name || '',
          city: selectedBooking.city || '',
          state: selectedBooking.state || '',
          check_in: selectedBooking.check_in,
          check_out: selectedBooking.check_out,
          number_of_guests: selectedBooking.number_of_guests
        } : undefined}
      />

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className={`rounded-2xl max-w-md w-full p-6 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Cancel Booking
            </h3>
            
            <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Please provide a reason for cancellation (optional):
            </p>
            
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="E.g., Change of plans, found another property, etc."
              rows={4}
              className={`w-full px-4 py-3 rounded-lg border mb-4 ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-[#FF385C]`}
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setBookingToCancel(null);
                  setCancellationReason('');
                }}
                disabled={cancellingId !== null}
                className={`flex-1 px-4 py-3 rounded-lg transition ${
                  isDark
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Keep Booking
              </button>
              
              <button
                onClick={confirmCancellation}
                disabled={cancellingId !== null}
                className="flex-1 px-4 py-3 text-white transition bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancellingId ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
