import mongoose, { Document, Model, Schema } from 'mongoose';
import { tenantPlugin } from '@/lib/tenant/tenant-plugin';

// HelpTicket Interface
export interface IHelpTicket extends Document {
  ticketId: string;
  customerEmail: string;
  contactType: 'Email' | 'Phone' | 'In Person' | 'Other';
  title: string;
  description: string;
  impact: number; // 1-4 scale
  urgency: number; // 1-4 scale
  priority: number; // Calculated: impact + urgency
  attachments: Array<{
    name: string;
    size: number;
    type: string;
    url?: string; // URL to stored file
  }>;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  assignedTo?: string;
  resolvedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// HelpTicket Schema
const helpTicketSchema = new Schema<IHelpTicket>({
  ticketId: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  contactType: {
    type: String,
    required: true,
    enum: ['Email', 'Phone', 'In Person', 'Other'],
    default: 'Email'
  },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 5000
  },
  impact: {
    type: Number,
    required: true,
    min: 1,
    max: 4,
    default: 2
  },
  urgency: {
    type: Number,
    required: true,
    min: 1,
    max: 4,
    default: 2
  },
  priority: {
    type: Number,
    required: true,
    min: 2,
    max: 8
  },
  attachments: [{
    name: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    url: {
      type: String,
      default: ''
    }
  }],
  status: {
    type: String,
    required: true,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open'
  },
  assignedTo: {
    type: String,
    trim: true
  },
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Apply tenant plugin
helpTicketSchema.plugin(tenantPlugin);

// Indexes for efficient querying
helpTicketSchema.index({ tenantId: 1, ticketId: 1 }, { unique: true });
helpTicketSchema.index({ customerEmail: 1 });
helpTicketSchema.index({ status: 1 });
helpTicketSchema.index({ priority: -1 });
helpTicketSchema.index({ createdAt: -1 });

// Pre-save middleware to auto-calculate priority
helpTicketSchema.pre('save', function(next) {
  this.priority = this.impact + this.urgency;
  
  // Auto-generate ticketId if not provided
  if (!this.ticketId) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.ticketId = `TKT-${timestamp}${random}`;
  }
  
  next();
});

// Pre-update middleware to recalculate priority if impact or urgency changed
helpTicketSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate() as any;
  if (update.$set) {
    const impact = update.$set.impact;
    const urgency = update.$set.urgency;
    if (impact !== undefined || urgency !== undefined) {
      // We'll calculate in the route handler since we need both values
    }
  }
  next();
});

// Static method to find tickets by status
helpTicketSchema.statics.findByStatus = function(status: string) {
  return this.find({ status }).sort({ priority: -1, createdAt: -1 });
};

// Static method to find tickets by email
helpTicketSchema.statics.findByEmail = function(email: string) {
  return this.find({ customerEmail: email.toLowerCase() }).sort({ createdAt: -1 });
};

// Method to mark ticket as resolved
helpTicketSchema.methods.resolve = function() {
  this.status = 'Resolved';
  this.resolvedAt = new Date();
  return this.save();
};

// Create and export the model
const HelpTicket: Model<IHelpTicket> = mongoose.models.HelpTicket || mongoose.model<IHelpTicket>('HelpTicket', helpTicketSchema);

export default HelpTicket;
