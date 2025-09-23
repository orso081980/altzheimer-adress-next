import clientPromise from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { transformDataset } from '@/lib/dataset-utils';

// GET - Get single dataset by ID
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
        { error: 'Invalid dataset ID' },
        { status: 400 }
      );
    }

    const rawDataset = await db.collection('altzheimer')
      .findOne({ _id: new ObjectId(id) });

    if (!rawDataset) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }

    console.log(`Found dataset ${id}`);

    const transformed = transformDataset(rawDataset);

    return NextResponse.json({ dataset: transformed });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dataset' },
      { status: 500 }
    );
  }
}

// PUT - Update dataset
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid dataset ID' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('Altzheimer');

    // Check if dataset exists
    const existingDataset = await db.collection('altzheimer')
      .findOne({ _id: new ObjectId(id) });

    if (!existingDataset) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }

    // Build update document
    const updateDoc: Record<string, unknown> = {
      updatedAt: new Date()
    };

    // Add fields if provided
    if (body.file_name) updateDoc.file_name = body.file_name;
    if (body.UTF8) updateDoc.UTF8 = body.UTF8;
    if (body.PID) updateDoc.PID = body.PID;
    if (body.Begin) updateDoc.Begin = body.Begin;
    if (body.Languages) updateDoc.Languages = body.Languages;
    if (body.Participants) updateDoc.Participants = body.Participants;
    if (body.ID) updateDoc.ID = body.ID;
    if (body.Media) updateDoc.Media = body.Media;
    if (body.End) updateDoc.End = body.End;
    if (body.utterances) updateDoc.utterances = body.utterances;

    // Update dataset
    const result = await db.collection('altzheimer').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateDoc }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }

    // Fetch and return updated dataset
    const updatedDataset = await db.collection('altzheimer')
      .findOne({ _id: new ObjectId(id) });

    if (!updatedDataset) {
      return NextResponse.json(
        { error: 'Failed to retrieve updated dataset' },
        { status: 500 }
      );
    }

    // Transform using shared utility
    const transformed = transformDataset(updatedDataset);

    return NextResponse.json({ dataset: transformed });

  } catch (error) {
    console.error('Error updating dataset:', error);
    return NextResponse.json(
      { error: 'Failed to update dataset' },
      { status: 500 }
    );
  }
}

// DELETE - Delete dataset
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid dataset ID' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('Altzheimer');

    // Check if dataset exists
    const existingDataset = await db.collection('altzheimer')
      .findOne({ _id: new ObjectId(id) });

    if (!existingDataset) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }

    const result = await db.collection('altzheimer')
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Dataset deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting dataset:', error);
    return NextResponse.json(
      { error: 'Failed to delete dataset' },
      { status: 500 }
    );
  }
}
