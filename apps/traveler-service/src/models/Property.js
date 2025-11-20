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
    required: true
  },
  description: {
    type: String,
    default: ''
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
    default: ''
  },
  zipcode: {
    type: String,
    default: ''
  },
  country: {
    type: String,
    required: true
  },
  price_per_night: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  cleaning_fee: {
    type: mongoose.Schema.Types.Mixed,
    default: 0
  },
  service_fee: {
    type: mongoose.Schema.Types.Mixed,
    default: 0
  },
  bedrooms: {
    type: Number,
    default: 1
  },
  bathrooms: {
    type: Number,
    default: 1
  },
  max_guests: {
    type: Number,
    default: 2
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

propertySchema.index({ owner_id: 1 });
propertySchema.index({ city: 1 });
propertySchema.index({ available: 1 });
propertySchema.index({ price_per_night: 1 });

const Property = mongoose.model('Property', propertySchema);

export default Property;

