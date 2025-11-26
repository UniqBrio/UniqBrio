import { Schema, Model } from 'mongoose';
import { requireTenantId, getTenantContext } from './tenant-context';

/**
 * Mongoose plugin to add tenant isolation to all models
 * Automatically adds tenantId field and filters all queries by tenant
 */
export function tenantPlugin(schema: Schema) {
  // Add tenantId field if it doesn't exist
  if (!schema.path('tenantId')) {
    schema.add({
      tenantId: {
        type: String,
        required: true,
        index: true,
      },
    });
  }

  // Add compound indexes for common query patterns
  schema.index({ tenantId: 1, createdAt: -1 });
  schema.index({ tenantId: 1, updatedAt: -1 });

  /**
   * Pre-save hook: Automatically set tenantId from context
   */
  schema.pre('save', function (next) {
    // Only set tenantId if it's not already set (for new documents)
    if (this.isNew && !this.tenantId) {
      try {
        const context = getTenantContext();
        if (context?.tenantId) {
          this.tenantId = context.tenantId;
        } else {
          // Allow save without tenantId for seed/default data
          // Use 'default' as fallback for initial data
          this.tenantId = 'default';
        }
      } catch (error) {
        // If no tenant context, use 'default' for backward compatibility
        this.tenantId = 'default';
      }
    }
    next();
  });

  /**
   * Pre-find hooks: Automatically filter by tenantId
   */
  const queryMethods = [
    'find',
    'findOne',
    'findOneAndUpdate',
    'findOneAndDelete',
    'findOneAndRemove',
    'findOneAndReplace',
    'count',
    'countDocuments',
    'estimatedDocumentCount',
    'updateOne',
    'updateMany',
    'deleteOne',
    'deleteMany',
  ];

  queryMethods.forEach((method) => {
    schema.pre(method as any, function (this: any, next: (error?: Error) => void) {
      const query = this.getQuery();
      
      // If tenantId is already explicitly set in query, allow it
      if (query.tenantId || query.$or?.some((q: any) => 'tenantId' in q)) {
        // Query already has tenantId, proceed
        return next();
      }
      
      // Try to get tenantId from AsyncLocalStorage context
      try {
        const tenantId = requireTenantId();
        this.setQuery({ ...query, tenantId });
        next();
      } catch (error) {
        // SECURITY: Block query if no tenant context AND no explicit tenantId
        // Only allow for system operations with explicit 'SYSTEM' marker
        if (query.__allowSystemQuery === true) {
          delete query.__allowSystemQuery;
          next();
        } else {
          console.error(`[TenantPlugin] BLOCKED: Query without tenant context: ${method}`);
          return next(new Error('Tenant context is required for data access. Please ensure you are logged in.'));
        }
      }
    });
  });

  /**
   * Pre-aggregate hook: Add tenant filter to pipeline
   */
  schema.pre('aggregate', function (this: any, next: (error?: Error) => void) {
    try {
      const tenantId = requireTenantId();
      // Add $match stage at the beginning of pipeline
      this.pipeline().unshift({ $match: { tenantId } });
    } catch (error) {
      console.warn('[TenantPlugin] Aggregation without tenant context');
    }
    next();
  });
}

/**
 * Apply tenant plugin to a model
 */
export function applyTenantPlugin<T>(model: Model<T>): Model<T> {
  // The plugin should be applied at schema level before model creation
  // This function is for runtime application if needed
  if (model.schema && !model.schema.path('tenantId')) {
    tenantPlugin(model.schema);
  }
  return model;
}

/**
 * Create a tenant-aware query filter
 */
export function withTenantFilter(filter: any = {}): any {
  const context = getTenantContext();
  if (context?.tenantId) {
    return { ...filter, tenantId: context.tenantId };
  }
  return filter;
}

/**
 * Bulk operations with tenant context
 */
export async function bulkWriteWithTenant<T>(
  model: Model<T>,
  operations: any[]
): Promise<any> {
  const tenantId = requireTenantId();
  
  // Add tenantId to all operations
  const tenantOperations = operations.map((op) => {
    if (op.insertOne) {
      return {
        insertOne: {
          document: { ...op.insertOne.document, tenantId },
        },
      };
    }
    if (op.updateOne || op.updateMany) {
      const updateOp = op.updateOne || op.updateMany;
      return {
        [op.updateOne ? 'updateOne' : 'updateMany']: {
          filter: { ...updateOp.filter, tenantId },
          update: updateOp.update,
          upsert: updateOp.upsert,
        },
      };
    }
    if (op.deleteOne || op.deleteMany) {
      const deleteOp = op.deleteOne || op.deleteMany;
      return {
        [op.deleteOne ? 'deleteOne' : 'deleteMany']: {
          filter: { ...deleteOp.filter, tenantId },
        },
      };
    }
    return op;
  });

  return model.bulkWrite(tenantOperations);
}
