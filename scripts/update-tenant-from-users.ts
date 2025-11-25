/**
 * Script: Update Tenant IDs from User Data
 * 
 * This script analyzes your existing users and updates tenantId
 * based on existing organizational/academy identifiers in your data.
 * 
 * Usage:
 *   npm run update:tenant
 */

import mongoose from 'mongoose';
import { dbConnect, closeConnections } from '@/lib/mongodb';

interface TenantMapping {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
}

async function analyzeAndUpdateTenants() {
  console.log('==========================================');
  console.log('Update Tenant IDs from User Data');
  console.log('==========================================\n');

  try {
    // Connect to databases
    await dbConnect('uniqbrio');
    await dbConnect('uniqbrio-admin');
    
    const dashboardDb = mongoose.connection.useDb('uniqbrio');
    const authDb = mongoose.connection.useDb('uniqbrio-admin');

    // Step 1: Analyze users to find organizational patterns
    console.log('📊 Step 1: Analyzing user data...\n');
    
    const dashboardUsers = await dashboardDb.collection('users').find({}).toArray();
    const authUsers = await authDb.collection('User').find({}).toArray();
    
    console.log(`Found ${dashboardUsers.length} users in dashboard DB`);
    console.log(`Found ${authUsers.length} users in auth DB\n`);

    // Display sample user to understand structure
    if (dashboardUsers.length > 0) {
      const sample = dashboardUsers[0];
      console.log('Sample Dashboard User Fields:');
      console.log(Object.keys(sample).filter(k => k !== 'password').join(', '));
      console.log('\nSample User Data (first user):');
      const { password, ...safeUser } = sample;
      console.log(JSON.stringify(safeUser, null, 2).substring(0, 500) + '...\n');
    }

    if (authUsers.length > 0) {
      const sample = authUsers[0];
      console.log('\nSample Auth User Fields:');
      console.log(Object.keys(sample).filter(k => k !== 'password').join(', '));
    }

    // Step 2: Determine tenant mapping strategy
    console.log('\n📋 Step 2: Determining tenant mapping strategy...\n');
    
    // Check for common organizational fields
    const possibleTenantFields = [
      'academyId', 'academy_id', // Check academyId first (your field!)
      'organizationId', 'organization_id',
      'schoolId', 'school_id', 'companyId', 'company_id',
      'institutionId', 'institution_id'
    ];

    let tenantFieldFound: string | null = null;
    
    // Check auth users first (where academyId exists)
    for (const field of possibleTenantFields) {
      const hasField = authUsers.some(u => u[field]);
      if (hasField) {
        tenantFieldFound = field;
        const uniqueValues = Array.from(new Set(authUsers.filter(u => u[field]).map(u => u[field])));
        console.log(`✅ Found organizational field: "${field}" in auth database`);
        console.log(`   Unique values: ${uniqueValues.join(', ') || '(none)'}`);
        break;
      }
    }
    
    // Fallback to dashboard users
    if (!tenantFieldFound) {
      for (const field of possibleTenantFields) {
        const hasField = dashboardUsers.some(u => u[field]);
        if (hasField) {
          tenantFieldFound = field;
          console.log(`✅ Found organizational field: "${field}" in dashboard database`);
          break;
        }
      }
    }

    // Step 3: Create tenant mappings
    console.log('\n📝 Step 3: Creating tenant mappings...\n');
    
    const tenantMappings: Map<string, TenantMapping[]> = new Map();
    
    if (tenantFieldFound) {
      // Use existing organizational field
      console.log(`Using field "${tenantFieldFound}" for tenant mapping\n`);
      
      // Map from auth users (source of truth for academyId)
      const userEmailToTenant = new Map<string, string>();
      
      authUsers.forEach(user => {
        const tenantId = user[tenantFieldFound] || 'default';
        userEmailToTenant.set(user.email?.toLowerCase(), tenantId);
        
        if (!tenantMappings.has(tenantId)) {
          tenantMappings.set(tenantId, []);
        }
        tenantMappings.get(tenantId)!.push({
          userId: user._id.toString(),
          tenantId,
          email: user.email,
          role: user.role
        });
      });
      
      // Also map dashboard users by matching email
      dashboardUsers.forEach(user => {
        const userEmail = user.email?.toLowerCase();
        const tenantId = userEmailToTenant.get(userEmail) || user[tenantFieldFound] || 'default';
        
        if (!tenantMappings.has(tenantId)) {
          tenantMappings.set(tenantId, []);
        }
        
        // Check if not already added
        const existing = tenantMappings.get(tenantId)!.find(u => u.email === user.email);
        if (!existing) {
          tenantMappings.get(tenantId)!.push({
            userId: user._id.toString(),
            tenantId,
            email: user.email,
            role: user.role
          });
        }
      });
    } else {
      // No organizational field found - use single tenant
      console.log('⚠️  No organizational field found');
      console.log('Creating single-tenant setup with "default" tenant\n');
      
      tenantMappings.set('default', dashboardUsers.map(user => ({
        userId: user._id.toString(),
        tenantId: 'default',
        email: user.email,
        role: user.role
      })));
    }

    // Display tenant distribution
    console.log('Tenant Distribution:');
    console.log('───────────────────');
    for (const [tenantId, users] of Array.from(tenantMappings.entries())) {
      console.log(`${tenantId}: ${users.length} users`);
      // Show sample users
      users.slice(0, 3).forEach((u: TenantMapping) => {
        console.log(`  - ${u.email} (${u.role})`);
      });
      if (users.length > 3) {
        console.log(`  ... and ${users.length - 3} more`);
      }
    }

    // Step 4: Prompt for confirmation
    console.log('\n\n⚠️  IMPORTANT: Review the tenant mappings above');
    console.log('This will update ALL documents in both databases\n');
    
    console.log('If this looks correct, you can proceed with the update.');
    console.log('\nTo proceed, run this script with --execute flag:');
    console.log('  tsx --env-file=.env scripts/update-tenant-from-users.ts --execute\n');

    // Check if --execute flag is provided
    const shouldExecute = process.argv.includes('--execute');

    if (shouldExecute) {
      console.log('🚀 Executing tenant update...\n');
      
      // Update all collections in both databases
      let totalUpdated = 0;
      
      // Get all collection names
      const dashboardCollections = await dashboardDb.db!.listCollections().toArray();
      const authCollections = await authDb.db!.listCollections().toArray();
      
      console.log('Updating Dashboard Database collections:');
      for (const collInfo of dashboardCollections) {
        const collName = collInfo.name;
        const collection = dashboardDb.collection(collName);
        
        for (const [tenantId, users] of Array.from(tenantMappings.entries())) {
          // Update based on userId field if it exists
          const userIds = users.map((u: TenantMapping) => u.userId);
          
          const result = await collection.updateMany(
            { tenantId: 'default' }, // Update documents with default tenant
            { $set: { tenantId } }
          );
          
          if (result.modifiedCount > 0) {
            console.log(`  ${collName}: ${result.modifiedCount} documents updated to tenant "${tenantId}"`);
            totalUpdated += result.modifiedCount;
          }
        }
      }
      
      console.log('\nUpdating Auth Database collections:');
      for (const collInfo of authCollections) {
        const collName = collInfo.name;
        const collection = authDb.collection(collName);
        
        for (const [tenantId, users] of Array.from(tenantMappings.entries())) {
          const result = await collection.updateMany(
            { tenantId: 'default' },
            { $set: { tenantId } }
          );
          
          if (result.modifiedCount > 0) {
            console.log(`  ${collName}: ${result.modifiedCount} documents updated to tenant "${tenantId}"`);
            totalUpdated += result.modifiedCount;
          }
        }
      }
      
      console.log('\n✅ Update complete!');
      console.log(`Total documents updated: ${totalUpdated}`);
    } else {
      console.log('💡 This was a dry-run. No changes were made to the database.');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await closeConnections();
    console.log('\n🔌 Database connections closed.');
  }
}

// Run the script
if (require.main === module) {
  analyzeAndUpdateTenants()
    .then(() => {
      console.log('\n✅ Script execution complete.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script execution failed:', error);
      process.exit(1);
    });
}

export default analyzeAndUpdateTenants;
