// src/pages/EditProperty.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDarkMode } from '../App';
import api from '../services/api';
import { ArrowLeft, ArrowRight, Check, Upload, X, Trash2 } from 'lucide-react';

const PROPERTY_TYPES = ['apartment', 'house', 'condo', 'villa', 'cabin', 'cottage', 'loft', 'other'];
const AMENITIES_LIST = ['WiFi', 'Kitchen', 'Parking', 'Pool', 'Hot Tub', 'Air Conditioning', 'Heating', 'Washer', 'Dryer', 'TV', 'Workspace', 'Gym'];

export default function EditProperty() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useDarkMode();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchingProperty, setFetchingProperty] = useState(true);
  const [error, setError] = useState('');
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    property_name: '',
    property_type: 'apartment',
    description: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    price_per_night: '',
    bedrooms: '1',
    bathrooms: '1',
    max_guests: '1',
    amenities: [] as string[],
    available: true
  });

  // Fetch property data
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setFetchingProperty(true);
        const response = await api.get(`/api/properties/${id}`);
        const property = response.data.data;

        setFormData({
          property_name: property.property_name || '',
          property_type: property.property_type || 'apartment',
          description: property.description || '',
          address: property.address || '',
          city: property.city || '',
          state: property.state || '',
          zip_code: property.zipcode || '',
          country: property.country || '',
          price_per_night: property.price_per_night?.toString() || '',
          bedrooms: property.bedrooms?.toString() || '1',
          bathrooms: property.bathrooms?.toString() || '1',
          max_guests: property.max_guests?.toString() || '1',
          amenities: property.amenities || [],
          available: property.available === 1
        });

        setExistingImages(property.images || []);
      } catch (err: any) {
        console.error('Error fetching property:', err);
        setError(err.response?.data?.message || 'Failed to load property');
      } finally {
        setFetchingProperty(false);
      }
    };

    if (id) {
      fetchProperty();
    }
  }, [id]);

  const validateStep = (currentStep: number): boolean => {
    const errors: Record<string, string> = {};

    switch (currentStep) {
      case 1: // Basic Info
        if (!formData.property_name.trim()) {
          errors.property_name = 'Property name is required';
        } else if (formData.property_name.trim().length < 3) {
          errors.property_name = 'Property name must be at least 3 characters';
        }
        
        if (!formData.property_type) {
          errors.property_type = 'Property type is required';
        }
        
        if (!formData.description.trim()) {
          errors.description = 'Description is required';
        } else if (formData.description.trim().length < 20) {
          errors.description = 'Description must be at least 20 characters';
        }
        break;

      case 2: // Location
        if (!formData.address.trim()) {
          errors.address = 'Address is required';
        }
        if (!formData.city.trim()) {
          errors.city = 'City is required';
        }
        if (!formData.state.trim()) {
          errors.state = 'State is required';
        }
        if (!formData.zip_code.trim()) {
          errors.zip_code = 'ZIP code is required';
        }
        if (!formData.country.trim()) {
          errors.country = 'Country is required';
        }
        break;

      case 3: // Details
        if (!formData.price_per_night || parseFloat(formData.price_per_night) <= 0) {
          errors.price_per_night = 'Price must be greater than 0';
        }
        
        if (!formData.bedrooms || parseInt(formData.bedrooms) < 1) {
          errors.bedrooms = 'At least 1 bedroom is required';
        }
        
        if (!formData.bathrooms || parseFloat(formData.bathrooms) < 1) {
          errors.bathrooms = 'At least 1 bathroom is required';
        }
        
        if (!formData.max_guests || parseInt(formData.max_guests) < 1) {
          errors.max_guests = 'At least 1 guest is required';
        }
        break;

      case 4: // Photos
        const totalImages = existingImages.length - imagesToDelete.length + newImages.length;
        if (totalImages === 0) {
          errors.images = 'At least one photo is required';
        }
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    setValidationErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: '' });
    }
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.includes(amenity)
        ? formData.amenities.filter(a => a !== amenity)
        : [...formData.amenities, amenity]
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewImages([...newImages, ...files]);
    if (validationErrors.images) {
      setValidationErrors({ ...validationErrors, images: '' });
    }
  };

  const removeNewImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index));
  };

  const markExistingImageForDeletion = (imagePath: string) => {
    setImagesToDelete([...imagesToDelete, imagePath]);
  };

  const unmarkExistingImageForDeletion = (imagePath: string) => {
    setImagesToDelete(imagesToDelete.filter(path => path !== imagePath));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(step)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();

      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'amenities') {
          formDataToSend.append(key, JSON.stringify(value));
        } else {
          formDataToSend.append(key, value.toString());
        }
      });

      // Add existing photos (not marked for deletion)
      const remainingExistingPhotos = existingImages.filter(img => !imagesToDelete.includes(img));
      formDataToSend.append('existing_photos', JSON.stringify(remainingExistingPhotos));

      // Add photos to delete
      formDataToSend.append('photos_to_delete', JSON.stringify(imagesToDelete));

      // Add new images
      newImages.forEach((image) => {
        formDataToSend.append('images', image);
      });

      await api.put(`/api/properties/${id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      navigate('/owner/dashboard');
    } catch (err: any) {
      console.error('Error updating property:', err);
      setError(err.response?.data?.message || 'Failed to update property');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProperty) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto"></div>
          <p className={`mt-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Loading property...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} py-8 px-4 sm:px-6 lg:px-8`}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/owner/dashboard')}
            className={`flex items-center text-sm ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} mb-4`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Edit Property
          </h1>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Update your property details
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  s < step
                    ? 'bg-rose-500 text-white'
                    : s === step
                    ? 'bg-rose-500 text-white'
                    : isDark
                    ? 'bg-gray-700 text-gray-400'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s < step ? <Check className="w-5 h-5" /> : s}
              </div>
            ))}
          </div>
          <div className={`h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full`}>
            <div
              className="h-2 bg-rose-500 rounded-full transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow rounded-lg p-6`}>
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Basic Information
              </h2>

              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Property Name *
                </label>
                <input
                  type="text"
                  name="property_name"
                  value={formData.property_name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  } ${validationErrors.property_name ? 'border-red-500' : ''}`}
                  placeholder="e.g., Cozy Downtown Apartment"
                />
                {validationErrors.property_name && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.property_name}</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Property Type *
                </label>
                <select
                  name="property_type"
                  value={formData.property_type}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                >
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  } ${validationErrors.description ? 'border-red-500' : ''}`}
                  placeholder="Describe your property..."
                />
                {validationErrors.description && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.description}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Location
              </h2>

              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Street Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  } ${validationErrors.address ? 'border-red-500' : ''}`}
                />
                {validationErrors.address && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    } ${validationErrors.city ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.city && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.city}</p>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    } ${validationErrors.state ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.state && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.state}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    } ${validationErrors.zip_code ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.zip_code && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.zip_code}</p>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Country *
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    } ${validationErrors.country ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.country && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.country}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Property Details */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Property Details
              </h2>

              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Price Per Night ($) *
                </label>
                <input
                  type="number"
                  name="price_per_night"
                  value={formData.price_per_night}
                  onChange={handleChange}
                  min="1"
                  step="0.01"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  } ${validationErrors.price_per_night ? 'border-red-500' : ''}`}
                />
                {validationErrors.price_per_night && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.price_per_night}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Bedrooms *
                  </label>
                  <input
                    type="number"
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleChange}
                    min="1"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    } ${validationErrors.bedrooms ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.bedrooms && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.bedrooms}</p>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Bathrooms *
                  </label>
                  <input
                    type="number"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleChange}
                    min="1"
                    step="0.5"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    } ${validationErrors.bathrooms ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.bathrooms && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.bathrooms}</p>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Max Guests *
                  </label>
                  <input
                    type="number"
                    name="max_guests"
                    value={formData.max_guests}
                    onChange={handleChange}
                    min="1"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    } ${validationErrors.max_guests ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.max_guests && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.max_guests}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Photos */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Property Photos
              </h2>

              {/* Existing Photos */}
              {existingImages.length > 0 && (
                <div>
                  <h3 className={`text-lg font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                    Current Photos
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {existingImages.map((image, index) => {
                      const isMarkedForDeletion = imagesToDelete.includes(image);
                      return (
                        <div key={index} className="relative group">
                          <img
                            src={`http://localhost:5000${image}`}
                            alt={`Property ${index + 1}`}
                            className={`w-full h-40 object-cover rounded-lg ${
                              isMarkedForDeletion ? 'opacity-30' : ''
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              isMarkedForDeletion
                                ? unmarkExistingImageForDeletion(image)
                                : markExistingImageForDeletion(image)
                            }
                            className={`absolute top-2 right-2 p-2 rounded-full ${
                              isMarkedForDeletion
                                ? 'bg-green-500 hover:bg-green-600'
                                : 'bg-red-500 hover:bg-red-600'
                            } text-white opacity-0 group-hover:opacity-100 transition-opacity`}
                          >
                            {isMarkedForDeletion ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                          {isMarkedForDeletion && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                Will be deleted
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* New Photos Upload */}
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Add New Photos
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center ${
                    isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <Upload className={`mx-auto h-12 w-12 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                  <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Click to upload or drag and drop
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="mt-4 inline-block px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 cursor-pointer"
                  >
                    Select Photos
                  </label>
                </div>
              </div>

              {/* Preview New Images */}
              {newImages.length > 0 && (
                <div>
                  <h3 className={`text-lg font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                    New Photos ({newImages.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {newImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`New ${index + 1}`}
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {validationErrors.images && (
                <p className="text-sm text-red-500">{validationErrors.images}</p>
              )}
            </div>
          )}

          {/* Step 5: Amenities */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Amenities & Availability
              </h2>

              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                  Select Amenities
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {AMENITIES_LIST.map((amenity) => (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => handleAmenityToggle(amenity)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        formData.amenities.includes(amenity)
                          ? 'border-rose-500 bg-rose-50 text-rose-700'
                          : isDark
                          ? 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {amenity}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="available"
                  checked={formData.available}
                  onChange={handleChange}
                  className="h-4 w-4 text-rose-500 focus:ring-rose-500 border-gray-300 rounded"
                />
                <label className={`ml-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Property is available for booking
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className={`px-6 py-2 rounded-lg border ${
                  isDark
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ArrowLeft className="w-4 h-4 inline mr-2" />
                Back
              </button>
            ) : (
              <div></div>
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
              >
                Next
                <ArrowRight className="w-4 h-4 inline ml-2" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Property'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
