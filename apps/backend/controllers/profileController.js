// controllers/profileController.js
import User from '../models/User.js';
import fs from 'fs';
import path from 'path';

// GET - Get user profile
export const getProfile = async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get user profile
    const user = await User.findById(req.session.userId).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ profile: user.toObject() });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error while fetching profile' });
  }
};

// PUT - Update user profile
export const updateProfile = async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const {
      name,
      email,
      phone_number,
      about_me,
      city,
      state,
      country,
      languages,
      gender
    } = req.body;

    // Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!email || email.trim() === '') {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ 
      email, 
      _id: { $ne: req.session.userId } 
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    // Get current user to check for old profile picture
    const currentUser = await User.findById(req.session.userId);
    
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    let profilePicturePath = currentUser.profile_picture;

    // Handle profile picture upload
    if (req.file) {
      // Delete old profile picture if exists
      if (profilePicturePath) {
        const oldFilePath = path.join(process.cwd(), profilePicturePath);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      // Set new profile picture path
      profilePicturePath = '/uploads/profiles/' + req.file.filename;
    }

    // Update user profile
    currentUser.name = name;
    currentUser.email = email;
    currentUser.phone_number = phone_number || null;
    currentUser.about_me = about_me || null;
    currentUser.city = city || null;
    currentUser.state = state || null;
    currentUser.country = country || null;
    currentUser.languages = languages || null;
    currentUser.gender = gender || null;
    currentUser.profile_picture = profilePicturePath;

    await currentUser.save();

    // Get updated user profile (without password)
    const updatedUser = await User.findById(req.session.userId).select('-password');

    // Update session with new user data
    req.session.user = updatedUser.toObject();

    res.json({
      message: 'Profile updated successfully',
      profile: updatedUser.toObject()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error while updating profile' });
  }
};
