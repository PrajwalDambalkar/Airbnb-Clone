import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email, role: 'owner' });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'owner'
    });

    const userObject = newUser.toObject();
    delete userObject.password;

    req.session.userId = newUser._id.toString();
    req.session.userRole = 'owner';
    req.session.user = userObject;

    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to save session' });
      }
      res.status(201).json({
        message: 'Owner registered successfully',
        user: userObject
      });
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email, role: 'owner' });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const userObject = user.toObject();
    delete userObject.password;

    req.session.userId = user._id.toString();
    req.session.userRole = 'owner';
    req.session.user = userObject;

    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to save session' });
      }
      res.json({
        message: 'Login successful',
        user: userObject
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logout successful' });
  });
};

export const getCurrentUser = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(req.session.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    req.session.user = user.toObject();
    res.json({ user: user.toObject() });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

