'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Dataset {
  _id: string;
  filename: string;
  metadata: {
    participant_id: string;
    subject_id?: string;
    task: string;
    age?: string;
    gender?: string;
    language?: string;
    investigator?: string;
    // Additional metadata fields
    id?: string[];
    pid?: string;
    utf8?: string;
    begin?: string;
    end?: string;
    media?: string;
    languages?: string;
    participants?: string;
    type?: string;
    [key: string]: any;
  };
  utterances: Array<{
    tier: string;
    value: string;
    timestamp?: {
      start: number;
      end: number;
    };
    morphology?: string;
    grammar?: string;
  }>;
  utteranceCount: number;
  createdAt?: string;
  updatedAt?: string;
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function DatasetView({ params }: Props) {
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
    if (id) {
      fetchDataset();
    }
  }, [id]);

  const fetchDataset = async () => {
    try {
      const response = await fetch(`/api/datasets/${id}`);
      if (!response.ok) {
        throw new Error('Dataset not found');
      }
      const data = await response.json();
      setDataset(data);
    } catch (error) {
      console.error('Error fetching dataset:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch dataset');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this dataset?')) return;
    
    try {
      const response = await fetch(`/api/datasets/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete dataset');
      
      router.push('/');
    } catch (error) {
      console.error('Error deleting dataset:', error);
      alert('Failed to delete dataset');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading dataset...</div>
      </div>
    );
  }

  if (error || !dataset) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-4">
            {error || 'Dataset not found'}
          </div>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2 inline-block"
              >
                ← Back to Datasets
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                {dataset.filename}
              </h1>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors"
              >
                Delete Dataset
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Metadata Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Dataset Information
                </h2>
              </div>
              <div className="px-6 py-4">
                <dl className="space-y-4">
                  {dataset.metadata.subject_id && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Subject ID</dt>
                      <dd className="mt-1 text-sm text-gray-900">{dataset.metadata.subject_id}</dd>
                    </div>
                  )}
                  {dataset.metadata.type && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Type</dt>
                      <dd className="mt-1 text-sm text-gray-900">{dataset.metadata.type}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Utterances</dt>
                    <dd className="mt-1 text-sm text-gray-900">{dataset.utteranceCount}</dd>
                  </div>
                  {dataset.createdAt && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Created</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(dataset.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short', 
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </dd>
                    </div>
                  )}
                  {dataset.updatedAt && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Updated</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(dataset.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short', 
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
              
              {/* Additional Metadata Section */}
              <div className="px-6 py-4 border-t border-gray-200">
                <h3 className="text-md font-medium text-gray-900 mb-4">Metadata</h3>
                <dl className="space-y-3">
                  {dataset.metadata.id && dataset.metadata.id.length > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">ID</dt>
                      <dd className="mt-1 text-sm text-gray-900 space-y-1">
                        {dataset.metadata.id.map((id, index) => (
                          <div key={index} className="font-mono text-xs bg-gray-50 p-1 rounded">{id}</div>
                        ))}
                      </dd>
                    </div>
                  )}
                  {dataset.metadata.pid && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">PID</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-mono">{dataset.metadata.pid}</dd>
                    </div>
                  )}
                  {dataset.metadata.media && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Media</dt>
                      <dd className="mt-1 text-sm text-gray-900">{dataset.metadata.media}</dd>
                    </div>
                  )}
                  {dataset.metadata.languages && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Languages</dt>
                      <dd className="mt-1 text-sm text-gray-900">{dataset.metadata.languages}</dd>
                    </div>
                  )}
                  {dataset.metadata.participants && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Participants</dt>
                      <dd className="mt-1 text-sm text-gray-900">{dataset.metadata.participants}</dd>
                    </div>
                  )}
                  {dataset.metadata.begin && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Begin</dt>
                      <dd className="mt-1 text-sm text-gray-900">{dataset.metadata.begin}</dd>
                    </div>
                  )}
                  {dataset.metadata.end && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">End</dt>
                      <dd className="mt-1 text-sm text-gray-900">{dataset.metadata.end}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>

          {/* Utterances Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Utterances ({dataset.utterances.length})
                </h2>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {dataset.utterances.length === 0 ? (
                  <div className="px-6 py-8 text-center">
                    <p className="text-gray-500">No utterances found.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {dataset.utterances.map((utterance, index) => (
                      <div key={index} className="px-6 py-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {utterance.tier}
                          </span>
                          {utterance.timestamp && (
                            <span className="text-xs text-gray-500">
                              {utterance.timestamp.start}s - {utterance.timestamp.end}s
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-900 mb-3">{utterance.value}</p>
                        
                        {/* Morphology */}
                        {utterance.morphology && (
                          <div className="mb-2">
                            <dt className="text-xs font-medium text-gray-500 mb-1">Morphology:</dt>
                            <dd className="text-xs text-gray-700 font-mono bg-gray-50 p-2 rounded break-all">
                              {utterance.morphology}
                            </dd>
                          </div>
                        )}
                        
                        {/* Grammar */}
                        {utterance.grammar && (
                          <div>
                            <dt className="text-xs font-medium text-gray-500 mb-1">Grammar:</dt>
                            <dd className="text-xs text-gray-700 font-mono bg-gray-50 p-2 rounded break-all">
                              {utterance.grammar}
                            </dd>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}