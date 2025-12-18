import mongoose, { Schema, Model, Document } from 'mongoose';

export interface ICourse extends Document {
  academyId: string;
  userId: string;
  title: string;
  code: string;
  price?: number;
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    academyId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    price: { type: Number, min: 0, default: 0 },
    tenantId: { type: String, index: true },
  },
  {
    timestamps: true,
    collection: 'courses',
  }
);

courseSchema.index({ academyId: 1 });
courseSchema.index({ userId: 1 });
courseSchema.index({ tenantId: 1 });
courseSchema.index({ academyId: 1, price: 1 });

const CourseModel: Model<ICourse> = 
  mongoose.models.Course || mongoose.model<ICourse>('Course', courseSchema, 'courses');

export default CourseModel;
