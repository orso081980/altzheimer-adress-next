'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Dataset {
  _id: string;
  filename: string;
  metadata: {
    participant_id: string;
    task: string;
    age?: number;
    gender?: string;
    mmse?: number;
    [key: string]: any;
  };
  utterances: Array<{
    tier: string;
    value: string;
    timestamp?: {
      start: number;
      end: number;
    };
  }>;
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
                  Metadata
                </h2>
              </div>
              <div className="px-6 py-4">
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Participant ID</dt>
                    <dd className="mt-1 text-sm text-gray-900">{dataset.metadata.participant_id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Task</dt>
                    <dd className="mt-1 text-sm text-gray-900">{dataset.metadata.task}</dd>
                  </div>
                  {dataset.metadata.age && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Age</dt>
                      <dd className="mt-1 text-sm text-gray-900">{dataset.metadata.age}</dd>
                    </div>
                  )}
                  {dataset.metadata.gender && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Gender</dt>
                      <dd className="mt-1 text-sm text-gray-900">{dataset.metadata.gender}</dd>
                    </div>
                  )}
                  {dataset.metadata.mmse && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">MMSE Score</dt>
                      <dd className="mt-1 text-sm text-gray-900">{dataset.metadata.mmse}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Total Utterances</dt>
                    <dd className="mt-1 text-sm text-gray-900">{dataset.utterances.length}</dd>
                  </div>
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
                        <p className="text-sm text-gray-900">{utterance.value}</p>
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