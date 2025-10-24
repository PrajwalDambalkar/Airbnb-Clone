// src/pages/AddProperty.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../App';
import api from '../services/api';
import { ArrowLeft, ArrowRight, Check, Upload, X } from 'lucide-react';

const PROPERTY_TYPES = ['apartment', 'house', 'condo', 'villa', 'cabin', 'cottage', 'loft', 'other'];
const AMENITIES_LIST = ['WiFi', 'Kitchen', 'Parking', 'Pool', 'Hot Tub', 'Air Conditioning', 'Heating', 'Washer', 'Dryer', 'TV', 'Workspace', 'Gym'];

export default function AddProperty() {
  const navigate = useNavigate();
  const { isDark } = useDarkMode();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState<File[]>([]);
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
        } else if (!/^\d{5}(-\d{4})?$/.test(formData.zip_code.trim())) {
          errors.zip_code = 'Invalid ZIP code format (use 12345 or 12345-6789)';
        }
        if (!formData.country.trim()) {
          errors.country = 'Country is required';
        }
        break;

      case 3: // Details
        if (!formData.price_per_night || parseFloat(formData.price_per_night) <= 0) {
          errors.price_per_night = 'Price must be greater than 0';
        } else if (parseFloat(formData.price_per_night) > 10000) {
          errors.price_per_night = 'Price seems too high. Please verify.';
        }
        
        if (!formData.bedrooms || parseInt(formData.bedrooms) < 1) {
          errors.bedrooms = 'At least 1 bedroom is required';
        } else if (parseInt(formData.bedrooms) > 20) {
          errors.bedrooms = 'Maximum 20 bedrooms allowed';
        }
        
        if (!formData.bathrooms || parseFloat(formData.bathrooms) < 1) {
          errors.bathrooms = 'At least 1 bathroom is required';
        } else if (parseFloat(formData.bathrooms) > 20) {
          errors.bathrooms = 'Maximum 20 bathrooms allowed';
        }
        
        if (!formData.max_guests || parseInt(formData.max_guests) < 1) {
          errors.max_guests = 'At least 1 guest is required';
        } else if (parseInt(formData.max_guests) > 50) {
          errors.max_guests = 'Maximum 50 guests allowed';
        }
        break;

      case 4: // Amenities
        // Amenities are optional, no validation needed
        break;

      case 5: // Photos
        // Images are optional but validate file types and sizes if present
        if (images.length > 10) {
          errors.images = 'Maximum 10 images allowed';
        }
        
        const maxSize = 5 * 1024 * 1024; // 5MB
        const invalidImages = images.filter(img => img.size > maxSize);
        if (invalidImages.length > 0) {
          errors.images = `${invalidImages.length} image(s) exceed 5MB limit`;
        }
        
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const invalidTypes = images.filter(img => !validTypes.includes(img.type));
        if (invalidTypes.length > 0) {
          errors.images = 'Only JPG, PNG, and WebP images are allowed';
        }
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear validation error for this field when user types
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      const totalImages = images.length + newImages.length;
      
      if (totalImages > 10) {
        setValidationErrors({ images: 'Maximum 10 images allowed' });
        return;
      }
      
      // Validate each image
      const maxSize = 5 * 1024 * 1024; // 5MB
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      
      const invalidImages = newImages.filter(img => 
        img.size > maxSize || !validTypes.includes(img.type)
      );
      
      if (invalidImages.length > 0) {
        setValidationErrors({ 
          images: 'Some images are invalid (must be JPG/PNG/WebP and under 5MB)' 
        });
        return;
      }
      
      setImages(prev => [...prev, ...newImages]);
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.images;
        return newErrors;
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    // Clear image errors when removing images
    if (validationErrors.images && images.length <= 10) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.images;
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    // Validate final step before submission
    if (!validateStep(5)) {
      setError('Please fix validation errors before submitting');
      setLoading(false);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'amenities') {
          data.append(key, JSON.stringify(formData.amenities));
        } else {
          data.append(key, formData[key as keyof typeof formData].toString());
        }
      });
      
      images.forEach(image => {
        data.append('images', image);
      });

      console.log('Submitting property data...');
      console.log('Images:', images.length);
      console.log('Amenities:', formData.amenities);

      const response = await api.post('/api/properties', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log('Success:', response.data);
      alert('Property created successfully!');
      navigate('/owner/dashboard');
    } catch (err: any) {
      console.error('Error creating property:', err);
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to create property';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 5));
      setError(''); // Clear any previous errors
    } else {
      setError('Please fix the errors before continuing');
    }
  };
  
  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
    setError(''); // Clear errors when going back
    setValidationErrors({}); // Clear validation errors
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} py-8`}>
      <div className="max-w-3xl px-4 mx-auto">
        <button onClick={() => navigate('/owner/dashboard')} className="flex items-center gap-2 text-[#FF385C] mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className={`p-8 rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Add New Property
          </h1>
          <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Step {step} of 5
          </p>

          {/* Progress Bar */}
          <div className="w-full h-2 mb-8 bg-gray-200 rounded-full">
            <div className="bg-[#FF385C] h-2 rounded-full transition-all" style={{ width: `${(step / 5) * 100}%` }}></div>
          </div>

          {error && <div className="p-3 mb-4 text-red-700 bg-red-100 border border-red-300 rounded">{error}</div>}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Basic Information</h2>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Property Name <span className="text-red-500">*</span>
                </label>
                <input 
                  name="property_name" 
                  value={formData.property_name} 
                  onChange={handleChange} 
                  placeholder="e.g., Cozy Downtown Apartment" 
                  className={`w-full px-4 py-2 border rounded-lg ${
                    validationErrors.property_name 
                      ? 'border-red-500 focus:ring-red-500' 
                      : isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 placeholder-gray-500'
                  }`} 
                />
                {validationErrors.property_name && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.property_name}</p>
                )}
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Property Type <span className="text-red-500">*</span>
                </label>
                <select 
                  name="property_type" 
                  value={formData.property_type} 
                  onChange={handleChange} 
                  className={`w-full px-4 py-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                >
                  {PROPERTY_TYPES.map(type => <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  rows={4} 
                  placeholder="Describe your property in detail (minimum 20 characters)..." 
                  className={`w-full px-4 py-2 border rounded-lg ${
                    validationErrors.description 
                      ? 'border-red-500 focus:ring-red-500' 
                      : isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 placeholder-gray-500'
                  }`}
                />
                {validationErrors.description && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.description}</p>
                )}
                <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {formData.description.length} / 20 minimum characters
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Location</h2>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input 
                  name="address" 
                  value={formData.address} 
                  onChange={handleChange} 
                  placeholder="123 Main Street, Apt 4B" 
                  className={`w-full px-4 py-2 border rounded-lg ${
                    validationErrors.address 
                      ? 'border-red-500 focus:ring-red-500' 
                      : isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 placeholder-gray-500'
                  }`} 
                />
                {validationErrors.address && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.address}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    City <span className="text-red-500">*</span>
                  </label>
                  <input 
                    name="city" 
                    value={formData.city} 
                    onChange={handleChange} 
                    placeholder="San Francisco" 
                    className={`px-4 py-2 border rounded-lg w-full ${
                      validationErrors.city 
                        ? 'border-red-500 focus:ring-red-500' 
                        : isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 placeholder-gray-500'
                    }`} 
                  />
                  {validationErrors.city && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.city}</p>
                  )}
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    State <span className="text-red-500">*</span> <span className="text-xs">(2 letters)</span>
                  </label>
                  <input 
                    name="state" 
                    value={formData.state} 
                    onChange={handleChange} 
                    placeholder="CA" 
                    maxLength={2} 
                    className={`px-4 py-2 border rounded-lg w-full uppercase ${
                      validationErrors.state 
                        ? 'border-red-500 focus:ring-red-500' 
                        : isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 placeholder-gray-500'
                    }`} 
                  />
                  {validationErrors.state && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.state}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    ZIP Code <span className="text-red-500">*</span>
                  </label>
                  <input 
                    name="zip_code" 
                    value={formData.zip_code} 
                    onChange={handleChange} 
                    placeholder="94102" 
                    className={`px-4 py-2 border rounded-lg w-full ${
                      validationErrors.zip_code 
                        ? 'border-red-500 focus:ring-red-500' 
                        : isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 placeholder-gray-500'
                    }`} 
                  />
                  {validationErrors.zip_code && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.zip_code}</p>
                  )}
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input 
                    name="country" 
                    value={formData.country} 
                    onChange={handleChange} 
                    placeholder="United States" 
                    className={`px-4 py-2 border rounded-lg w-full ${
                      validationErrors.country 
                        ? 'border-red-500 focus:ring-red-500' 
                        : isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 placeholder-gray-500'
                    }`} 
                  />
                  {validationErrors.country && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.country}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Property Details</h2>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Price per Night ($) <span className="text-red-500">*</span>
                </label>
                <input 
                  name="price_per_night" 
                  type="number" 
                  value={formData.price_per_night} 
                  onChange={handleChange} 
                  placeholder="150" 
                  min="1"
                  step="0.01"
                  className={`w-full px-4 py-2 border rounded-lg ${
                    validationErrors.price_per_night 
                      ? 'border-red-500 focus:ring-red-500' 
                      : isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 placeholder-gray-500'
                  }`} 
                />
                {validationErrors.price_per_night && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.price_per_night}</p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Bedrooms <span className="text-red-500">*</span>
                  </label>
                  <input 
                    name="bedrooms" 
                    type="number" 
                    value={formData.bedrooms} 
                    onChange={handleChange} 
                    min="1" 
                    max="20"
                    placeholder="2" 
                    className={`w-full px-4 py-2 border rounded-lg ${
                      validationErrors.bedrooms 
                        ? 'border-red-500 focus:ring-red-500' 
                        : isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 placeholder-gray-500'
                    }`} 
                  />
                  {validationErrors.bedrooms && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.bedrooms}</p>
                  )}
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Bathrooms <span className="text-red-500">*</span>
                  </label>
                  <input 
                    name="bathrooms" 
                    type="number" 
                    value={formData.bathrooms} 
                    onChange={handleChange} 
                    min="1" 
                    max="20"
                    step="0.5"
                    placeholder="1" 
                    className={`w-full px-4 py-2 border rounded-lg ${
                      validationErrors.bathrooms 
                        ? 'border-red-500 focus:ring-red-500' 
                        : isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 placeholder-gray-500'
                    }`} 
                  />
                  {validationErrors.bathrooms && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.bathrooms}</p>
                  )}
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Max Guests <span className="text-red-500">*</span>
                  </label>
                  <input 
                    name="max_guests" 
                    type="number" 
                    value={formData.max_guests} 
                    onChange={handleChange} 
                    min="1" 
                    max="50"
                    placeholder="4" 
                    className={`w-full px-4 py-2 border rounded-lg ${
                      validationErrors.max_guests 
                        ? 'border-red-500 focus:ring-red-500' 
                        : isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 placeholder-gray-500'
                    }`} 
                  />
                  {validationErrors.max_guests && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.max_guests}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Amenities */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Amenities</h2>
              <div className="grid grid-cols-2 gap-3">
                {AMENITIES_LIST.map(amenity => (
                  <label key={amenity} className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer ${formData.amenities.includes(amenity) ? 'bg-[#FF385C] text-white border-[#FF385C]' : isDark ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-white border-gray-300'}`}>
                    <input type="checkbox" checked={formData.amenities.includes(amenity)} onChange={() => handleAmenityToggle(amenity)} className="hidden" />
                    <span>{amenity}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Photos */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Upload Photos</h2>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Optional but recommended • Max 10 images • 5MB per file • JPG, PNG, WebP only
                </p>
              </div>
              <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer ${
                validationErrors.images 
                  ? 'border-red-500 bg-red-50' 
                  : isDark ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
              }`}>
                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Click to upload images</span>
                <span className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  {images.length > 0 ? `${images.length} image${images.length > 1 ? 's' : ''} selected` : 'No images selected'}
                </span>
                <input type="file" multiple accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImageUpload} className="hidden" />
              </label>
              {validationErrors.images && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.images}</p>
              )}
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img src={URL.createObjectURL(img)} alt={`Upload ${i + 1}`} className="object-cover w-full h-24 rounded" />
                      <button 
                        type="button"
                        onClick={() => removeImage(i)} 
                        className="absolute p-1 text-white transition-opacity bg-red-500 rounded-full opacity-0 top-1 right-1 group-hover:opacity-100 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className={`absolute bottom-1 left-1 px-2 py-0.5 text-xs rounded ${isDark ? 'bg-gray-900/75 text-white' : 'bg-white/75 text-gray-900'}`}>
                        {(img.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 && <button onClick={prevStep} className={`px-6 py-2 rounded-lg ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}><ArrowLeft className="inline w-4 h-4 mr-2" />Previous</button>}
            {step < 5 && <button onClick={nextStep} className="ml-auto px-6 py-2 bg-[#FF385C] text-white rounded-lg">Next<ArrowRight className="inline w-4 h-4 ml-2" /></button>}
            {step === 5 && <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 ml-auto text-white bg-green-600 rounded-lg disabled:opacity-50">{loading ? 'Creating...' : <><Check className="inline w-4 h-4 mr-2" />Create Property</>}</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
