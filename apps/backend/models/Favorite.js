// models/Favorite.js
import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  property_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate favorites
favoriteSchema.index({ user_id: 1, property_id: 1 }, { unique: true });

// Virtual for created_at (for MySQL compatibility)
favoriteSchema.virtual('created_at').get(function() {
  return this.createdAt;
});

// Ensure virtuals are included in JSON
favoriteSchema.set('toJSON', { virtuals: true });
favoriteSchema.set('toObject', { virtuals: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);

export default Favorite;

