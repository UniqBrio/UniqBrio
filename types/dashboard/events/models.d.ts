/// <reference types="mongoose" />

declare module '@/models/events/Event' {
  import { Model, Document } from 'mongoose';
  
  interface IEvent extends Document {
    eventId: string;
    name: string;
    sport: string;
    type: string;
    description?: string;
    startDate: Date;
    startTime: string;
    endDate: Date;
    endTime: string;
    registrationDeadline: Date;
    venue: string;
    staff: string;
    participants: number;
    maxParticipants: number;
    skillLevel: string;
    format: string;
    ageGroup: string;
    equipment?: string;
    entryFee?: number;
    prizes?: string;
    rules?: string;
    status?: string;
    isPublished: boolean;
    publishedDate?: Date;
    revenue?: number;
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    softDelete(): Promise<IEvent>;
    restore(): Promise<IEvent>;
  }
  
  const Event: Model<IEvent>;
  export default Event;
}
