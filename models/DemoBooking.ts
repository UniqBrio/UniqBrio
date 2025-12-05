import mongoose, { Schema, Document } from 'mongoose';

export interface IDemoBooking extends Document {
  name: string;
  email: string;
  phone: string;
  academyType: string;
  numStudents?: number;
  status: 'pending' | 'contacted' | 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DemoBookingSchema = new Schema<IDemoBooking>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    academyType: {
      type: String,
      required: true,
      trim: true,
    },
    numStudents: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'scheduled', 'completed', 'cancelled'],
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
DemoBookingSchema.index({ email: 1 });
DemoBookingSchema.index({ status: 1 });
DemoBookingSchema.index({ createdAt: -1 });

const DemoBooking = mongoose.models.DemoBooking || mongoose.model<IDemoBooking>('DemoBooking', DemoBookingSchema);

export default DemoBooking;
