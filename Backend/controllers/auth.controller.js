import bcrypt from 'bcryptjs';
import User, { BLOOD_GROUPS } from '../models/user.model.js';
import { createAuthToken } from '../utils/auth.js';
import { detectImageMimeType, uploadImageToImgBB } from '../utils/imageUpload.js';
import {
  getGoogleProfilePictureUrl,
  verifyFirebaseIdToken,
} from '../utils/firebaseAuth.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_COMPLEXITY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;
const BCRYPT_MAX_PASSWORD_BYTES = 72;
const BCRYPT_ROUNDS = 12;

function publicUser(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    bloodGroup: user.bloodGroup,
    district: user.district,
    upazila: user.upazila,
    phone: user.phone || '',
    isAvailable: user.isAvailable !== false,
    nextAvailableDate: user.nextAvailableDate || '',
    role: user.role,
    status: user.status,
    donorVerificationStatus: user.donorVerificationStatus || 'verified',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function validateRegistration(body = {}) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const confirmation = body.confirmPassword ?? body.confirm_password;
  const avatar = typeof body.avatar === 'string' ? body.avatar.trim() : '';
  const bloodGroup = typeof body.bloodGroup === 'string' ? body.bloodGroup.trim() : '';
  const district = typeof body.district === 'string' ? body.district.trim() : '';
  const upazila = typeof body.upazila === 'string' ? body.upazila.trim() : '';

  if (!name || name.length < 2 || name.length > 80) {
    return { error: 'Name must be between 2 and 80 characters.' };
  }
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { error: 'Enter a valid email address.' };
  }
  if (
    password.length < 8
    || Buffer.byteLength(password, 'utf8') > BCRYPT_MAX_PASSWORD_BYTES
  ) {
    return { error: 'Password must be at least 8 characters and no more than 72 bytes.' };
  }
  if (!PASSWORD_COMPLEXITY.test(password)) {
    return { error: 'Password must include uppercase and lowercase letters, a number, and a special character.' };
  }
  if (typeof confirmation !== 'string' || password !== confirmation) {
    return { error: 'Password confirmation does not match.' };
  }
  if (avatar && (!isHttpUrl(avatar) || avatar.length > 2048)) {
    return { error: 'Avatar must be a valid HTTP or HTTPS URL.' };
  }
  if (!BLOOD_GROUPS.includes(bloodGroup)) {
    return { error: 'Select a valid blood group.' };
  }
  if (!district || district.length > 100 || !upazila || upazila.length > 100) {
    return { error: 'Select a valid district and upazila.' };
  }

  return {
    value: { name, email, password, avatar, bloodGroup, district, upazila },
  };
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function validateDateOfBirth(value) {
  if (
    typeof value !== 'string'
    || !/^\d{4}-\d{2}-\d{2}$/.test(value)
    || Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))
    || new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) !== value
  ) {
    return false;
  }

  const birthDate = new Date(`${value}T00:00:00.000Z`);
  const today = new Date();
  const adultDate = new Date(Date.UTC(
    birthDate.getUTCFullYear() + 18,
    birthDate.getUTCMonth(),
    birthDate.getUTCDate(),
  ));
  return adultDate <= today;
}

function getVerifiedDocument(req) {
  const mimeType = detectImageMimeType(req.file?.buffer);
  return mimeType ? { buffer: req.file.buffer, mimeType } : null;
}

export async function uploadAvatar(req, res, next) {
  const { buffer } = req.file ?? {};
  const mimeType = detectImageMimeType(buffer);
  if (!mimeType) {
    res.status(400).json({ message: 'Choose a valid PNG, JPEG, or WebP image up to 5 MB.' });
    return;
  }

  try {
    const avatar = await uploadImageToImgBB(buffer, mimeType);
    res.status(200).json({ avatar });
  } catch (error) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export async function registerUser(req, res) {
  const validation = validateRegistration(req.body);
  if (validation.error) {
    res.status(400).json({ message: validation.error });
    return;
  }
  const certificate = getVerifiedDocument(req);
  if (!certificate) {
    res.status(400).json({ message: 'Upload a valid birth certificate image (PNG, JPEG, or WebP, up to 5 MB).' });
    return;
  }
  if (!validateDateOfBirth(req.body.dateOfBirth)) {
    res.status(400).json({ message: 'Donor registration is limited to people aged 18 or older. Enter a valid date of birth.' });
    return;
  }
  if (req.body.documentConsent !== 'true') {
    res.status(400).json({ message: 'Consent is required to store your birth certificate privately for administrator review.' });
    return;
  }

  const { password, ...profile } = validation.value;

  try {
    const existingUser = await User.exists({ email: profile.email });
    if (existingUser) {
      res.status(409).json({ message: 'An account with this email already exists.' });
      return;
    }

    const user = await User.create({
      ...profile,
      password: await bcrypt.hash(password, BCRYPT_ROUNDS),
      dateOfBirth: req.body.dateOfBirth,
      donorVerificationStatus: 'pending',
      birthCertificate: certificate.buffer,
      birthCertificateMimeType: certificate.mimeType,
    });

    res.status(201).json({
      user: publicUser(user),
      token: createAuthToken(user._id),
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(409).json({ message: 'An account with this email already exists.' });
      return;
    }
    throw error;
  }
}

export async function loginUser(req, res) {
  const email = typeof req.body?.email === 'string'
    ? req.body.email.trim().toLowerCase()
    : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!EMAIL_PATTERN.test(email) || password.length === 0) {
    res.status(400).json({ message: 'Enter a valid email address and password.' });
    return;
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user?.password || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ message: 'Email or password is incorrect.' });
    return;
  }
  if (user.status === 'blocked') {
    res.status(403).json({ message: 'This account has been blocked.' });
    return;
  }

  res.json({
    user: publicUser(user),
    token: createAuthToken(user._id),
  });
}

export async function loginWithGoogle(req, res, next) {
  const idToken = typeof req.body?.idToken === 'string' ? req.body.idToken.trim() : '';
  if (!idToken || idToken.length > 10_000) {
    res.status(400).json({ message: 'A valid Google sign-in credential is required.' });
    return;
  }

  let identity;
  try {
    identity = await verifyFirebaseIdToken(idToken);
  } catch (error) {
    if (error.status === 503) {
      res.status(503).json({ message: error.message });
      return;
    }
    if ([
      'auth/argument-error',
      'auth/id-token-expired',
      'auth/invalid-credential',
      'auth/invalid-id-token',
      'auth/tenant-id-mismatch',
    ].includes(error.code)) {
      res.status(401).json({ message: 'Google sign-in could not be verified. Please try again.' });
      return;
    }
    next(error);
    return;
  }

  const email = typeof identity.email === 'string'
    ? identity.email.trim().toLowerCase()
    : '';
  if (!identity.email_verified || !EMAIL_PATTERN.test(email) || email.length > 254) {
    res.status(403).json({ message: 'Use a Google account with a verified email address.' });
    return;
  }

  let user = await User.findOne({ email });
  const googlePicture = getGoogleProfilePictureUrl(identity.picture);
  if (!user) {
    let profile = req.body.profile;
    if (typeof profile === 'string') {
      try {
        profile = JSON.parse(profile);
      } catch {
        profile = null;
      }
    }
    if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
      res.json({
        requiresProfile: true,
        profile: {
          email,
          name: typeof identity.name === 'string' ? identity.name.trim().slice(0, 80) : '',
          avatar: googlePicture,
        },
      });
      return;
    }
    const certificate = getVerifiedDocument(req);
    if (!certificate) {
      res.status(400).json({ message: 'Upload a valid birth certificate image (PNG, JPEG, or WebP, up to 5 MB).' });
      return;
    }
    if (!validateDateOfBirth(profile.dateOfBirth)) {
      res.status(400).json({ message: 'Donor registration is limited to people aged 18 or older. Enter a valid date of birth.' });
      return;
    }
    if (profile.documentConsent !== true && profile.documentConsent !== 'true') {
      res.status(400).json({ message: 'Consent is required to store your birth certificate privately for administrator review.' });
      return;
    }

    const bloodGroup = typeof profile.bloodGroup === 'string' ? profile.bloodGroup.trim() : '';
    const district = typeof profile.district === 'string' ? profile.district.trim() : '';
    const upazila = typeof profile.upazila === 'string' ? profile.upazila.trim() : '';
    if (!BLOOD_GROUPS.includes(bloodGroup)) {
      res.status(400).json({ message: 'Select a valid blood group.' });
      return;
    }
    if (!district || district.length > 100 || !upazila || upazila.length > 100) {
      res.status(400).json({ message: 'Select a valid district and upazila or thana.' });
      return;
    }

    const verifiedName = typeof identity.name === 'string' ? identity.name.trim() : '';
    const name = verifiedName.length >= 2 && verifiedName.length <= 80
      ? verifiedName
      : email.split('@')[0].slice(0, 80);
    try {
      user = await User.create({
        email,
        name: name.length >= 2 ? name : 'LifeDrop Donor',
        avatar: googlePicture,
        bloodGroup,
        district,
        upazila,
        authProviders: ['google'],
        dateOfBirth: profile.dateOfBirth,
        donorVerificationStatus: 'pending',
        birthCertificate: certificate.buffer,
        birthCertificateMimeType: certificate.mimeType,
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      user = await User.findOne({ email });
      if (!user) throw error;
    }
  }

  if (user.status === 'blocked') {
    res.status(403).json({ message: 'This account has been blocked.' });
    return;
  }

  const providers = Array.isArray(user.authProviders) ? user.authProviders : [];
  if (!providers.includes('google')) user.authProviders = [...providers, 'google'];
  let currentAvatarIsUploaded = false;
  if (user.avatar) {
    try {
      currentAvatarIsUploaded = new URL(user.avatar).hostname === 'i.ibb.co';
    } catch {
      currentAvatarIsUploaded = false;
    }
  }
  if (googlePicture && !currentAvatarIsUploaded && user.avatar !== googlePicture) {
    user.avatar = googlePicture;
  }
  if (user.isModified()) await user.save();

  res.json({
    user: publicUser(user),
    token: createAuthToken(user._id),
  });
}

export function getCurrentUser(req, res) {
  res.json({ user: publicUser(req.user) });
}

export async function updateCurrentUser(req, res) {
  const body = req.body;
  const allowedFields = [
    'name',
    'avatar',
    'bloodGroup',
    'district',
    'upazila',
    'phone',
    'isAvailable',
    'nextAvailableDate',
  ];
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    res.status(400).json({ message: 'Submit profile fields as a JSON object.' });
    return;
  }

  const fields = Object.keys(body);
  if (fields.length === 0 || fields.some((field) => !allowedFields.includes(field))) {
    res.status(400).json({
      message: 'Update only name, avatar, blood group, location, phone, and donor availability fields.',
    });
    return;
  }

  if (
    fields.some((field) => ['phone', 'isAvailable', 'nextAvailableDate'].includes(field))
    && req.user.role !== 'donor'
  ) {
    res.status(403).json({ message: 'Only donor accounts can update donor contact and availability details.' });
    return;
  }

  const updates = {};
  if (Object.hasOwn(body, 'name')) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (name.length < 2 || name.length > 80) {
      res.status(400).json({ message: 'Name must be between 2 and 80 characters.' });
      return;
    }
    updates.name = name;
  }
  if (Object.hasOwn(body, 'avatar')) {
    const avatar = typeof body.avatar === 'string' ? body.avatar.trim() : '';
    if (avatar && (!isHttpUrl(avatar) || avatar.length > 2048)) {
      res.status(400).json({ message: 'Avatar must be a valid HTTP or HTTPS URL.' });
      return;
    }
    updates.avatar = avatar;
  }
  if (Object.hasOwn(body, 'bloodGroup')) {
    if (!BLOOD_GROUPS.includes(body.bloodGroup)) {
      res.status(400).json({ message: 'Select a valid blood group.' });
      return;
    }
    updates.bloodGroup = body.bloodGroup;
  }
  for (const field of ['district', 'upazila']) {
    if (!Object.hasOwn(body, field)) continue;
    const value = typeof body[field] === 'string' ? body[field].trim() : '';
    if (!value || value.length > 100) {
      res.status(400).json({ message: `Select a valid ${field}.` });
      return;
    }
    updates[field] = value;
  }
  if (Object.hasOwn(body, 'phone')) {
    const phone = typeof body.phone === 'string'
      ? body.phone.trim().replace(/[\s()-]/g, '')
      : null;
    if (phone === null || (phone && !/^(?:01[3-9]\d{8}|\+8801[3-9]\d{8})$/.test(phone))) {
      res.status(400).json({ message: 'Enter a valid Bangladesh mobile number or leave it blank.' });
      return;
    }
    updates.phone = phone
      ? `+880${phone.startsWith('+880') ? phone.slice(4) : phone.slice(1)}`
      : '';
  }
  if (Object.hasOwn(body, 'isAvailable')) {
    if (typeof body.isAvailable !== 'boolean') {
      res.status(400).json({ message: 'Donor availability must be true or false.' });
      return;
    }
    updates.isAvailable = body.isAvailable;
  }
  if (Object.hasOwn(body, 'nextAvailableDate')) {
    const nextAvailableDate = typeof body.nextAvailableDate === 'string'
      ? body.nextAvailableDate.trim()
      : null;
    if (
      nextAvailableDate === null
      || (nextAvailableDate !== '' && (
        !/^\d{4}-\d{2}-\d{2}$/.test(nextAvailableDate)
        || Number.isNaN(Date.parse(`${nextAvailableDate}T00:00:00.000Z`))
        || new Date(`${nextAvailableDate}T00:00:00.000Z`).toISOString().slice(0, 10)
          !== nextAvailableDate
      ))
    ) {
      res.status(400).json({ message: 'Enter a valid next available date or leave it blank.' });
      return;
    }
    updates.nextAvailableDate = nextAvailableDate;
  }

  req.user.set(updates);
  await req.user.save();
  res.json({ user: publicUser(req.user) });
}

export async function resubmitDonorVerification(req, res) {
  if (req.user.role !== 'donor') {
    res.status(403).json({ message: 'Only donor accounts can submit donor verification.' });
    return;
  }
  if (req.user.donorVerificationStatus !== 'rejected') {
    res.status(409).json({ message: 'A new certificate can only be submitted after an administrator requests resubmission.' });
    return;
  }

  const certificate = getVerifiedDocument(req);
  if (!certificate || !validateDateOfBirth(req.body?.dateOfBirth)) {
    res.status(400).json({ message: 'Upload a valid birth certificate image and an eligible date of birth.' });
    return;
  }
  if (req.body.documentConsent !== 'true') {
    res.status(400).json({ message: 'Consent is required to store your birth certificate privately for administrator review.' });
    return;
  }

  req.user.dateOfBirth = req.body.dateOfBirth;
  req.user.birthCertificate = certificate.buffer;
  req.user.birthCertificateMimeType = certificate.mimeType;
  req.user.donorVerificationStatus = 'pending';
  await req.user.save();
  res.json({ user: publicUser(req.user) });
}
