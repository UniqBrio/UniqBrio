/**
 * Migration Script: Add Tenant Support to Existing Data
 * 
 * This script migrates your existing two-database setup to support multi-tenancy
 * by adding tenantId field to all collections and creating necessary indexes.
 * 
 * Usage:
 *   tsx scripts/migrate-to-multi-tenant.ts
 * 
 * or
 *   npx ts-node scripts/migrate-to-multi-tenant.ts
 * 
 * Environment Variables Required:
 *   - MONGODB_URI: MongoDB connection string
 *   - DEFAULT_TENANT_ID (optional): Default tenant ID, defaults to 'default'
 */

import { migrateDatabaseToMultiTenant, verifyTenantIsolation, getTenantStats } from '@/lib/tenant/tenant-utils';
import { closeConnections } from '@/lib/mongodb';

// Configuration
const AUTH_DB_NAME = 'uniqbrio-admin'; // Your auth/KYC database
const DASHBOARD_DB_NAME = 'uniqbrio';  // Your dashboard database
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || 'default';

async function main() {
  console.log('==========================================');
  console.log('Multi-Tenant Migration Script');
  console.log('==========================================');
  console.log(`Default Tenant ID: ${DEFAULT_TENANT_ID}`);
  console.log('==========================================\n');

  try {
    // Step 1: Migrate Auth Database
    console.log('\n📊 Step 1: Migrating Auth Database...\n');
    const authResults = await migrateDatabaseToMultiTenant(
      AUTH_DB_NAME,
      DEFAULT_TENANT_ID
    );
    console.log('\n✅ Auth database migration complete!');
    console.log(`   - Collections: ${authResults.collections}`);
    console.log(`   - Total documents: ${authResults.totalDocuments}`);
    console.log(`   - Modified documents: ${authResults.modifiedDocuments}`);

    // Step 2: Migrate Dashboard Database
    console.log('\n📊 Step 2: Migrating Dashboard Database...\n');
    const dashboardResults = await migrateDatabaseToMultiTenant(
      DASHBOARD_DB_NAME,
      DEFAULT_TENANT_ID
    );
    console.log('\n✅ Dashboard database migration complete!');
    console.log(`   - Collections: ${dashboardResults.collections}`);
    console.log(`   - Total documents: ${dashboardResults.totalDocuments}`);
    console.log(`   - Modified documents: ${dashboardResults.modifiedDocuments}`);

    // Step 3: Verify Tenant Isolation
    console.log('\n🔍 Step 3: Verifying Tenant Isolation...\n');
    
    const authVerification = await verifyTenantIsolation(AUTH_DB_NAME);
    console.log(`\nAuth Database Verification:`);
    if (authVerification.success) {
      console.log('✅ All checks passed!');
    } else {
      console.log('❌ Issues found:');
      authVerification.issues.forEach(issue => console.log(`   - ${issue}`));
    }

    const dashboardVerification = await verifyTenantIsolation(DASHBOARD_DB_NAME);
    console.log(`\nDashboard Database Verification:`);
    if (dashboardVerification.success) {
      console.log('✅ All checks passed!');
    } else {
      console.log('❌ Issues found:');
      dashboardVerification.issues.forEach(issue => console.log(`   - ${issue}`));
    }

    // Step 4: Get Tenant Statistics
    console.log('\n📈 Step 4: Tenant Statistics...\n');
    
    const authStats = await getTenantStats(AUTH_DB_NAME, DEFAULT_TENANT_ID);
    console.log(`Auth Database (Tenant: ${authStats.tenantId}):`);
    console.log(`Total Documents: ${authStats.totalDocuments}`);
    console.log('Collections:');
    authStats.collections.forEach(col => {
      console.log(`   - ${col.name}: ${col.count} documents`);
    });

    const dashboardStats = await getTenantStats(DASHBOARD_DB_NAME, DEFAULT_TENANT_ID);
    console.log(`\nDashboard Database (Tenant: ${dashboardStats.tenantId}):`);
    console.log(`Total Documents: ${dashboardStats.totalDocuments}`);
    console.log('Collections:');
    dashboardStats.collections.forEach(col => {
      console.log(`   - ${col.name}: ${col.count} documents`);
    });

    // Summary
    console.log('\n==========================================');
    console.log('Migration Summary');
    console.log('==========================================');
    console.log(`Total collections migrated: ${authResults.collections + dashboardResults.collections}`);
    console.log(`Total documents processed: ${authResults.totalDocuments + dashboardResults.totalDocuments}`);
    console.log(`Total documents modified: ${authResults.modifiedDocuments + dashboardResults.modifiedDocuments}`);
    console.log(`\nTenant ID: ${DEFAULT_TENANT_ID}`);
    console.log(`Auth DB documents: ${authStats.totalDocuments}`);
    console.log(`Dashboard DB documents: ${dashboardStats.totalDocuments}`);
    console.log('==========================================');

    // Final checks
    if (authVerification.success && dashboardVerification.success) {
      console.log('\n✅ Migration completed successfully!');
      console.log('\n📝 Next Steps:');
      console.log('   1. Update your middleware.ts to use tenant context');
      console.log('   2. Test your application thoroughly');
      console.log('   3. Monitor database queries for tenant isolation');
      console.log('   4. Consider adding tenant selection UI for users');
    } else {
      console.log('\n⚠️  Migration completed with warnings.');
      console.log('   Please review the issues above and fix them manually.');
    }

  } catch (error) {
    console.error('\n❌ Migration failed with error:');
    console.error(error);
    process.exit(1);
  } finally {
    // Cleanup connections
    await closeConnections();
    console.log('\n🔌 Database connections closed.');
  }
}

// Run the migration
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ Script execution complete.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script execution failed:', error);
      process.exit(1);
    });
}

export default main;
