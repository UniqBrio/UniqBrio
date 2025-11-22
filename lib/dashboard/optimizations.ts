import { NextRequest, NextResponse } from 'next/server';

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function createRateLimit(
  limit: number = 100,
  windowMs: number = 60000,
  keyGenerator: (req: NextRequest) => string = (req) => req.headers.get('x-forwarded-for') || 'unknown'
) {
  return (req: NextRequest): boolean => {
    const key = keyGenerator(req);
    const now = Date.now();
    const userLimit = rateLimitStore.get(key);
    
    if (!userLimit || now > userLimit.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (userLimit.count >= limit) {
      return false;
    }
    
    userLimit.count++;
    return true;
  };
}

// Database optimization utilities
export class DatabaseOptimizer {
  static createCompoundIndexes() {
    return {
      // Course indexes for common query patterns
      courses: [
        { status: 1, category: 1, rating: -1 },
        { instructor: 1, isPublished: 1, createdAt: -1 },
        { featured: 1, trending: 1, rating: -1 },
        { 'tags': 1, 'skills': 1 },
        { price: 1, level: 1, category: 1 },
        { enrollmentCount: -1, rating: -1 },
        { title: 'text', description: 'text', tags: 'text' } // Text search index
      ],
      
      // Enrollment indexes
      enrollments: [
        { studentId: 1, status: 1, enrollmentDate: -1 },
        { courseId: 1, paymentStatus: 1 },
        { instructorId: 1, status: 1 },
        { studentId: 1, courseId: 1 }, // Compound unique index
      ],
      
      // Schedule indexes
      schedules: [
        { instructor: 1, date: 1, startTime: 1 },
        { courseId: 1, status: 1, date: 1 },
        { date: 1, status: 1 },
        { registeredStudents: 1 }
      ]
    };
  }

  static getOptimizedAggregationPipelines() {
    return {
      // Course statistics with enrollments
      courseStats: [
        {
          $lookup: {
            from: 'enrollments',
            localField: '_id',
            foreignField: 'courseId',
            as: 'enrollments'
          }
        },
        {
          $addFields: {
            totalEnrollments: { $size: '$enrollments' },
            activeEnrollments: {
              $size: {
                $filter: {
                  input: '$enrollments',
                  cond: { $eq: ['$$this.status', 'Active'] }
                }
              }
            },
            totalRevenue: {
              $sum: {
                $map: {
                  input: '$enrollments',
                  in: '$$this.paidAmount'
                }
              }
            }
          }
        },
        {
          $project: {
            enrollments: 0 // Remove the heavy array field
          }
        }
      ],

      // Instructor performance analytics
      instructorPerformance: [
        {
          $group: {
            _id: '$instructor',
            totalCourses: { $sum: 1 },
            avgRating: { $avg: '$rating' },
            totalStudents: { $sum: '$enrollmentCount' },
            totalRevenue: { $sum: { $multiply: ['$price', '$enrollmentCount'] } }
          }
        },
        {
          $sort: { avgRating: -1, totalRevenue: -1 }
        }
      ],

      // Popular categories
      categoryStats: [
        {
          $group: {
            _id: '$category',
            courseCount: { $sum: 1 },
            avgPrice: { $avg: '$price' },
            avgRating: { $avg: '$rating' },
            totalEnrollments: { $sum: '$enrollmentCount' }
          }
        },
        {
          $sort: { courseCount: -1 }
        }
      ]
    };
  }

  static async optimizeQuery(model: any, query: any, options: any = {}) {
    const {
      page = 1,
      limit = 10,
      sort = { createdAt: -1 },
      populate = [],
      select = '',
      lean = true
    } = options;

    const skip = (page - 1) * Math.min(limit, 100); // Max 100 items per page

    let queryBuilder = model.find(query);

    if (select) {
      queryBuilder = queryBuilder.select(select);
    }

    if (populate.length > 0) {
      populate.forEach((pop: any) => {
        queryBuilder = queryBuilder.populate(pop);
      });
    }

    if (lean) {
      queryBuilder = queryBuilder.lean();
    }

    // Execute query with pagination
    const [results, total] = await Promise.all([
      queryBuilder
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      model.countDocuments(query)
    ]);

    return {
      results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }
}

// Response compression middleware
export function compress(data: any): any {
  // Remove null/undefined values and optimize object structure
  if (Array.isArray(data)) {
    return data.map(item => compress(item)).filter(Boolean);
  }
  
  if (data && typeof data === 'object') {
    const compressed: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined && value !== '') {
        if (typeof value === 'object') {
          const compressedValue = compress(value);
          if (Object.keys(compressedValue).length > 0) {
            compressed[key] = compressedValue;
          }
        } else {
          compressed[key] = value;
        }
      }
    }
    
    return compressed;
  }
  
  return data;
}

// API response formatter
export function formatApiResponse(
  success: boolean,
  data?: any,
  error?: string,
  meta?: any
) {
  const response: any = { success };
  
  if (success && data !== undefined) {
    response.data = compress(data);
  }
  
  if (!success && error) {
    response.error = error;
  }
  
  if (meta) {
    response.meta = meta;
  }
  
  return response;
}

// Caching strategies
export class CacheStrategy {
  static readonly TTL = {
    SHORT: 300,    // 5 minutes
    MEDIUM: 1800,  // 30 minutes
    LONG: 3600,    // 1 hour
    DAY: 86400     // 24 hours
  };

  static getCacheKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as Record<string, any>);
    
    return `${prefix}:${Buffer.from(JSON.stringify(sortedParams)).toString('base64')}`;
  }

  static shouldCache(method: string, status: number): boolean {
    return method === 'GET' && status >= 200 && status < 300;
  }
}

export default {
  createRateLimit,
  DatabaseOptimizer,
  compress,
  formatApiResponse,
  CacheStrategy
};
