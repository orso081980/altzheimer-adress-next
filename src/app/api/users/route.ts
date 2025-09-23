import clientPromise from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { CreateUserRequest, UserResponse } from '@/types/user';

// GET - List all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("Altzheimer");
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const total = await db.collection("users").countDocuments();
    const users = await db.collection("users")
      .find({}, { projection: { password: 0 } }) // Never return passwords
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    const transformedUsers: UserResponse[] = users.map(user => ({
      _id: user._id.toString(),
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
      isActive: user.isActive
    }));

    return NextResponse.json({
      users: transformedUsers,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST - Create new user (admin only)
export async function POST(request: NextRequest) {
  try {
    const body: CreateUserRequest = await request.json();
    
    // Validate required fields
    if (!body.email || !body.password || !body.name || !body.role) {
      return NextResponse.json(
        { error: 'Email, password, name, and role are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (body.password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['admin', 'researcher'].includes(body.role)) {
      return NextResponse.json(
        { error: 'Role must be either admin or researcher' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("Altzheimer");

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email: body.email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 12);

    // Create user document
    const now = new Date();
    const userDoc = {
      email: body.email.toLowerCase(),
      password: hashedPassword,
      name: body.name,
      role: body.role,
      createdAt: now,
      updatedAt: now,
      isActive: true
    };

    const result = await db.collection("users").insertOne(userDoc);

    // Return user without password
    const newUser: UserResponse = {
      _id: result.insertedId.toString(),
      id: result.insertedId.toString(),
      email: userDoc.email,
      name: userDoc.name,
      role: userDoc.role,
      createdAt: userDoc.createdAt,
      updatedAt: userDoc.updatedAt,
      isActive: userDoc.isActive
    };

    return NextResponse.json(newUser, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}