import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, index: true },
    studentName: { type: String, required: true },
    type: {
      type: String,
      enum: ['payment_received', 'payment_reminder', 'payment_completed', 'general'],
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ['email', 'in-app', 'sms'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    metadata: {
      paymentId: { type: String },
      amount: { type: Number },
      dueAmount: { type: Number },
      dueDate: { type: Date },
      invoiceUrl: { type: String },
      courseName: { type: String },
    },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
    sent: { type: Boolean, default: false },
    sentAt: { type: Date },
    error: { type: String },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
NotificationSchema.index({ studentId: 1, createdAt: -1 });
NotificationSchema.index({ studentId: 1, read: 1 });
NotificationSchema.index({ type: 1, sent: 1 });

const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

export default Notification;
