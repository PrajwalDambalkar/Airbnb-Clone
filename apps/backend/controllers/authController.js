// controllers/authController.js
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

// SIGNUP - Register new user
export const signup = async (req, res) => {
  try {
    console.log('📥 Full request body:', JSON.stringify(req.body, null, 2));
    
    const { name, email, password, role } = req.body;

    // BETTER VALIDATION:
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!email || email.trim() === '') {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!password || password.trim() === '') {
      return res.status(400).json({ error: 'Password is required' });
    }
    if (!role || role.trim() === '') {
      return res.status(400).json({ error: 'Role is required' });
    }

    if (!['traveler', 'owner'].includes(role)) {
      return res.status(400).json({ 
        error: 'Role must be either "traveler" or "owner"' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ 
        error: 'Email already registered' 
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    // Convert to plain object and remove password
    const userObject = newUser.toObject();
    delete userObject.password;

    // Create session
    req.session.userId = newUser._id.toString();
    req.session.userRole = newUser.role;
    req.session.user = userObject;

    // Save session explicitly
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Failed to save session' });
      }
      
      res.status(201).json({
        message: 'User registered successfully',
        user: userObject
      });
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      error: 'Server error during registration' 
    });
  }
};

// LOGIN - Authenticate user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Convert to plain object and remove password
    const userObject = user.toObject();
    delete userObject.password;

    // Create session
    req.session.userId = user._id.toString();
    req.session.userRole = user.role;
    req.session.user = userObject;

    // Save session explicitly
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Failed to save session' });
      }
      
      res.json({
        message: 'Login successful',
        user: userObject
      });
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Server error during login' 
    });
  }
};

// LOGOUT - Destroy session
export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ 
        error: 'Failed to logout' 
      });
    }
    res.clearCookie('connect.sid'); // MongoDB session cookie name
    res.json({ message: 'Logout successful' });
  });
};

// GET CURRENT USER - Check if logged in
export const getCurrentUser = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ 
        error: 'Not authenticated' 
      });
    }

    const user = await User.findById(req.session.userId).select('-password');

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Ensure session.user is set for consistency
    req.session.user = user.toObject();

    res.json({ user: user.toObject() });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      error: 'Server error' 
    });
  }
};

// FORGOT PASSWORD - Verify email and allow password reset
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || email.trim() === '') {
      return res.status(400).json({ 
        error: 'Email is required' 
      });
    }

    // Check if user exists
    const user = await User.findOne({ email }).select('_id name email');

    if (!user) {
      // For security, don't reveal if email exists or not
      return res.json({ 
        message: 'If this email exists, you can now reset your password',
        emailExists: false
      });
    }

    // Email exists - allow password reset
    res.json({ 
      message: 'Email verified. You can now reset your password.',
      emailExists: true,
      userId: user._id
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      error: 'Server error' 
    });
  }
};

// RESET PASSWORD - Update password for user
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ 
        error: 'Email and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters' 
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({ 
      message: 'Password reset successfully. You can now login with your new password.' 
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      error: 'Server error' 
    });
  }
};
