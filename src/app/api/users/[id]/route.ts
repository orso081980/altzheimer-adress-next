import clientPromise from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { UpdateUserRequest, UserResponse } from '@/types/user';

// GET - Get single user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await clientPromise;
    const db = client.db('Altzheimer');
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const user = await db.collection('users')
      .findOne(
        { _id: new ObjectId(id) },
        { projection: { password: 0 } } // Never return password
      );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userResponse: UserResponse = {
      _id: user._id.toString(),
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
      isActive: user.isActive
    };

    return NextResponse.json(userResponse);

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateUserRequest = await request.json();
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('Altzheimer');

    // Check if user exists
    const existingUser = await db.collection('users').findOne({ _id: new ObjectId(id) });
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Build update document
    const updateDoc: Record<string, unknown> = {
      updatedAt: new Date()
    };

    // Validate and add fields if provided
    if (body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
      
      // Check if email is taken by another user
      const emailExists = await db.collection('users').findOne({
        email: body.email.toLowerCase(),
        _id: { $ne: new ObjectId(id) }
      });
      
      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already in use by another user' },
          { status: 409 }
        );
      }
      
      updateDoc.email = body.email.toLowerCase();
    }

    if (body.name) {
      updateDoc.name = body.name;
    }

    if (body.role && ['admin', 'researcher'].includes(body.role)) {
      updateDoc.role = body.role;
    }

    if (typeof body.isActive === 'boolean') {
      updateDoc.isActive = body.isActive;
    }

    if (body.password) {
      if (body.password.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters long' },
          { status: 400 }
        );
      }
      updateDoc.password = await bcrypt.hash(body.password, 12);
    }

    // Update user
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateDoc }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch and return updated user (without password)
    const updatedUser = await db.collection('users').findOne(
      { _id: new ObjectId(id) },
      { projection: { password: 0 } }
    );

    const userResponse: UserResponse = {
      _id: updatedUser!._id.toString(),
      id: updatedUser!._id.toString(),
      email: updatedUser!.email,
      name: updatedUser!.name,
      role: updatedUser!.role,
      createdAt: updatedUser!.createdAt,
      updatedAt: updatedUser!.updatedAt,
      lastLogin: updatedUser!.lastLogin,
      isActive: updatedUser!.isActive
    };

    return NextResponse.json(userResponse);

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('Altzheimer');

    // Check if user exists
    const existingUser = await db.collection('users').findOne({ _id: new ObjectId(id) });
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of the last admin user
    if (existingUser.role === 'admin') {
      const adminCount = await db.collection('users').countDocuments({ 
        role: 'admin', 
        isActive: true 
      });
      
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last admin user' },
          { status: 400 }
        );
      }
    }

    const result = await db.collection('users').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}