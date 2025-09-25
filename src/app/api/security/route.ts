// API route to log security events
import { NextRequest, NextResponse } from 'next/server';
import { SecurityTracker } from '@/lib/security-tracker';

function getClientIP(headers: Headers | Record<string, string | string[] | undefined>): string {
  let forwarded: string | undefined = undefined;
  let realIp: string | undefined = undefined;
  if (headers instanceof Headers) {
    forwarded = headers.get('x-forwarded-for') || undefined;
    realIp = headers.get('x-real-ip') || undefined;
  } else {
    forwarded = typeof headers['x-forwarded-for'] === 'string'
      ? headers['x-forwarded-for'] as string
      : Array.isArray(headers['x-forwarded-for'])
        ? headers['x-forwarded-for'][0]
        : undefined;
    realIp = typeof headers['x-real-ip'] === 'string'
      ? headers['x-real-ip'] as string
      : Array.isArray(headers['x-real-ip'])
        ? headers['x-real-ip'][0]
        : undefined;
  }
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  return 'unknown';
}

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

  const ip = getClientIP(request.headers);

    await SecurityTracker.logEvent(
      request.headers,
      event,
      path,
      email,
      details ? `${details} | IP: ${ip}` : `IP: ${ip}`
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