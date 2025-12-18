import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Define schema directly in script
const AdminPaymentRecordSchema = new mongoose.Schema({
  businessName: String,
  ownerAdminName: String,
  academyId: String,
  userId: String,
  email: String,
  phone: String,
  plan: String,
  studentSize: Number,
  startDate: Date,
  endDate: Date,
  status: String,
  amount: Number,
  dueMonth: String,
  isRead: Boolean,
  planStatus: String,
  daysRemaining: Number,
  isOverdue: Boolean,
}, { timestamps: true, collection: 'Admin_Payment_record' });

const AdminPaymentRecordModel = mongoose.models.AdminPaymentRecord || 
  mongoose.model('AdminPaymentRecord', AdminPaymentRecordSchema);

async function updateAllPaymentStatuses() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment');
    process.exit(1);
  }
  
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    
    if (!mongoose.connection.db) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }
    
    console.log(`Connected to database: ${mongoose.connection.db.databaseName}`);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name).join(', '));
    
    // Direct count from collection
    const directCount = await mongoose.connection.db.collection('Admin_Payment_record').countDocuments();
    console.log(`Direct count from Admin_Payment_record: ${directCount}`);
    
    // Sample one document to see structure
    const sampleDoc = await mongoose.connection.db.collection('Admin_Payment_record').findOne({});
    if (sampleDoc) {
      console.log('Sample document keys:', Object.keys(sampleDoc).join(', '));
    }
    
    console.log('\nFetching all payment records...');
    const records = await AdminPaymentRecordModel.find({});
    console.log(`Found ${records.length} records via model`);
    
    let updated = 0;
    for (const record of records) {
      // Calculate status based on dates
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      const start = new Date(record.startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(record.endDate);
      end.setHours(0, 0, 0, 0);
      
      // Calculate planStatus
      let planStatus: "upcoming" | "active" | "expired";
      if (now < start) {
        planStatus = "upcoming";
      } else if (now >= start && now <= end) {
        planStatus = "active";
      } else {
        planStatus = "expired";
      }
      
      // Calculate days remaining
      const diffTime = end.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Calculate isOverdue
      const isOverdue = planStatus === "expired" && record.status === "pending";
      
      // Update record
      record.planStatus = planStatus;
      record.daysRemaining = daysRemaining;
      record.isOverdue = isOverdue;
      
      await record.save({ validateBeforeSave: false });
      updated++;
      
      console.log(`Updated record ${record.academyId} - ${record.plan}: ${planStatus}, ${daysRemaining} days, overdue: ${isOverdue}`);
    }
    
    console.log(`\n✅ Successfully updated ${updated} payment records`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating payment statuses:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

updateAllPaymentStatuses();
