// models/Property.js
import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  owner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  property_name: {
    type: String,
    required: true
  },
  property_type: {
    type: String,
    enum: ['apartment', 'house', 'condo', 'villa', 'cabin', 'cottage', 'loft', 'other'],
    required: true
  },
  description: {
    type: String,
    default: null
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    default: null
  },
  country: {
    type: String,
    required: true
  },
  zipcode: {
    type: String,
    default: null
  },
  bedrooms: {
    type: Number,
    required: true
  },
  bathrooms: {
    type: Number,
    required: true
  },
  max_guests: {
    type: Number,
    required: true
  },
  price_per_night: {
    type: mongoose.Schema.Types.Mixed, // Support both String and Number
    required: true
  },
  cleaning_fee: {
    type: mongoose.Schema.Types.Mixed, // Support both String and Number
    default: 0
  },
  service_fee: {
    type: mongoose.Schema.Types.Mixed, // Support both String and Number
    default: 0
  },
  amenities: {
    type: [String],
    default: []
  },
  images: {
    type: [String],
    default: []
  },
  available: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for search and filtering
propertySchema.index({ city: 1 });
propertySchema.index({ country: 1 });
propertySchema.index({ price_per_night: 1 });
propertySchema.index({ available: 1 });
propertySchema.index({ owner_id: 1 });

// Virtual for created_at (for MySQL compatibility)
propertySchema.virtual('created_at').get(function() {
  return this.createdAt;
});

propertySchema.virtual('updated_at').get(function() {
  return this.updatedAt;
});

// Ensure virtuals are included in JSON
propertySchema.set('toJSON', { virtuals: true });
propertySchema.set('toObject', { virtuals: true });

const Property = mongoose.model('Property', propertySchema);

export default Property;

