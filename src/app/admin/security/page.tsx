'use client';

import { useState, useEffect } from 'react';
import ProtectedPage from '@/components/ProtectedPage';
import NavigationHeader from '@/components/NavigationHeader';
import Link from 'next/link';

interface SecurityEvent {
  _id?: string;
  ip: string;
  userAgent: string;
  event: 'page_access' | 'login_success' | 'login_failed' | 'unauthorized_access';
  path: string;
  email?: string;
  timestamp: string;
  details?: string;
}

export default function SecurityDashboard() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/security?limit=100');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Failed to fetch security events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    return event.event === filter;
  });

  const getEventColor = (event: string) => {
    switch (event) {
      case 'login_success':
        return 'bg-green-100 text-green-800';
      case 'login_failed':
        return 'bg-red-100 text-red-800';
      case 'unauthorized_access':
        return 'bg-orange-100 text-orange-800';
      case 'page_access':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventIcon = (event: string) => {
    switch (event) {
      case 'login_success':
        return '✅';
      case 'login_failed':
        return '❌';
      case 'unauthorized_access':
        return '🚫';
      case 'page_access':
        return '👀';
      default:
        return '📝';
    }
  };

  return (
    <ProtectedPage>
      <NavigationHeader />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <Link
                  href="/admin/users"
                  className="text-blue-600 hover:text-blue-500 text-sm font-medium mb-2 inline-flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Admin
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Security Dashboard</h1>
                <p className="mt-1 text-sm text-gray-600">Monitor access attempts and authentication events</p>
              </div>
              <button
                onClick={() => { setLoading(true); fetchEvents(); }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <div className="flex space-x-2">
              {['all', 'login_success', 'login_failed', 'unauthorized_access', 'page_access'].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    filter === filterType
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {filterType.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Events Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Security Events</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Recent security events and access attempts ({filteredEvents.length} events)
              </p>
            </div>
            <div className="border-t border-gray-200">
              {loading ? (
                <div className="px-4 py-8 text-center text-gray-500">Loading security events...</div>
              ) : filteredEvents.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">No security events found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Event
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          IP Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Path
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredEvents.map((event, index) => (
                        <tr key={event._id || `${event.ip}-${event.timestamp}-${index}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventColor(event.event)}`}>
                              {getEventIcon(event.event)} {event.event.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                            {event.ip}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {event.email || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                            {event.path}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(event.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                            {event.details || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}