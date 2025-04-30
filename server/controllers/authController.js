// server/controllers/authController.js
const User = require('../models/user');
const jwt = require('jsonwebtoken');

/**
 * Generate JWT token
 * @param {Object} user - User object
 * @returns {String} - JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }  // Make sure this is a valid timespan like '7d', '24h', or a number in seconds
  );
};

/**
 * Register a new user
 * @route POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, companyName, phone, language } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Create new user
    const user = new User({
      name,
      email,
      password,
      companyName,
      phone,
      language: language || 'fr' // Default to French for Quebec
    });
    
    await user.save();
    
    // Generate token
    const token = generateToken(user);
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        language: user.language
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check if password is correct
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Generate token
    const token = generateToken(user);
    
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        language: user.language
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get current user
 * @route GET /api/auth/me
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update user profile
 * @route PUT /api/auth/me
 */
exports.updateProfile = async (req, res) => {
  try {
    // Prevent updating role (only admins can do that)
    if (req.body.role && req.user.role !== 'admin') {
      delete req.body.role;
    }
    
    // Don't allow password update through this route
    if (req.body.password) {
      delete req.body.password;
    }
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};