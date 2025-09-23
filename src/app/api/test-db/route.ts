import clientPromise from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 MongoDB URI check:', {
      hasUri: !!process.env.MONGODB_URI,
      uri: process.env.MONGODB_URI?.substring(0, 20) + '...'
    });

    const client = await clientPromise;
    const db = client.db('Altzheimer');
    
    const user = await db.collection('users').findOne({
      email: 'fangalasso@gmail.com'
    });

    return NextResponse.json({
      connected: true,
      userExists: !!user,
      userActive: user?.isActive,
      hasPassword: !!user?.password,
      passwordLength: user?.password?.length || 0
    });

  } catch (error) {
    console.error('❌ Database test error:', error);
    return NextResponse.json({
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}