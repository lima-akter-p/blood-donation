import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const APP_NAME = 'lifedrop-google-auth';

export function getGoogleProfilePictureUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return '';

  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && (url.hostname === 'googleusercontent.com' || url.hostname.endsWith('.googleusercontent.com'))
      ? url.toString()
      : '';
  } catch {
    return '';
  }
}

export async function verifyFirebaseIdToken(idToken) {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  if (!projectId) {
    const error = new Error('Google sign-in is not configured on the server.');
    error.status = 503;
    throw error;
  }

  const app = getApps().find((candidate) => candidate.name === APP_NAME)
    ?? initializeApp({ projectId }, APP_NAME);

  return getAuth(app).verifyIdToken(idToken);
}
