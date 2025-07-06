import { verifyRefreshToken, generateAccessToken, generateRefreshToken, blacklistRefreshToken } from '../utils/tokens.js';
import User from '../models/User.js';

export const refreshTokenMiddleware = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ 
        error: 'Refresh token not provided.' 
      });
    }
    
    // Verify and get refresh token info
    const { decoded, refreshTokenDoc } = await verifyRefreshToken(refreshToken);
    
    // Get user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found.' 
      });
    }
    
    // Blacklist current refresh token (rotation)
    await blacklistRefreshToken(decoded.jti);
    
    // Generate new tokens
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshTokenData = await generateRefreshToken(
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
    
    res.cookie('accessToken', newAccessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000 // 15 minutes
    });
    
    res.cookie('refreshToken', newRefreshTokenData.token, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    req.user = user;
    req.newTokens = {
      accessToken: newAccessToken,
      refreshToken: newRefreshTokenData.token
    };
    
    next();
  } catch (error) {
    console.error('Refresh token middleware error:', error);
    res.status(401).json({ 
      error: 'Invalid refresh token.' 
    });
  }
};