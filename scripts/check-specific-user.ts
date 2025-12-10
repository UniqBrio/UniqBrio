/**
 * Check specific user details
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined');
  process.exit(1);
}

async function checkUser() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: 'uniqbrio' });
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('User');

    // Check for the specific email
    const user = await usersCollection.findOne({ email: 'shaziafarheen75@gmail.com' });
    
    if (user) {
      console.log('\n📧 Found user with email shaziafarheen75@gmail.com:');
      console.log(JSON.stringify(user, null, 2));
    } else {
      console.log('\n❌ No user found with email shaziafarheen75@gmail.com');
    }

    // Also check shaziafarheen74@gmail.com
    const user74 = await usersCollection.findOne({ email: 'shaziafarheen74@gmail.com' });
    
    if (user74) {
      console.log('\n📧 Found user with email shaziafarheen74@gmail.com:');
      console.log(JSON.stringify(user74, null, 2));
    } else {
      console.log('\n❌ No user found with email shaziafarheen74@gmail.com');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUser();
