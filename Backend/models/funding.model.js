import mongoose from 'mongoose';

const fundingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    donorName: { type: String, required: true, trim: true, maxlength: 80 },
    donorEmail: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    amountPaisa: { type: Number, required: true, min: 1000, max: 50000000 },
    currency: { type: String, required: true, enum: ['BDT'], default: 'BDT' },
    tranId: { type: String, required: true, unique: true, maxlength: 30 },
    valId: { type: String, default: '' },
    bankTranId: { type: String, default: '' },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
      index: true,
    },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true },
);

fundingSchema.index({ status: 1, paidAt: -1 });

export default mongoose.models.Funding || mongoose.model('Funding', fundingSchema);
