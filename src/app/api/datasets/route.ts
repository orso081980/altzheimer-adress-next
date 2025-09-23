import clientPromise from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { Dataset } from '@/types/dataset';

// GET - List datasets with pagination
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("Altzheimer");
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const total = await db.collection("altzheimer").countDocuments();
    const rawDatasets = await db.collection("altzheimer")
      .find({})
      .skip(skip)
      .limit(limit)
      .toArray();

    console.log(`Found ${rawDatasets.length} documents from skip=${skip}`);

    const datasets = [];
    
    for (let index = 0; index < rawDatasets.length; index++) {
      const doc = rawDatasets[index];
      try {        
        const participantInfo = doc.metadata?.ID?.find((id: string) => id.includes('PAR')) || '';
        const participantParts = participantInfo.split('|');
        const age = participantParts[3] ? participantParts[3].replace(';', '') : 'Unknown';
        const sex = participantParts[4] || 'Unknown';
        const group = participantParts[5] || 'Unknown';
        
        const transformed = {
          id: doc._id.toString(),
          file_name: doc.metadata?.PID || `Dataset_${doc._id}`,
          participant_count: doc.metadata?.ID ? doc.metadata.ID.length : 0,
          participants: [{
            id: participantParts[2] || 'PAR',
            age: age,
            sex: sex,
            group: group,
            mmse: 'Unknown'
          }],
          utterances: Array.isArray(doc.utterances) 
            ? doc.utterances.map((utterance: any) => {
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
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          metadata: doc.metadata
        };
        
        datasets.push(transformed);
        
      } catch (error) {
        console.error(`Error transforming document ${index + 1}:`, error);
      }
    }
    
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

// POST - Create new dataset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.file_name) {
      return NextResponse.json(
        { error: 'file_name is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("Altzheimer");

    // Create dataset document
    const now = new Date();
    const datasetDoc = {
      file_name: body.file_name,
      UTF8: body.UTF8 || '',
      PID: body.PID || '',
      Begin: body.Begin || '0',
      Languages: body.Languages || 'eng',
      Participants: body.Participants || [],
      ID: body.ID || [],
      Media: body.Media || '',
      End: body.End || '0',
      utterances: body.utterances || [],
      createdAt: now,
      updatedAt: now
    };

    const result = await db.collection("altzheimer").insertOne(datasetDoc);

    // Transform and return the created dataset
    const rawDataset = await db.collection("altzheimer")
      .findOne({ _id: result.insertedId });

    if (!rawDataset) {
      return NextResponse.json(
        { error: 'Failed to retrieve created dataset' },
        { status: 500 }
      );
    }

    // Transform dataset using the same logic as GET
    const participantInfo = Array.isArray(rawDataset.ID) && rawDataset.ID.length > 0 
      ? rawDataset.ID[0].split('|').filter((part: string) => part.trim() !== '')
      : [];

    const transformedDataset = {
      _id: rawDataset._id.toString(),
      id: rawDataset._id.toString(),
      file_name: rawDataset.file_name || 'Unknown',
      participant_count: Array.isArray(rawDataset.ID) ? rawDataset.ID.length : 0,
      participants: participantInfo.length >= 6 ? [{
        age: participantInfo[4] || null,
        sex: participantInfo[5] || null,
        group: participantInfo[6] || 'Unknown'
      }] : [{ age: null, sex: null, group: 'Unknown' }],
      utterances: Array.isArray(rawDataset.utterances) 
        ? rawDataset.utterances.map((utterance: any) => ({
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

    return NextResponse.json(transformedDataset, { status: 201 });

  } catch (error) {
    console.error('Error creating dataset:', error);
    return NextResponse.json(
      { error: 'Failed to create dataset' },
      { status: 500 }
    );
  }
}
