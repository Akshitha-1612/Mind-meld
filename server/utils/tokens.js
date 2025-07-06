import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import RefreshToken from '../models/RefreshToken.js';

// Generate access token
export const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
};

// Generate refresh token
export const generateRefreshToken = async (userId, userAgent = null, ipAddress = null) => {
  const jti = uuidv4();
  const expiresIn = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  const expiresAt = new Date(Date.now() + expiresIn);
  
  // Save refresh token to database
  const refreshTokenDoc = new RefreshToken({
    userId,
    jti,
    expiresAt,
    userAgent,
    ipAddress
  });
  
  await refreshTokenDoc.save();
  
  // Generate JWT with jti
  const token = jwt.sign(
    { userId, jti },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  return { token, jti, expiresAt };
};

// Verify access token
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    throw new Error('Invalid access token');
  }
};

// Verify refresh token
export const verifyRefreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    
    // Check if token is blacklisted
    const refreshTokenDoc = await RefreshToken.findOne({ 
      jti: decoded.jti,
      userId: decoded.userId,
      isBlacklisted: false
    });
    
    if (!refreshTokenDoc) {
      throw new Error('Refresh token not found or blacklisted');
    }
    
    return { decoded, refreshTokenDoc };
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

// Blacklist refresh token
export const blacklistRefreshToken = async (jti) => {
  await RefreshToken.updateOne(
    { jti },
    { isBlacklisted: true }
  );
};

// Clean expired tokens
export const cleanExpiredTokens = async () => {
  try {
    const result = await RefreshToken.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    console.log(`🧹 Cleaned ${result.deletedCount} expired refresh tokens`);
  } catch (error) {
    console.error('❌ Error cleaning expired tokens:', error);
  }
};

// Revoke all user tokens
export const revokeAllUserTokens = async (userId) => {
  await RefreshToken.updateMany(
    { userId, isBlacklisted: false },
    { isBlacklisted: true }
  );
};