// controllers/authController.js
import bcrypt from 'bcryptjs';
import { promisePool } from '../config/db.js';

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
    const [existingUsers] = await promisePool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ 
        error: 'Email already registered' 
      });
    }

    // Hash password
    const saltRounds = 10; // Salt is generated internally by bcrypt
    const hashedPassword = await bcrypt.hash(password, saltRounds); // Hash the password

    // Insert new user
    const [result] = await promisePool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );

    // Get the newly created user (without password)
    const [newUser] = await promisePool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    // Create session
    req.session.userId = newUser[0].id;
    req.session.userRole = newUser[0].role;
    req.session.user = newUser[0]; // Add this for consistency

    // Save session explicitly
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Failed to save session' });
      }
      
      res.status(201).json({
        message: 'User registered successfully',
        user: newUser[0]
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
    const [users] = await promisePool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Create session
    req.session.userId = user.id;
    req.session.userRole = user.role;
    
    // Remove password from response
    delete user.password;
    
    req.session.user = user; // Add this for consistency

    // Save session explicitly
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Failed to save session' });
      }
      
      res.json({
        message: 'Login successful',
        user
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
    res.clearCookie('airbnb_session');
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

    const [users] = await promisePool.query(
      'SELECT id, name, email, role, phone_number, city, state, country, profile_picture, created_at FROM users WHERE id = ?',
      [req.session.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Ensure session.user is set for consistency
    req.session.user = users[0];

    res.json({ user: users[0] });

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
    const [users] = await promisePool.query(
      'SELECT id, name, email FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
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
      userId: users[0].id
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
    const [users] = await promisePool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await promisePool.query(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE email = ?',
      [hashedPassword, email]
    );

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
