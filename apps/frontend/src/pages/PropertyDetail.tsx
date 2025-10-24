import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Users, Bed, Bath, Star, Wifi, Car, Utensils, Wind, Waves, Mountain, Zap, Home as HomeIcon, Calendar, CheckCircle } from 'lucide-react';
import { propertyService } from '../services/propertyService';
import bookingService from '../services/bookingService';
import { useDarkMode } from '../App';
import type { Property } from '../types/property';
import { getImageUrl } from '../utils/imageUtils';

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark } = useDarkMode();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  
  // Booking state
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guests, setGuests] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await propertyService.getPropertyById(id);
        console.log('🏠 Property details:', response.data);
        setProperty(response.data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching property:', err);
        setError(err.message || 'Failed to load property details');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  // Calculate number of nights
  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    if (!property) return 0;
    const nights = calculateNights();
    const pricePerNight = parseFloat(property.price_per_night);
    const cleaningFee = parseFloat(property.cleaning_fee || '0');
    const serviceFee = parseFloat(property.service_fee || '0');
    return (nights * pricePerNight) + cleaningFee + serviceFee;
  };

  // Handle booking reservation
  const handleReserve = async () => {
    if (!property || !id) return;

    // Validate dates
    if (!checkInDate || !checkOutDate) {
      setBookingError('Please select check-in and check-out dates');
      return;
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      setBookingError('Check-in date cannot be in the past');
      return;
    }

    if (checkOut <= checkIn) {
      setBookingError('Check-out date must be after check-in date');
      return;
    }

    if (guests < 1 || guests > property.max_guests) {
      setBookingError(`Number of guests must be between 1 and ${property.max_guests}`);
      return;
    }

    try {
      setBookingLoading(true);
      setBookingError(null);

      const totalPrice = calculateTotalPrice();

      await bookingService.createBooking({
        property_id: parseInt(id),
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        guests: guests,
        total_price: totalPrice
      });

      setBookingSuccess(true);
      
      // Show success for 3 seconds then redirect
      setTimeout(() => {
        navigate('/bookings');
      }, 3000);
    } catch (err: any) {
      console.error('Booking error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to create booking. Please try again.';
      
      // If unauthorized, redirect to login
      if (err.response?.status === 401 || errorMessage.includes('Unauthorized') || errorMessage.includes('login')) {
        setBookingError('Please login to make a booking');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setBookingError(errorMessage);
      }
    } finally {
      setBookingLoading(false);
    }
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get minimum checkout date (day after check-in)
  const getMinCheckoutDate = () => {
    if (!checkInDate) return getMinDate();
    const checkIn = new Date(checkInDate);
    checkIn.setDate(checkIn.getDate() + 1);
    return checkIn.toISOString().split('T')[0];
  };

  const getAmenityIcon = (amenity: string) => {
    const icons: Record<string, any> = {
      wifi: Wifi,
      parking: Car,
      kitchen: Utensils,
      air_conditioning: Wind,
      pool: Waves,
      beach_access: Waves,
      mountain_view: Mountain,
      gym: Zap,
      hot_tub: Waves,
    };
    
    const IconComponent = icons[amenity.toLowerCase()] || HomeIcon;
    return <IconComponent size={20} />;
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-950' : 'bg-white'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FF385C] mx-auto"></div>
          <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-950' : 'bg-white'} flex items-center justify-center`}>
        <div className="text-center">
          <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
            {error || 'Property not found'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-[#FF385C] text-white rounded-lg hover:bg-[#E31C5F] transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const images = Array.isArray(property.images) ? property.images : [];
  const amenities = Array.isArray(property.amenities) ? property.amenities : [];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-950' : 'bg-gray-50'} transition-colors`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className={`flex items-center gap-2 mb-6 px-4 py-2 rounded-lg transition-colors ${isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <ArrowLeft size={20} />
          <span>Back to properties</span>
        </button>

        {/* Property Title */}
        <div className="mb-6">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {property.property_name}
          </h1>
          <div className={`flex items-center gap-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="flex items-center gap-1">
              <Star size={18} className="text-[#FF385C] fill-[#FF385C]" />
              <span className="font-semibold">{property.rating?.toFixed(2) || '4.50'}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin size={18} />
              <span>{property.city}, {property.state}</span>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Main Image */}
            <div className="md:col-span-2 md:row-span-2">
              <img
                src={getImageUrl(images[selectedImage] || images[0])}
                alt={property.property_name}
                className="w-full h-[500px] object-cover rounded-2xl"
              />
            </div>
            
            {/* Thumbnail Grid */}
            <div className="md:col-span-2 flex gap-4 overflow-x-auto">
              {images.slice(0, 5).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition ${
                    selectedImage === idx 
                      ? 'border-[#FF385C]' 
                      : isDark ? 'border-gray-700' : 'border-gray-300'
                  }`}
                >
                  <img
                    src={getImageUrl(img)}
                    alt={`${property.property_name} ${idx + 1}`}
                    className="w-24 h-24 object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Property Type and Basics */}
            <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-lg`}>
              <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1)}
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div className={`flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Users size={24} />
                  <div>
                    <p className="text-sm opacity-70">Guests</p>
                    <p className="font-semibold">{property.max_guests}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Bed size={24} />
                  <div>
                    <p className="text-sm opacity-70">Bedrooms</p>
                    <p className="font-semibold">{property.bedrooms}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Bath size={24} />
                  <div>
                    <p className="text-sm opacity-70">Bathrooms</p>
                    <p className="font-semibold">{property.bathrooms}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-lg`}>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                About this place
              </h2>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                {property.description}
              </p>
            </div>

            {/* Amenities */}
            <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-lg`}>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                What this place offers
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {amenities.map((amenity, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    {getAmenityIcon(amenity)}
                    <span className="capitalize">{amenity.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-lg`}>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Location
              </h2>
              <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} space-y-2`}>
                <p>{property.address}</p>
                <p>{property.city}, {property.state} {property.zipcode}</p>
                <p>{property.country}</p>
              </div>
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-lg sticky top-8`}>
              {bookingSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
                  <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Booking Confirmed!
                  </h3>
                  <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Your booking request has been sent to the owner.
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    Redirecting to your bookings...
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        ${property.price_per_night}
                      </span>
                      <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>/ night</span>
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="mb-6">
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
                      property.available 
                        ? isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700'
                        : isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-700'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${property.available ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="font-semibold">
                        {property.available ? 'Available' : 'Not Available'}
                      </span>
                    </div>
                  </div>

                  {property.available && (
                    <>
                      {/* Date Selection */}
                      <div className="mb-6 space-y-4">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            <Calendar size={16} className="inline mr-1" />
                            Check-in
                          </label>
                          <input
                            type="date"
                            value={checkInDate}
                            onChange={(e) => setCheckInDate(e.target.value)}
                            min={getMinDate()}
                            className={`w-full px-4 py-2 rounded-lg border ${
                              isDark 
                                ? 'bg-gray-800 border-gray-700 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            } focus:ring-2 focus:ring-[#FF385C] focus:border-transparent`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            <Calendar size={16} className="inline mr-1" />
                            Check-out
                          </label>
                          <input
                            type="date"
                            value={checkOutDate}
                            onChange={(e) => setCheckOutDate(e.target.value)}
                            min={getMinCheckoutDate()}
                            disabled={!checkInDate}
                            className={`w-full px-4 py-2 rounded-lg border ${
                              isDark 
                                ? 'bg-gray-800 border-gray-700 text-white disabled:bg-gray-900 disabled:text-gray-600' 
                                : 'bg-white border-gray-300 text-gray-900 disabled:bg-gray-100 disabled:text-gray-400'
                            } focus:ring-2 focus:ring-[#FF385C] focus:border-transparent`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            <Users size={16} className="inline mr-1" />
                            Guests
                          </label>
                          <input
                            type="number"
                            value={guests}
                            onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                            min={1}
                            max={property.max_guests}
                            className={`w-full px-4 py-2 rounded-lg border ${
                              isDark 
                                ? 'bg-gray-800 border-gray-700 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            } focus:ring-2 focus:ring-[#FF385C] focus:border-transparent`}
                          />
                          <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            Maximum {property.max_guests} guests
                          </p>
                        </div>
                      </div>

                      {/* Pricing Breakdown */}
                      {checkInDate && checkOutDate && calculateNights() > 0 && (
                        <div className={`space-y-3 mb-6 pb-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                          <div className="flex justify-between">
                            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                              ${property.price_per_night} x {calculateNights()} nights
                            </span>
                            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                              ${(parseFloat(property.price_per_night) * calculateNights()).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Cleaning fee</span>
                            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>${property.cleaning_fee}</span>
                          </div>
                          {property.service_fee && (
                            <div className="flex justify-between">
                              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Service fee</span>
                              <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>${property.service_fee}</span>
                            </div>
                          )}
                          <div className={`flex justify-between pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Total</span>
                            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              ${calculateTotalPrice().toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Success Message */}
                      {bookingSuccess && (
                        <div className="mb-4 p-4 rounded-lg bg-green-900/30 border border-green-500">
                          <div className="flex items-center gap-3 mb-2">
                            <CheckCircle size={24} className="text-green-400" />
                            <p className="text-green-400 font-semibold">Booking Confirmed!</p>
                          </div>
                          <p className="text-green-300 text-sm">
                            Your reservation has been created. Redirecting to bookings page...
                          </p>
                        </div>
                      )}

                      {/* Error Message */}
                      {bookingError && (
                        <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-500">
                          <p className="text-red-400 text-sm">{bookingError}</p>
                        </div>
                      )}

                      {/* Reserve Button */}
                      <button
                        onClick={handleReserve}
                        disabled={bookingLoading || bookingSuccess || !checkInDate || !checkOutDate}
                        className={`w-full py-4 rounded-lg font-semibold transition ${
                          bookingLoading || bookingSuccess || !checkInDate || !checkOutDate
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-[#FF385C] text-white hover:bg-[#E31C5F]'
                        }`}
                      >
                        {bookingLoading ? 'Processing...' : bookingSuccess ? 'Booking Confirmed ✓' : 'Reserve'}
                      </button>

                      <p className={`text-center text-sm mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        You won't be charged yet
                      </p>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
