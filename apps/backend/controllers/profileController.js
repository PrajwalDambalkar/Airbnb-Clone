// controllers/profileController.js
import { promisePool } from '../config/db.js';
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
    const [users] = await promisePool.query(
      `SELECT id, name, email, role, phone_number, about_me, city, state, 
       country, languages, gender, profile_picture, created_at, updated_at 
       FROM users WHERE id = ?`,
      [req.session.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ profile: users[0] });
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
    const [existingUsers] = await promisePool.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, req.session.userId]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    // Get current user to check for old profile picture
    const [currentUser] = await promisePool.query(
      'SELECT profile_picture FROM users WHERE id = ?',
      [req.session.userId]
    );

    let profilePicturePath = currentUser[0].profile_picture;

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
    await promisePool.query(
      `UPDATE users SET 
        name = ?,
        email = ?,
        phone_number = ?,
        about_me = ?,
        city = ?,
        state = ?,
        country = ?,
        languages = ?,
        gender = ?,
        profile_picture = ?
      WHERE id = ?`,
      [
        name,
        email,
        phone_number || null,
        about_me || null,
        city || null,
        state || null,
        country || null,
        languages || null,
        gender || null,
        profilePicturePath,
        req.session.userId
      ]
    );

    // Get updated user profile
    const [updatedUser] = await promisePool.query(
      `SELECT id, name, email, role, phone_number, about_me, city, state, 
       country, languages, gender, profile_picture, created_at, updated_at 
       FROM users WHERE id = ?`,
      [req.session.userId]
    );

    // Update session with new user data
    req.session.user = updatedUser[0];

    res.json({
      message: 'Profile updated successfully',
      profile: updatedUser[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error while updating profile' });
  }
};
