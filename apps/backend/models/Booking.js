// models/Booking.js
import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  traveler_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  property_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  owner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  check_in: {
    type: Date,
    required: true
  },
  check_out: {
    type: Date,
    required: true
  },
  number_of_guests: {
    type: Number,
    required: true
  },
  total_price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'CANCELLED', 'REJECTED', 'COMPLETED'],
    default: 'PENDING'
  },
  party_type: {
    type: String,
    enum: ['solo', 'couple', 'family', 'group', 'business'],
    default: 'couple'
  },
  cancelled_by: {
    type: String,
    enum: ['traveler', 'owner', null],
    default: null
  },
  cancelled_at: {
    type: Date,
    default: null
  },
  cancellation_reason: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
bookingSchema.index({ traveler_id: 1 });
bookingSchema.index({ property_id: 1 });
bookingSchema.index({ owner_id: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ check_in: 1, check_out: 1 });

// Virtual for created_at (for MySQL compatibility)
bookingSchema.virtual('created_at').get(function() {
  return this.createdAt;
});

bookingSchema.virtual('updated_at').get(function() {
  return this.updatedAt;
});

// Validation: check_out must be after check_in
bookingSchema.pre('save', function(next) {
  if (this.check_out <= this.check_in) {
    next(new Error('Check-out date must be after check-in date'));
  } else {
    next();
  }
});

// Ensure virtuals are included in JSON
bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;

