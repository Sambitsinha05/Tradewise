import jwt from 'jsonwebtoken';

// Generate Access Token (short-lived)
export const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '15m', // 15 minutes
  });
};

// Generate Refresh Token (long-lived)
export const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d', // 7 days
  });
};

// Set Tokens in HTTP-Only Cookies
export const setTokenCookies = (res, accessToken, refreshToken) => {
  res.cookie('jwt_access', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
    sameSite: 'strict', // Prevent CSRF attacks
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('jwt_refresh', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const clearTokenCookies = (res) => {
  res.cookie('jwt_access', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.cookie('jwt_refresh', '', {
    httpOnly: true,
    expires: new Date(0),
  });
};
