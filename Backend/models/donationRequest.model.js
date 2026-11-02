import mongoose from 'mongoose';
import { BLOOD_GROUPS } from './user.model.js';

export const DONATION_STATUSES = ['pending', 'inprogress', 'done', 'canceled'];

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: DONATION_STATUSES, required: true },
    changedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    changedByName: { type: String, trim: true, maxlength: 80, default: '' },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const donationRequestSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    donorName: { type: String, trim: true, maxlength: 80, default: '' },
    donorEmail: { type: String, lowercase: true, trim: true, maxlength: 254, default: '' },
    requesterName: { type: String, required: true, trim: true, maxlength: 80 },
    requesterEmail: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    recipientName: { type: String, required: true, trim: true, maxlength: 80 },
    recipientDistrict: { type: String, required: true, trim: true, maxlength: 100 },
    recipientUpazila: { type: String, required: true, trim: true, maxlength: 100 },
    hospitalName: { type: String, required: true, trim: true, maxlength: 160 },
    fullAddress: { type: String, required: true, trim: true, maxlength: 240 },
    bloodGroup: { type: String, required: true, enum: BLOOD_GROUPS },
    donationDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    donationTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    requestMessage: { type: String, required: true, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: DONATION_STATUSES,
      default: 'pending',
      required: true,
      index: true,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
  },
  { timestamps: true },
);

donationRequestSchema.index({ requesterId: 1, createdAt: -1 });

export default mongoose.models.DonationRequest
  || mongoose.model('DonationRequest', donationRequestSchema);
