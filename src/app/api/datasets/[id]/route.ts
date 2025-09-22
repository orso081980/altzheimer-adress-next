import clientPromise from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

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

    // Transform the data to match frontend expectations
    const participantInfo = rawDataset.metadata?.ID?.find((id: string) => id.includes('Participant')) || '';
    const investigatorInfo = rawDataset.metadata?.ID?.find((id: string) => id.includes('Investigator')) || '';
    
    // Parse participant details: 'eng|Pitt|PAR|74;|male|Control||Participant|||'
    const [, , , age, gender, group] = participantInfo.split('|');
    
    // Generate filename from metadata
    const filename = `${rawDataset.metadata?.PID || 'unknown'}.cha`;
    
    const dataset = {
      _id: rawDataset._id,
      filename: filename,
      metadata: {
        participant_id: rawDataset.metadata?.PID || 'Unknown',
        subject_id: rawDataset.metadata?.PID?.split('/')[1]?.split('-')[0] || 'Unknown',
        task: group || 'Unknown',
        age: age ? age.replace(';', '') : 'Unknown',
        gender: gender || 'Unknown',
        language: rawDataset.metadata?.Languages?.[0] || 'Unknown',
        investigator: investigatorInfo ? investigatorInfo.split('|')[2] : 'Unknown',
        // Additional metadata fields from MongoDB
        id: rawDataset.metadata?.ID || [],
        pid: rawDataset.metadata?.PID || '',
        utf8: rawDataset.metadata?.UTF8 || '',
        begin: rawDataset.metadata?.Begin || '',
        end: rawDataset.metadata?.End || '',
        media: rawDataset.metadata?.Media || '',
        languages: rawDataset.metadata?.Languages || 'Unknown',
        participants: rawDataset.metadata?.Participants || '',
        type: 'Comprehensive' // You can determine this based on your data structure
      },
      utterances: rawDataset.utterances?.map((utterance: any) => {
        let timestampObj = null;
        if (utterance.timestamp && typeof utterance.timestamp === 'string') {
          const [startMs, endMs] = utterance.timestamp.split('_').map(Number);
          timestampObj = {
            start: Math.round(startMs / 1000 * 100) / 100,
            end: Math.round(endMs / 1000 * 100) / 100
          };
        }
        
        return {
          tier: utterance.speaker || 'Unknown',
          value: utterance.text || '',
          timestamp: timestampObj,
          morphology: utterance.morphology || '',
          grammar: utterance.grammar || ''
        };
      }) || [],
      utteranceCount: rawDataset.utterances?.length || 0,
      createdAt: rawDataset.createdAt || new Date().toISOString(),
      updatedAt: rawDataset.updatedAt || new Date().toISOString()
    };

    return NextResponse.json(dataset);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dataset' },
      { status: 500 }
    );
  }
}

// PUT - Update dataset by ID
export async function PUT(
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

    const body = await request.json();
    const updateData = {
      ...body,
      updated_at: new Date()
    };

    const result = await db.collection('altzheimer')
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Dataset updated successfully' });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to update dataset' },
      { status: 500 }
    );
  }
}

// DELETE - Delete dataset by ID
export async function DELETE(
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

    const result = await db.collection('altzheimer')
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Dataset deleted successfully' });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to delete dataset' },
      { status: 500 }
    );
  }
}