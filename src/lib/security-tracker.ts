// Security Tracker Plugin - Core functionality
// Note: This file should only be used in server-side contexts (API routes)
// not in middleware due to Edge Runtime limitations
import clientPromise from '@/lib/mongodb';

export interface SecurityEvent {
  ip: string;
  userAgent: string;
  event: 'page_access' | 'login_success' | 'login_failed' | 'unauthorized_access' | 'logout';
  path: string;
  email?: string;
  timestamp: Date;
  details?: string;
}

export class SecurityTracker {
  private static async getClientIP(headers: Headers | Record<string, string | string[] | undefined>): Promise<string> {
    // Handle both Headers object (from fetch) and plain object (from NextRequest)
    const getHeader = (name: string): string | null => {
      if (headers instanceof Headers) {
        return headers.get(name);
      }
      const value = headers[name];
      return Array.isArray(value) ? value[0] : (value || null);
    };

    const forwarded = getHeader('x-forwarded-for');
    const realIp = getHeader('x-real-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    if (realIp) {
      return realIp;
    }
    return getHeader('remote-addr') || 'unknown';
  }

  static async logEvent(
    headers: Headers | Record<string, string | string[] | undefined>,
    event: SecurityEvent['event'],
    path: string,
    email?: string,
    details?: string
  ): Promise<void> {
    try {
      const ip = await this.getClientIP(headers);
      const userAgent = headers instanceof Headers 
        ? headers.get('user-agent') || 'unknown'
        : (Array.isArray(headers['user-agent']) ? headers['user-agent'][0] : headers['user-agent']) || 'unknown';

      const securityEvent: SecurityEvent = {
        ip,
        userAgent,
        event,
        path,
        email,
        timestamp: new Date(),
        details,
      };

      const client = await clientPromise;
      const db = client.db('Altzheimer');
      
      await db.collection('security_logs').insertOne(securityEvent);
      
      console.log(`Security Event Logged: ${event} from ${ip} at ${path}`);
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  static async getRecentEvents(limit: number = 50): Promise<SecurityEvent[]> {
    try {
      const client = await clientPromise;
      const db = client.db('Altzheimer');
      
      const events = await db.collection('security_logs')
        .find({})
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
      
      return events.map(event => ({
        ip: event.ip,
        userAgent: event.userAgent,
        event: event.event,
        path: event.path,
        email: event.email,
        timestamp: event.timestamp,
        details: event.details,
      })) as SecurityEvent[];
    } catch (error) {
      console.error('Failed to retrieve security events:', error);
      return [];
    }
  }

  static async getFailedAttempts(ip: string, timeWindow: number = 15): Promise<number> {
    try {
      const client = await clientPromise;
      const db = client.db('Altzheimer');
      
      const since = new Date(Date.now() - timeWindow * 60 * 1000); // timeWindow in minutes
      
      const count = await db.collection('security_logs').countDocuments({
        ip,
        event: 'login_failed',
        timestamp: { $gte: since }
      });
      
      return count;
    } catch (error) {
      console.error('Failed to get failed attempts:', error);
      return 0;
    }
  }
}