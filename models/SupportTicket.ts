import mongoose, { Schema, Model, Document } from 'mongoose';

export enum TicketStatus {
  open = 'open',
  in_progress = 'in_progress',
  resolved = 'resolved',
  closed = 'closed',
}

export enum IssueType {
  technical = 'technical',
  billing = 'billing',
  general_inquiry = 'general_inquiry',
  bug_report = 'bug_report',
}

export interface ISupportTicket extends Document {
  email: string;
  issueType: string;
  description: string;
  ticketNumber?: string;
  status: TicketStatus;
  createdAt: Date;
  updatedAt: Date;
}

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    email: { type: String, required: true },
    issueType: { type: String, required: true },
    description: { type: String, required: true },
    ticketNumber: { type: String, unique: true, sparse: true },
    status: { 
      type: String, 
      enum: Object.values(TicketStatus),
      default: TicketStatus.open 
    },
  },
  {
    timestamps: true,
    collection: 'supporttickets',
  }
);

const SupportTicketModel: Model<ISupportTicket> = 
  mongoose.models.SupportTicket || mongoose.model<ISupportTicket>('SupportTicket', supportTicketSchema, 'supporttickets');

export default SupportTicketModel;
