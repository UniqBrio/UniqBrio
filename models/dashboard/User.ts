import mongoose, { Schema, Document, Model } from 'mongoose';

// User interfaces
export interface IUserPreferences {
  theme: 'light' | 'dark';
  language: string;
  notifications: {
    push: boolean;
    sms: boolean;
    email: boolean;
    classReminders: boolean;
    cancellations: boolean;
    rescheduling: boolean;
    assignments: boolean;
  };
  pinnedMenuItems: string[];
}

export interface IUser extends Document {
  _id: string;
  studentId?: string;  // For students - unique identifier like STU0009
  name: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email: string;
  password?: string;
  role: 'admin' | 'instructor' | 'student' | 'parent';
  avatar?: string;
  phone?: string;
  mobile?: string;
  countryCode?: string;
  country?: string;
  stateProvince?: string;
  dob?: Date;
  dateOfBirth?: Date;
  gender?: string;
  courseOfInterestId?: string;
  enrolledCourseNames?: string[];
  address?: string | {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  preferences: IUserPreferences;
  children?: string[]; // For parents - array of user IDs
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  enrolledCourses?: string[]; // Array of course IDs
  instructorProfile?: {
    bio: string;
    expertise: string[];
    experience: number;
    certifications: string[];
    rating: number;
    totalStudents: number;
    badges?: {
      id: string;
      name: string;
      description: string;
      icon: string;
      color: string;
      criteria: string;
      earnedAt: Date;
    }[];
  };
  studentProfile?: {
    grade?: string;
    school?: string;
    parentId?: string;
    learningStyle?: string;
    goals: string[];
    achievements: string[];
  };
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// User Preferences Schema
const userPreferencesSchema = new Schema<IUserPreferences>({
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  },
  language: {
    type: String,
    default: 'en'
  },
  notifications: {
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    classReminders: { type: Boolean, default: true },
    cancellations: { type: Boolean, default: true },
    rescheduling: { type: Boolean, default: true },
    assignments: { type: Boolean, default: true }
  },
  pinnedMenuItems: [{
    type: String
  }]
});

// Address Schema
const addressSchema = new Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  zipCode: { type: String, required: true }
});

// Emergency Contact Schema
const emergencyContactSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  relationship: { type: String, required: true }
});

// Instructor Badge Schema
const instructorBadgeSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  color: { type: String, required: true },
  criteria: { type: String, required: true },
  earnedAt: { type: Date, required: true }
});

// Instructor Profile Schema
const instructorProfileSchema = new Schema({
  bio: { type: String, required: true },
  expertise: [{ type: String }],
  experience: { type: Number, required: true },
  certifications: [{ type: String }],
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalStudents: { type: Number, default: 0 },
  badges: [instructorBadgeSchema]
});

// Student Profile Schema
const studentProfileSchema = new Schema({
  grade: { type: String },
  school: { type: String },
  parentId: { type: Schema.Types.ObjectId, ref: 'User' },
  learningStyle: { type: String },
  goals: [{ type: String }],
  achievements: [{ type: String }]
});

// Main User Schema
const userSchema = new Schema<IUser>({
  studentId: {
    type: String,
    sparse: true,  // Allow multiple null values but enforce uniqueness for non-null values
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  firstName: {
    type: String,
    trim: true
  },
  middleName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function(this: IUser) {
      return this.role !== 'student' || !this.studentProfile?.parentId;
    }
  },
  role: {
    type: String,
    enum: ['admin', 'instructor', 'student', 'parent'],
    required: true
  },
  avatar: {
    type: String
  },
  phone: {
    type: String,
    trim: true
  },
  mobile: {
    type: String,
    trim: true
  },
  countryCode: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  },
  stateProvince: {
    type: String,
    trim: true
  },
  dob: {
    type: Date
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    trim: true
  },
  courseOfInterestId: {
    type: String,
    trim: true
  },
  enrolledCourseNames: [{
    type: String
  }],
  address: {
    type: Schema.Types.Mixed  // Can be either string or object
  },
  preferences: {
    type: userPreferencesSchema,
    default: () => ({})
  },
  children: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  emergencyContact: emergencyContactSchema,
  enrolledCourses: [{
    type: Schema.Types.ObjectId,
    ref: 'Course'
  }],
  instructorProfile: instructorProfileSchema,
  studentProfile: studentProfileSchema,
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ 'instructorProfile.expertise': 1 });
userSchema.index({ isActive: 1 });

// Methods
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Static methods
userSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email });
};

userSchema.statics.findInstructors = function() {
  return this.find({ role: 'instructor', isActive: true });
};

userSchema.statics.findStudents = function() {
  return this.find({ role: 'student', isActive: true });
};

// Create and export the model
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;
