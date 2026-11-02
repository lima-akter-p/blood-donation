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
