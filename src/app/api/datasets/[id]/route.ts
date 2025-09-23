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

    console.log(`Found dataset ${id}`);

    // Transform to consistent format using real data structure
    const participantInfo = rawDataset.metadata?.ID?.find((id: string) => id.includes('PAR')) || '';
    const participantParts = participantInfo.split('|');
    const age = participantParts[3] ? participantParts[3].replace(';', '') : 'Unknown';
    const sex = participantParts[4] || 'Unknown';
    const group = participantParts[5] || 'Unknown';

    const transformed = {
      id: rawDataset._id.toString(),
      file_name: rawDataset.metadata?.PID || `Dataset_${rawDataset._id}`,
      participant_count: rawDataset.metadata?.ID ? rawDataset.metadata.ID.length : 0,
      participants: [{
        id: participantParts[2] || 'PAR',
        age: age,
        sex: sex,
        group: group,
        mmse: 'Unknown'
      }],
      utterances: Array.isArray(rawDataset.utterances) 
        ? rawDataset.utterances.map((utterance: Record<string, unknown>) => {
            let start_time = 0, end_time = 0;
            if (utterance.timestamp && typeof utterance.timestamp === 'string') {
              const [startMs, endMs] = utterance.timestamp.split('_').map(Number);
              start_time = Math.round(startMs / 1000 * 100) / 100;
              end_time = Math.round(endMs / 1000 * 100) / 100;
            }
            
            return {
              speaker: utterance.speaker || 'Unknown',
              text: utterance.text || '',
              start_time,
              end_time,
              morphology: { raw: utterance.morphology || '' },
              grammar: { raw: utterance.grammar || '' },
              tier: utterance.speaker || 'Unknown',
              value: utterance.text || '',
              timestamp: start_time || end_time ? {
                start: start_time,
                end: end_time
              } : undefined
            };
          })
        : [],
      created_at: rawDataset.created_at || rawDataset.createdAt,
      updated_at: rawDataset.updated_at || rawDataset.updatedAt,
      metadata: rawDataset.metadata
    };

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

    // Transform using same logic as GET
    const participantInfo = Array.isArray(updatedDataset.ID) && updatedDataset.ID.length > 0 
      ? updatedDataset.ID[0].split('|').filter((part: string) => part.trim() !== '')
      : [];

    const transformed = {
      _id: updatedDataset._id.toString(),
      id: updatedDataset._id.toString(),
      file_name: updatedDataset.file_name || 'Unknown',
      participant_count: Array.isArray(updatedDataset.ID) ? updatedDataset.ID.length : 0,
      participants: participantInfo.length >= 6 ? [{
        age: participantInfo[4] || null,
        sex: participantInfo[5] || null,
        group: participantInfo[6] || 'Unknown'
      }] : [{ age: null, sex: null, group: 'Unknown' }],
      utterances: Array.isArray(updatedDataset.utterances) 
        ? updatedDataset.utterances.map((utterance: Record<string, unknown>) => ({
            speaker: utterance.speaker || 'Unknown',
            text: utterance.text || '',
            timestamp: typeof utterance.timestamp === 'string' && utterance.timestamp.includes('_')
              ? {
                  start: parseInt(utterance.timestamp.split('_')[0]) || 0,
                  end: parseInt(utterance.timestamp.split('_')[1]) || 0
                }
              : { start: 0, end: 0 },
            morphology: utterance.morphology || {},
            grammar: utterance.grammar || {}
          }))
        : []
    };

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
