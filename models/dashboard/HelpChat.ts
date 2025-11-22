import mongoose, { Document, Model, Schema } from 'mongoose';

// Message Interface for chat messages
export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// HelpChat Interface
export interface IHelpChat extends Document {
  chatId: string;
  name: string;
  userId?: string; // Optional: link to user if authenticated
  messages: IChatMessage[];
  lastMessageAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// ChatMessage Sub-schema
const chatMessageSchema = new Schema<IChatMessage>({
  role: {
    type: String,
    required: true,
    enum: ['user', 'assistant']
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 10000
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  }
}, { _id: false });

// HelpChat Schema
const helpChatSchema = new Schema<IHelpChat>({
  chatId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 200,
    default: 'New Conversation'
  },
  userId: {
    type: String,
    trim: true
  },
  messages: {
    type: [chatMessageSchema],
    default: []
  },
  lastMessageAt: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
// Note: chatId index is created by unique: true constraint
helpChatSchema.index({ userId: 1 });
helpChatSchema.index({ lastMessageAt: -1 });
helpChatSchema.index({ createdAt: -1 });

// Pre-save middleware to auto-generate chatId and update lastMessageAt
helpChatSchema.pre('save', function(next) {
  // Auto-generate chatId if not provided
  if (!this.chatId) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.chatId = `CHAT-${timestamp}${random}`;
  }
  
  // Update lastMessageAt if messages exist
  if (this.messages && this.messages.length > 0) {
    const lastMessage = this.messages[this.messages.length - 1];
    this.lastMessageAt = lastMessage.timestamp;
  }
  
  // Auto-generate name from first user message if not set
  if (this.name === 'New Conversation' && this.messages && this.messages.length > 0) {
    const firstUserMessage = this.messages.find(m => m.role === 'user');
    if (firstUserMessage) {
      // Use first 50 chars of first user message as name
      this.name = firstUserMessage.content.substring(0, 50) + 
                  (firstUserMessage.content.length > 50 ? '...' : '');
    }
  }
  
  next();
});

// Static method to find chats by user
helpChatSchema.statics.findByUser = function(userId: string) {
  return this.find({ userId }).sort({ lastMessageAt: -1 });
};

// Static method to find recent chats
helpChatSchema.statics.findRecent = function(limit: number = 10) {
  return this.find().sort({ lastMessageAt: -1 }).limit(limit);
};

// Method to add a message to the chat
helpChatSchema.methods.addMessage = function(role: 'user' | 'assistant', content: string) {
  const message: IChatMessage = {
    role,
    content,
    timestamp: new Date()
  };
  this.messages.push(message);
  this.lastMessageAt = message.timestamp;
  return this.save();
};

// Method to update chat name
helpChatSchema.methods.updateName = function(newName: string) {
  this.name = newName;
  return this.save();
};

// Virtual to get message count
helpChatSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// Create and export the model
const HelpChat: Model<IHelpChat> = mongoose.models.HelpChat || mongoose.model<IHelpChat>('HelpChat', helpChatSchema);

export default HelpChat;
