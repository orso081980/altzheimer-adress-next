// API route to log security events
import { NextRequest, NextResponse } from 'next/server';
import { SecurityTracker } from '@/lib/security-tracker';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, path, email, details } = body;

    // Validate required fields
    if (!event || !path) {
      return NextResponse.json(
        { error: 'Event and path are required' },
        { status: 400 }
      );
    }

    await SecurityTracker.logEvent(
      request.headers,
      event,
      path,
      email,
      details
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to log security event:', error);
    return NextResponse.json(
      { error: 'Failed to log event' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const ip = url.searchParams.get('ip');

    if (ip) {
      // Get failed attempts for specific IP
      const failedAttempts = await SecurityTracker.getFailedAttempts(ip);
      return NextResponse.json({ failedAttempts });
    }

    // Get recent security events
    const events = await SecurityTracker.getRecentEvents(limit);
    return NextResponse.json({ events });
  } catch (error) {
    console.error('Failed to retrieve security events:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve events' },
      { status: 500 }
    );
  }
}