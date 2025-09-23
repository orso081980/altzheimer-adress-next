import clientPromise from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { transformDataset } from '@/lib/dataset-utils';

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
        const transformed = transformDataset(doc);
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
    const transformedDataset = transformDataset(rawDataset);

    return NextResponse.json(transformedDataset, { status: 201 });

  } catch (error) {
    console.error('Error creating dataset:', error);
    return NextResponse.json(
      { error: 'Failed to create dataset' },
      { status: 500 }
    );
  }
}
