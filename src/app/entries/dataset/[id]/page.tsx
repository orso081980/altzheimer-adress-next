'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Dataset } from '@/types/dataset';
import ProtectedPage from '@/components/ProtectedPage';
import NavigationHeader from '@/components/NavigationHeader';

interface Props {
  params: Promise<{ id: string }>;
}

export default function DatasetView({ params }: Props) {
  return (
    <ProtectedPage>
      <NavigationHeader />
      <DatasetViewContent params={params} />
    </ProtectedPage>
  );
}

function DatasetViewContent({ params }: Props) {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [id, setId] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    const fetchDataset = async () => {
      try {
        const response = await fetch(`/api/datasets/${id}`);
        if (!response.ok) {
          throw new Error('Dataset not found');
        }
        const data = await response.json();
        setDataset(data.dataset);
      } catch (error) {
        console.error('Error fetching dataset:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch dataset');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDataset();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/datasets/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete dataset');
      
      // Redirect to entries list
      router.push('/entries/page/1');
    } catch (error) {
      console.error('Error deleting dataset:', error);
      alert('Failed to delete dataset');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl">Loading dataset...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Link
              href="/entries/page/1"
              className="text-blue-600 hover:text-blue-500"
            >
              ← Back to Datasets
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="text-xl text-gray-500">Dataset not found</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/entries/page/1"
                className="text-blue-600 hover:text-blue-500 text-sm font-medium mb-2 inline-flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Datasets
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                {dataset.file_name || 'Unknown Dataset'}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Dataset Details and Analysis
              </p>
            </div>
            <div className="flex space-x-2">
              <Link
                href={`/entries/dataset/${dataset.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Link>
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Dataset Overview */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Dataset Overview</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Basic information about this dataset.</p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">File name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{dataset.file_name}</dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Total participants</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{dataset.participant_count}</dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Total utterances</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{dataset.utterances?.length || 0}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Participants */}
        {dataset.participants && dataset.participants.length > 0 && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Participants</h3>
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {dataset.participants.map((participant, index) => (
                  <li key={index} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              P{index + 1}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex space-x-4 text-sm text-gray-900">
                            {participant.age && (
                              <span>Age: {participant.age}</span>
                            )}
                            {participant.sex && (
                              <span>Sex: {participant.sex}</span>
                            )}
                            {participant.group && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {participant.group}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Utterances */}
        {dataset.utterances && dataset.utterances.length > 0 && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Utterances</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Showing first 20 utterances ({dataset.utterances.length} total)
                </p>
              </div>
            </div>
            <div className="border-t border-gray-200">
              <div className="space-y-6">
                {dataset.utterances.map((utterance, index) => {
                  
                  // Ultra-safe string conversion - will never return an object
                  const getSafeString = (value: unknown): string => {
                    if (value === null || value === undefined) return '';
                    if (typeof value === 'string') return value;
                    if (typeof value === 'number') return value.toString();
                    if (typeof value === 'boolean') return value.toString();
                    if (typeof value === 'object') {
                      try {
                        // Type guard for objects with a 'raw' property
                        if (
                          typeof value === 'object' &&
                          value !== null &&
                          'raw' in value &&
                          typeof (value as { raw?: unknown }).raw === 'string'
                        ) {
                          return (value as { raw: string }).raw;
                        }
                        return JSON.stringify(value);
                      } catch {
                        return '[Object]';
                      }
                    }
                    return String(value);
                  };

                  const safeText = getSafeString(utterance.text);
                  const safeSpeaker = getSafeString(utterance.speaker);
                  const safeMorphology = getSafeString(utterance.morphology);
                  const safeGrammar = getSafeString(utterance.grammar);
                  
                  return (
                    <div key={index} className="border-b border-gray-200 px-4 py-5 last:border-b-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-700">
                              {safeSpeaker.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {safeSpeaker || 'Unknown Speaker'}
                          </span>
                          {utterance.timestamp && typeof utterance.timestamp === 'object' && utterance.timestamp.start !== undefined && utterance.timestamp.end !== undefined && (
                            <span className="text-xs text-gray-500">
                              {getSafeString(utterance.timestamp.start)}s - {getSafeString(utterance.timestamp.end)}s
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-gray-900 mb-4 leading-relaxed text-base">
                        {safeText}
                      </div>
                      
                      {/* Debug raw utterance fields */}
                      {process.env.NODE_ENV === 'development' && (
                        <div className="text-xs text-red-500 bg-red-50 p-2 rounded">
                          <div>Raw text: {JSON.stringify(utterance.text)}</div>
                          <div>Raw speaker: {JSON.stringify(utterance.speaker)}</div>
                          <div>Raw morphology: {JSON.stringify(utterance.morphology)}</div>
                          <div>Raw grammar: {JSON.stringify(utterance.grammar)}</div>
                          <div>Raw timestamp: {JSON.stringify(utterance.timestamp)}</div>
                        </div>
                      )}
                      {/* Morphology Section - Safe handling */}
                      {utterance.morphology && (
                        <div className="mb-3">
                          <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Morphology:</span>
                          <div className="text-sm text-purple-700 font-mono bg-purple-50 p-3 rounded-md mt-1 break-all">
                            {safeMorphology}
                          </div>
                        </div>
                      )}
                      {/* Grammar Section - Safe handling */}
                      {utterance.grammar && (
                        <div className="mb-3">
                          <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">Grammar:</span>
                          <div className="text-sm text-green-700 font-mono bg-green-50 p-3 rounded-md mt-1 break-all">
                            {safeGrammar}
                          </div>
                        </div>
                      )}
                      {/* Timestamp raw data - only show if available */}
                      {utterance.timestamp && typeof utterance.timestamp === 'string' && (
                        <div className="text-xs text-gray-400 mt-2">
                          Raw timestamp: {getSafeString(utterance.timestamp)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {dataset.utterances.length > 20 && (
                <div className="px-4 py-3 bg-gray-50 text-center">
                  <p className="text-sm text-gray-500">
                    Showing 20 of {dataset.utterances.length} utterances
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}