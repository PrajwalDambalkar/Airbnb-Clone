// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['traveler', 'owner'],
    required: true
  },
  phone_number: {
    type: String,
    default: null
  },
  about_me: {
    type: String,
    default: null
  },
  city: {
    type: String,
    default: null
  },
  state: {
    type: String,
    default: null
  },
  country: {
    type: String,
    default: null
  },
  languages: {
    type: String,
    default: null
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say', null],
    default: null
  },
  profile_picture: {
    type: String,
    default: null
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Indexes for faster queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Virtual for created_at (for MySQL compatibility)
userSchema.virtual('created_at').get(function() {
  return this.createdAt;
});

userSchema.virtual('updated_at').get(function() {
  return this.updatedAt;
});

// Ensure virtuals are included in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model('User', userSchema);

export default User;

