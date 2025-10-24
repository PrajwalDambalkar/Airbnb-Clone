import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Users, Bed, Bath, Star, Wifi, Car, Utensils, Wind, Waves, Mountain, Zap, Home as HomeIcon } from 'lucide-react';
import { propertyService } from '../services/propertyService';
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

              {/* Pricing Breakdown */}
              <div className={`space-y-3 mb-6 pb-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
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
              </div>

              {/* Reserve Button */}
              <button
                disabled={!property.available}
                className={`w-full py-4 rounded-lg font-semibold transition ${
                  property.available
                    ? 'bg-[#FF385C] text-white hover:bg-[#E31C5F]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {property.available ? 'Reserve' : 'Not Available'}
              </button>

              <p className={`text-center text-sm mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                You won't be charged yet
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
