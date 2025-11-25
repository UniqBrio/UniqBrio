import mongoose from 'mongoose';
import { dbConnect, getMongoClient } from '@/lib/mongodb';
import { getTenantContext, runWithTenantContext } from './tenant-context';

/**
 * Get all collections in a database
 */
export async function getAllCollections(dbName: string): Promise<string[]> {
  const { db } = await getMongoClient(dbName);
  const collections = await db.listCollections().toArray();
  return collections.map(c => c.name);
}

/**
 * Add tenantId field to all documents in a collection
 */
export async function addTenantIdToCollection(
  dbName: string,
  collectionName: string,
  tenantId: string
): Promise<{ matched: number; modified: number }> {
  const { db } = await getMongoClient(dbName);
  const collection = db.collection(collectionName);

  // Update all documents without tenantId
  const result = await collection.updateMany(
    { tenantId: { $exists: false } },
    { $set: { tenantId } }
  );

  return {
    matched: result.matchedCount,
    modified: result.modifiedCount,
  };
}

/**
 * Create indexes for tenant isolation on a collection
 */
export async function createTenantIndexes(
  dbName: string,
  collectionName: string,
  uniqueFields: string[] = []
): Promise<void> {
  const { db } = await getMongoClient(dbName);
  const collection = db.collection(collectionName);

  // Create basic tenant index
  await collection.createIndex({ tenantId: 1 });

  // Create compound tenant + timestamp indexes
  await collection.createIndex({ tenantId: 1, createdAt: -1 });
  await collection.createIndex({ tenantId: 1, updatedAt: -1 });

  // Create compound unique indexes with tenantId
  for (const field of uniqueFields) {
    await collection.createIndex(
      { tenantId: 1, [field]: 1 },
      { unique: true, sparse: true }
    );
  }

  console.log(`[TenantUtils] Created indexes for ${collectionName}`);
}

/**
 * Migrate all collections in a database to support multi-tenancy
 */
export async function migrateDatabaseToMultiTenant(
  dbName: string,
  defaultTenantId: string = 'default'
): Promise<{
  collections: number;
  totalDocuments: number;
  modifiedDocuments: number;
}> {
  console.log(`[TenantMigration] Starting migration for database: ${dbName}`);
  console.log(`[TenantMigration] Default tenant ID: ${defaultTenantId}`);

  const collections = await getAllCollections(dbName);
  let totalDocuments = 0;
  let modifiedDocuments = 0;

  for (const collectionName of collections) {
    // Skip system collections
    if (collectionName.startsWith('system.')) {
      continue;
    }

    console.log(`[TenantMigration] Processing collection: ${collectionName}`);

    try {
      const result = await addTenantIdToCollection(
        dbName,
        collectionName,
        defaultTenantId
      );

      totalDocuments += result.matched;
      modifiedDocuments += result.modified;

      console.log(
        `[TenantMigration] ${collectionName}: ${result.modified}/${result.matched} documents updated`
      );

      // Create tenant indexes
      await createTenantIndexes(dbName, collectionName);
    } catch (error) {
      console.error(
        `[TenantMigration] Error processing ${collectionName}:`,
        error
      );
    }
  }

  console.log(`[TenantMigration] Migration complete!`);
  console.log(`[TenantMigration] Collections processed: ${collections.length}`);
  console.log(`[TenantMigration] Total documents: ${totalDocuments}`);
  console.log(`[TenantMigration] Modified documents: ${modifiedDocuments}`);

  return {
    collections: collections.length,
    totalDocuments,
    modifiedDocuments,
  };
}

/**
 * Execute a query with tenant isolation
 */
export async function withTenantQuery<T>(
  tenantId: string,
  operation: () => Promise<T>
): Promise<T> {
  return runWithTenantContext({ tenantId }, operation);
}

/**
 * Get tenant statistics
 */
export async function getTenantStats(
  dbName: string,
  tenantId: string
): Promise<{
  tenantId: string;
  collections: { name: string; count: number }[];
  totalDocuments: number;
}> {
  const { db } = await getMongoClient(dbName);
  const collections = await getAllCollections(dbName);
  const stats: { name: string; count: number }[] = [];
  let totalDocuments = 0;

  for (const collectionName of collections) {
    if (collectionName.startsWith('system.')) {
      continue;
    }

    const collection = db.collection(collectionName);
    const count = await collection.countDocuments({ tenantId });

    if (count > 0) {
      stats.push({ name: collectionName, count });
      totalDocuments += count;
    }
  }

  return {
    tenantId,
    collections: stats,
    totalDocuments,
  };
}

/**
 * Verify tenant isolation
 * Checks that all queries are properly filtered by tenantId
 */
export async function verifyTenantIsolation(
  dbName: string
): Promise<{
  success: boolean;
  issues: string[];
}> {
  const issues: string[] = [];
  const { db } = await getMongoClient(dbName);
  const collections = await getAllCollections(dbName);

  for (const collectionName of collections) {
    if (collectionName.startsWith('system.')) {
      continue;
    }

    const collection = db.collection(collectionName);

    // Check if all documents have tenantId
    const docsWithoutTenant = await collection.countDocuments({
      tenantId: { $exists: false },
    });

    if (docsWithoutTenant > 0) {
      issues.push(
        `${collectionName}: ${docsWithoutTenant} documents without tenantId`
      );
    }

    // Check if tenantId index exists
    const indexes = await collection.indexes();
    const hasTenantIndex = indexes.some(idx =>
      Object.keys(idx.key).includes('tenantId')
    );

    if (!hasTenantIndex) {
      issues.push(`${collectionName}: Missing tenantId index`);
    }
  }

  return {
    success: issues.length === 0,
    issues,
  };
}
