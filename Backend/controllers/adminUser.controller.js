import mongoose from 'mongoose';
import User, { USER_STATUSES } from '../models/user.model.js';

const PAGE_SIZE = 10;
const MAX_PAGE = 100000;

function serializeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatar: user.avatar || '',
    bloodGroup: user.bloodGroup,
    district: user.district,
    upazila: user.upazila,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
  };
}

export async function getUsers(req, res) {
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const status = req.query.status;
  if (!Number.isInteger(page) || page < 1 || page > MAX_PAGE) {
    res.status(400).json({ message: 'Page must be a positive whole number.' });
    return;
  }
  if (status !== undefined && !USER_STATUSES.includes(status)) {
    res.status(400).json({ message: 'Select a valid account status filter.' });
    return;
  }

  const filter = status ? { status } : {};
  const [users, total] = await Promise.all([
    User.find(filter)
      .select('name email avatar bloodGroup district upazila role status createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE),
    User.countDocuments(filter),
  ]);
  res.json({
    users: users.map(serializeUser),
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    },
  });
}

export async function updateUserStatus(req, res) {
  const { status } = req.body ?? {};
  if (status !== 'active' && status !== 'blocked') {
    res.status(400).json({ message: 'Account status must be active or blocked.' });
    return;
  }
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }
  if (req.params.id.toLowerCase() === req.user._id.toString()) {
    res.status(409).json({ message: 'You cannot change your own account status.' });
    return;
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }
  if (user.role === 'admin' && user.status === 'active' && status === 'blocked') {
    const activeAdmins = await User.countDocuments({ role: 'admin', status: 'active' });
    if (activeAdmins <= 1) {
      res.status(409).json({ message: 'The last active administrator cannot be blocked.' });
      return;
    }
  }

  user.status = status;
  await user.save();
  res.json({ user: serializeUser(user) });
}

export async function updateUserRole(req, res) {
  const { role } = req.body ?? {};
  if (role !== 'volunteer' && role !== 'admin') {
    res.status(400).json({ message: 'Role can only be promoted to volunteer or admin.' });
    return;
  }
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }
  if (req.params.id.toLowerCase() === req.user._id.toString()) {
    res.status(409).json({ message: 'You cannot change your own role.' });
    return;
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }
  if (
    user.role === 'donor'
    && user.donorVerificationStatus
    && user.donorVerificationStatus !== 'verified'
  ) {
    res.status(409).json({ message: 'A donor must be verified before being promoted.' });
    return;
  }
  const canPromoteToVolunteer = user.role === 'donor' && role === 'volunteer';
  const canPromoteToAdmin = (user.role === 'donor' || user.role === 'volunteer') && role === 'admin';
  if (!canPromoteToVolunteer && !canPromoteToAdmin) {
    res.status(409).json({ message: 'This account cannot be promoted to the selected role.' });
    return;
  }

  user.role = role;
  await user.save();
  res.json({ user: serializeUser(user) });
}

export async function getDonorVerificationQueue(req, res) {
  const users = await User.find({
    role: 'donor',
    donorVerificationStatus: 'pending',
  })
    .select('name email avatar bloodGroup district upazila createdAt')
    .sort({ createdAt: 1 })
    .limit(100);
  res.json({
    applications: users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar || '',
      bloodGroup: user.bloodGroup,
      district: user.district,
      upazila: user.upazila,
      submittedAt: user.createdAt,
    })),
  });
}

export async function getDonorVerificationDocument(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ message: 'Verification application not found.' });
    return;
  }
  const user = await User.findOne({
    _id: req.params.id,
    role: 'donor',
    donorVerificationStatus: 'pending',
  }).select('+birthCertificate +birthCertificateMimeType');
  if (!user?.birthCertificate || !user.birthCertificateMimeType) {
    res.status(404).json({ message: 'The private verification document is unavailable.' });
    return;
  }

  res.set({
    'Cache-Control': 'private, no-store, max-age=0',
    'Content-Type': user.birthCertificateMimeType,
    'Content-Disposition': 'inline',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; sandbox",
  });
  res.send(user.birthCertificate);
}

export async function reviewDonorVerification(req, res) {
  const { status } = req.body ?? {};
  if (status !== 'verified' && status !== 'rejected') {
    res.status(400).json({ message: 'Review status must be verified or rejected.' });
    return;
  }
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ message: 'Verification application not found.' });
    return;
  }

  const user = await User.findOne({
    _id: req.params.id,
    role: 'donor',
    donorVerificationStatus: 'pending',
  }).select('+birthCertificate +birthCertificateMimeType +dateOfBirth');
  if (!user) {
    res.status(404).json({ message: 'Pending verification application not found.' });
    return;
  }
  if (status === 'verified') {
    if (!user.birthCertificate || !user.birthCertificateMimeType) {
      res.status(409).json({ message: 'The verification document is unavailable; the application cannot be approved.' });
      return;
    }
    const birthDate = new Date(`${user.dateOfBirth}T00:00:00.000Z`);
    const adultDate = new Date(Date.UTC(
      birthDate.getUTCFullYear() + 18,
      birthDate.getUTCMonth(),
      birthDate.getUTCDate(),
    ));
    if (!user.dateOfBirth || Number.isNaN(adultDate.getTime()) || adultDate > new Date()) {
      res.status(409).json({ message: 'The applicant does not meet the minimum age requirement.' });
      return;
    }
  }

  const reviewedUser = await User.findOneAndUpdate(
    {
      _id: user._id,
      role: 'donor',
      donorVerificationStatus: 'pending',
    },
    {
      $set: { donorVerificationStatus: status },
      $unset: {
        birthCertificate: 1,
        birthCertificateMimeType: 1,
        dateOfBirth: 1,
      },
    },
    { new: true, runValidators: true },
  );
  if (!reviewedUser) {
    res.status(409).json({ message: 'This verification application has already been reviewed.' });
    return;
  }
  res.json({ user: serializeUser(reviewedUser), donorVerificationStatus: status });
}
