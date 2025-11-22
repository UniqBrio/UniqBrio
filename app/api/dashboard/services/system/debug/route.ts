import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import { Course } from "@/models/dashboard"

export async function GET() {
  try {
    // Test MongoDB connection
    await dbConnect("uniqbrio")
    console.log('✅ MongoDB connection successful')
    
    // Test collection access
    const courseCount = await Course.countDocuments()
    console.log(`📊 Found ${courseCount} courses in database`)
    
    // Test database name
    const mongoose = require('mongoose')
    const dbName = mongoose.connection.db.databaseName
    console.log(`🗄️ Connected to database: ${dbName}`)
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray()
    const collectionNames = collections.map((col: any) => col.name)
    console.log(`📁 Available collections: ${collectionNames.join(', ')}`)
    
    return NextResponse.json({
      success: true,
      debug: {
        mongodbConnected: true,
        databaseName: dbName,
        collections: collectionNames,
        courseCount: courseCount,
        mongoUri: process.env.MONGODB_URI ? 'SET' : 'NOT SET'
      }
    })
    
  } catch (error) {
    console.error('❌ Database connection error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        mongodbConnected: false,
        mongoUri: process.env.MONGODB_URI ? 'SET' : 'NOT SET'
      }
    }, { status: 500 })
  }
}
