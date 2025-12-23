/**
 * Script to find which database contains the user
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import UserModel from '@/models/User';

const email = 'shyamsivu2003@gmail.com';

async function findUserDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment');
    }

    const databases = ['uniqbrio', 'uniqbrio-admin', 'test', 'admin'];

    console.log('🔍 Searching for user across databases...\n');

    for (const dbName of databases) {
      try {
        console.log(`Checking database: ${dbName}`);
        
        if (mongoose.connection.readyState === 1) {
          await mongoose.connection.close();
        }
        
        await mongoose.connect(mongoUri + '/' + dbName);
        
        const user = await UserModel.findOne({ email: email.toLowerCase().trim() }).lean();
        
        if (user) {
          console.log(`\n✅ FOUND USER IN DATABASE: ${dbName}`);
          console.log('='.repeat(60));
          console.log('Name:', user.name);
          console.log('Email:', user.email);
          console.log('Verified:', user.verified ? '✅ YES' : '❌ NO');
          console.log('Has Token:', user.verificationToken ? '✅ YES' : '❌ NO');
          if (user.verificationToken) {
            console.log('Token (first 10):', user.verificationToken.substring(0, 10) + '...');
          }
          console.log('Created:', new Date(user.createdAt).toLocaleString());
          console.log('='.repeat(60));
          await mongoose.connection.close();
          return;
        } else {
          console.log(`  ❌ Not found in ${dbName}`);
        }
        
      } catch (err) {
        console.log(`  ⚠️  Error checking ${dbName}:`, err instanceof Error ? err.message : String(err));
      }
    }

    console.log('\n❌ User not found in any database');
    await mongoose.connection.close();

  } catch (error) {
    console.error('❌ Error:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

findUserDatabase();
