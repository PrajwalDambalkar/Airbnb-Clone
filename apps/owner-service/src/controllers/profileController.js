import User from '../models/User.js';
import fs from 'fs';
import path from 'path';

export const getProfile = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

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

export const updateProfile = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { name, email, phone_number, about_me, city, state, country, languages, gender } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const existingUser = await User.findOne({ 
      email, 
      _id: { $ne: req.session.userId },
      role: 'owner'
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const currentUser = await User.findById(req.session.userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    let profilePicturePath = currentUser.profile_picture;

    if (req.file) {
      if (profilePicturePath) {
        const oldFilePath = path.join(process.cwd(), profilePicturePath);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      profilePicturePath = '/uploads/profiles/' + req.file.filename;
    }

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

    const updatedUser = await User.findById(req.session.userId).select('-password');
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

