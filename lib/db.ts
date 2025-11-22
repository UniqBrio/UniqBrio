import { PrismaClient } from "@prisma/client"

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { 
  prisma: PrismaClient | undefined
}

// Create a singleton Prisma client
function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
    errorFormat: 'minimal',
  })

  return client
}

// Get or create the Prisma client
function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}

export const prisma = getPrismaClient()

// Simple wrapper function for database operations with basic retry
export async function withRetry<T>(operation: () => Promise<T>, maxRetries: number = 2): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error;
      
      // Only retry on connection-related errors
      const shouldRetry = attempt < maxRetries && (
        error.message?.includes('Engine is not yet connected') || 
        error.code === 'GenericFailure' ||
        error.message?.includes('Response from the Engine was empty')
      );
      
      if (shouldRetry) {
        console.log(`🔄 Database operation failed, retrying (${attempt + 1}/${maxRetries + 1})...`)
        
        try {
          // Brief disconnect/reconnect to reset connection
          await prisma.$disconnect()
          await new Promise(resolve => setTimeout(resolve, 500))
          await prisma.$connect()
        } catch (reconnectError) {
          console.error('Reconnection error:', reconnectError)
        }
      }
    }
  }
  
  console.error(`❌ Operation failed after ${maxRetries + 1} attempts:`, lastError)
  throw lastError;
}

// Handle graceful shutdown
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    try {
      await prisma.$disconnect()
    } catch (error) {
      console.error('Error disconnecting from database:', error)
    }
  })

  process.on('SIGINT', async () => {
    try {
      await prisma.$disconnect()
    } catch (error) {
      console.error('Error disconnecting from database:', error)
    }
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    try {
      await prisma.$disconnect()
    } catch (error) {
      console.error('Error disconnecting from database:', error)
    }
    process.exit(0)
  })
}

export default prisma

