import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken, revokeAllUserTokens } from '../utils/tokens.js';
import { generateEmailToken, sendVerificationEmail, sendWelcomeEmail } from '../utils/email.js';
import jwt from 'jsonwebtoken';
import validator from 'validator';

// Register user
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'All fields are required'
      });
    }
    
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        error: 'Please provide a valid email'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long'
      });
    }
    
    if (name.length > 50) {
      return res.status(400).json({
        error: 'Name cannot exceed 50 characters'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        error: 'Email already registered'
      });
    }
    
    // Create user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      password
    });
    
    await user.save();
    
    // Generate email verification token
    const emailToken = generateEmailToken(user._id, user.email);
    
    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.name, emailToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }
    
    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed. Please try again.'
    });
  }
};

// Login user
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
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }
    
    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        error: 'Account temporarily locked due to too many failed login attempts. Please try again later.'
      });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await user.incLoginAttempts();
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }
    
    // Check if email is verified
    if (!user.isVerified) {
      return res.status(401).json({
        error: 'Please verify your email before logging in',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }
    
    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshTokenData = await generateRefreshToken(
      user._id,
      req.headers['user-agent'],
      req.ip
    );
    
    // Set cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    };
    
    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000 // 15 minutes
    });
    
    res.cookie('refreshToken', refreshTokenData.token, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        role: user.role,
        avatar: user.avatar,
        lastLogin: user.lastLogin
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed. Please try again.'
    });
  }
};

// Verify email
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({
        error: 'Verification token is required'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.EMAIL_SECRET);
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    
    if (user.email !== decoded.email) {
      return res.status(400).json({
        error: 'Invalid verification token'
      });
    }
    
    if (user.isVerified) {
      return res.status(400).json({
        error: 'Email already verified'
      });
    }
    
    // Update user
    user.isVerified = true;
    await user.save();
    
    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }
    
    res.json({
      message: 'Email verified successfully! You can now log in.'
    });
    
  } catch (error) {
    console.error('Email verification error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        error: 'Verification link has expired. Please request a new one.'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        error: 'Invalid verification token'
      });
    }
    
    res.status(500).json({
      error: 'Email verification failed. Please try again.'
    });
  }
};

// Resend verification email
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    
    if (user.isVerified) {
      return res.status(400).json({
        error: 'Email already verified'
      });
    }
    
    // Generate new verification token
    const emailToken = generateEmailToken(user._id, user.email);
    
    // Send verification email
    await sendVerificationEmail(user.email, user.name, emailToken);
    
    res.json({
      message: 'Verification email sent successfully'
    });
    
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      error: 'Failed to send verification email. Please try again.'
    });
  }
};

// Refresh token
export const refreshToken = (req, res) => {
  // This is handled by the refresh middleware
  res.json({
    message: 'Token refreshed successfully',
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      isVerified: req.user.isVerified,
      role: req.user.role,
      avatar: req.user.avatar,
      lastLogin: req.user.lastLogin
    }
  });
};

// Logout
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    
    if (req.user) {
      // Revoke all tokens for this user
      await revokeAllUserTokens(req.user._id);
    }
    
    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    res.json({
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed. Please try again.'
    });
  }
};

// Check authentication status
export const checkAuth = (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      isVerified: req.user.isVerified,
      role: req.user.role,
      avatar: req.user.avatar,
      lastLogin: req.user.lastLogin
    }
  });
};

// Google OAuth success
export const googleAuthSuccess = async (req, res) => {
  try {
    const user = req.user;
    
    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshTokenData = await generateRefreshToken(
      user._id,
      req.headers['user-agent'],
      req.ip
    );
    
    // Set cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    };
    
    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000 // 15 minutes
    });
    
    res.cookie('refreshToken', refreshTokenData.token, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Redirect to client
    res.redirect(`${process.env.CLIENT_URL}/dashboard`);
    
  } catch (error) {
    console.error('Google auth success error:', error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
  }
};