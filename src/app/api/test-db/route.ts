import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Testing MongoDB connection on Vercel...');
    console.log('Environment:', {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      hasMongoUri: !!process.env.MONGODB_URI,
      mongoUriStart: process.env.MONGODB_URI?.substring(0, 20) + '...'
    });

    const client = await clientPromise;
    console.log('✅ Connected to MongoDB client');
    
    const db = client.db('Altzheimer');
    console.log('✅ Connected to Altzheimer database');
    
    // Test collections
    const collections = await db.listCollections().toArray();
    console.log('📋 Collections found:', collections.map(c => c.name));
    
    // Test users collection specifically
    const usersCollection = db.collection('users');
    const userCount = await usersCollection.countDocuments();
    console.log('👥 Total users in collection:', userCount);
    
    // Test finding a specific user (without exposing data)
    const testUser = await usersCollection.findOne(
      { email: 'fangalasso@gmail.com' },
      { projection: { _id: 1, email: 1, isActive: 1, role: 1 } }
    );
    console.log('🔍 Test user found:', !!testUser, testUser ? {
      hasId: !!testUser._id,
      email: testUser.email,
      isActive: testUser.isActive,
      role: testUser.role
    } : null);

    return NextResponse.json({
      success: true,
      environment: process.env.NODE_ENV,
      collections: collections.map(c => c.name),
      userCount,
      testUserFound: !!testUser
    });

  } catch (error: unknown) {
    const err = error as Error & { code?: string };
    console.error('❌ MongoDB Test Error:', err);
    
    return NextResponse.json({
      success: false,
      error: err.message,
      errorName: err.name,
      errorCode: err.code,
      stack: err.stack?.split('\n').slice(0, 3) // First 3 lines of stack
    }, { status: 500 });
  }
}