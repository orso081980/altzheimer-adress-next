import clientPromise from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

// GET - List all datasets with pagination
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("Altzheimer");
    
    // Get pagination parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get datasets with pagination
    const rawDatasets = await db.collection("altzheimer")
      .find({})
      .skip(skip)
      .limit(limit)
      .toArray();

    // Transform the data to match frontend expectations
    const datasets = rawDatasets.map(dataset => {
      // Extract participant info from metadata.ID
      const participantInfo = dataset.metadata?.ID?.find((id: string) => id.includes('Participant')) || '';
      const investigatorInfo = dataset.metadata?.ID?.find((id: string) => id.includes('Investigator')) || '';
      
      // Parse participant details: 'eng|Pitt|PAR|74;|male|Control||Participant|||'
      const [, , , age, gender, group] = participantInfo.split('|');
      
      // Generate filename from metadata
      const filename = `${dataset.metadata?.PID || 'unknown'}.cha`;
      
      return {
        _id: dataset._id,
        filename: filename,
        metadata: {
          participant_id: dataset.metadata?.PID || 'Unknown',
          task: group || 'Unknown',
          age: age ? age.replace(';', '') : 'Unknown',
          gender: gender || 'Unknown',
          language: dataset.metadata?.Languages?.[0] || 'Unknown',
          investigator: investigatorInfo ? investigatorInfo.split('|')[2] : 'Unknown'
        },
        utterances: dataset.utterances?.map((utterance: any) => {
        let timestampObj = null;
        if (utterance.timestamp && typeof utterance.timestamp === 'string') {
          const [startMs, endMs] = utterance.timestamp.split('_').map(Number);
          timestampObj = {
            start: Math.round(startMs / 1000 * 100) / 100, // Convert ms to seconds with 2 decimals
            end: Math.round(endMs / 1000 * 100) / 100
          };
        }
        
        return {
          tier: utterance.speaker || 'Unknown',
          value: utterance.text || '',
          timestamp: timestampObj
        };
      }) || [],
        utteranceCount: dataset.utterances?.length || 0
      };
    });

    // Get total count for pagination
    const total = await db.collection("altzheimer").countDocuments();
    
    return NextResponse.json({
      datasets,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error fetching datasets:', error);
    return NextResponse.json({ error: 'Failed to fetch datasets' }, { status: 500 });
  }
}

// POST - Create a new dataset
export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('Altzheimer');
    const body = await request.json();

    const newDataset = {
      ...body,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await db.collection('altzheimer').insertOne(newDataset);
    
    return NextResponse.json(
      { id: result.insertedId, message: 'Dataset created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to create dataset' },
      { status: 500 }
    );
  }
}