import { verifyAccessToken } from '../utils/tokens.js';
import User from '../models/User.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }
    
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Access denied. User not found.' 
      });
    }
    
    if (!user.isVerified) {
      return res.status(401).json({ 
        error: 'Access denied. Please verify your email first.' 
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ 
      error: 'Access denied. Invalid token.' 
    });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Access denied. Admin privileges required.' 
    });
  }
  next();
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;
    
    if (token) {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isVerified) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};