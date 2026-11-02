import mongoose from 'mongoose';
import { DONATION_STATUSES } from './donationRequest.model.js';

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DonationRequest',
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 300 },
    status: { type: String, enum: DONATION_STATUSES, required: true },
    isRead: { type: Boolean, default: false, required: true },
  },
  { timestamps: true },
);

notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export default mongoose.models.Notification
  || mongoose.model('Notification', notificationSchema);
