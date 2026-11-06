import mongoose from 'mongoose';
import User from '../models/user.model.js';
import { verifyAuthToken } from '../utils/auth.js';

export async function authenticateToken(req, res, next) {
  const authorization = req.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    res.status(401).json({ message: 'A valid bearer token is required.' });
    return;
  }

  let payload;
  try {
    payload = verifyAuthToken(match[1]);
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      res.status(401).json({ message: 'The access token is invalid or expired.' });
      return;
    }
    next(error);
    return;
  }

  if (typeof payload.sub !== 'string' || !mongoose.isValidObjectId(payload.sub)) {
    res.status(401).json({ message: 'The access token is invalid.' });
    return;
  }

  try {
    const user = await User.findById(payload.sub).select('-password');
    if (!user) {
      res.status(401).json({ message: 'The account for this token no longer exists.' });
      return;
    }
    if (user.status !== 'active') {
      res.status(403).json({ message: 'This account has been blocked.' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication is required.' });
      return;
    }
    const userRole = typeof req.user.role === 'string'
      ? req.user.role.trim().toLowerCase()
      : '';
    const allowedRoles = roles.map((role) => role.trim().toLowerCase());
    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({ message: 'You do not have permission to access this resource.' });
      return;
    }
    next();
  };
}

export function requireVerifiedDonor(req, res, next) {
  const userRole = typeof req.user?.role === 'string'
    ? req.user.role.trim().toLowerCase()
    : '';
  if (
    userRole === 'donor'
    && req.user.donorVerificationStatus
    && req.user.donorVerificationStatus !== 'verified'
  ) {
    res.status(403).json({
      message: 'Your donor account is awaiting administrator verification.',
      code: 'DONOR_VERIFICATION_REQUIRED',
    });
    return;
  }
  next();
}
