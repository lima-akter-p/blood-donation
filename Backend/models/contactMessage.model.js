import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 24, default: '' },
    subject: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    message: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

contactMessageSchema.index({ createdAt: -1 });

export default mongoose.models.ContactMessage
  || mongoose.model('ContactMessage', contactMessageSchema);
