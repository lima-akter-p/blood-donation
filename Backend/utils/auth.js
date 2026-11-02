import jwt from 'jsonwebtoken';

const JWT_ISSUER = 'lifedrop-api';
const JWT_ALGORITHM = 'HS256';

export function validateJwtConfiguration() {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  }
}

function getJwtSecret() {
  validateJwtConfiguration();
  return process.env.JWT_SECRET;
}

export function createAuthToken(userId) {
  return jwt.sign(
    { sub: userId.toString() },
    getJwtSecret(),
    {
      algorithm: JWT_ALGORITHM,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: JWT_ISSUER,
    },
  );
}

export function verifyAuthToken(token) {
  return jwt.verify(token, getJwtSecret(), {
    algorithms: [JWT_ALGORITHM],
    issuer: JWT_ISSUER,
  });
}
