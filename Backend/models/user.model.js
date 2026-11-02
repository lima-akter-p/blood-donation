import mongoose from 'mongoose';

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const USER_ROLES = ['donor', 'volunteer', 'admin'];
export const USER_STATUSES = ['active', 'blocked'];

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    avatar: {
      type: String,
      default: '',
      maxlength: 2048,
    },
    bloodGroup: {
      type: String,
      required: true,
      enum: BLOOD_GROUPS,
    },
    district: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    upazila: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
      maxlength: 14,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    nextAvailableDate: {
      type: String,
      default: '',
      match: /^(?:\d{4}-\d{2}-\d{2})?$/,
    },
    password: {
      type: String,
      select: false,
    },
    authProviders: {
      type: [{ type: String, enum: ['password', 'google'] }],
      default: ['password'],
      required: true,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'donor',
      required: true,
    },
    status: {
      type: String,
      enum: USER_STATUSES,
      default: 'active',
      required: true,
    },
  },
  { timestamps: true },
);

userSchema.index({
  role: 1,
  status: 1,
  bloodGroup: 1,
  district: 1,
  upazila: 1,
  isAvailable: 1,
  nextAvailableDate: 1,
});

export default mongoose.models.User || mongoose.model('User', userSchema);
