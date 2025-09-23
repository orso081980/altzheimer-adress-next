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

export default function EditDataset({ params }: Props) {
  return (
    <ProtectedPage>
      <NavigationHeader />
      <EditDatasetContent params={params} />
    </ProtectedPage>
  );
}

function EditDatasetContent({ params }: Props) {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [id, setId] = useState<string>('');
  const [formData, setFormData] = useState({
    file_name: '',
    UTF8: '',
    PID: '',
    Begin: '',
    Languages: '',
    Participants: '',
    Media: '',
    End: '',
    utterancesJson: ''
  });
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
        const fetchedDataset = data.dataset;
        
        setDataset(fetchedDataset);
        
        // Populate form data
        setFormData({
          file_name: fetchedDataset.file_name || '',
          UTF8: fetchedDataset.UTF8 || '',
          PID: fetchedDataset.PID || '',
          Begin: fetchedDataset.Begin || '',
          Languages: fetchedDataset.Languages || '',
          Participants: fetchedDataset.Participants || '',
          Media: fetchedDataset.Media || '',
          End: fetchedDataset.End || '',
          utterancesJson: JSON.stringify(fetchedDataset.utterances || [], null, 2)
        });
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Parse and validate utterances JSON
      let utterances = [];
      if (formData.utterancesJson.trim()) {
        try {
          utterances = JSON.parse(formData.utterancesJson);
          if (!Array.isArray(utterances)) {
            throw new Error('Utterances must be an array');
          }
        } catch {
          throw new Error('Invalid JSON format for utterances');
        }
      }

      const updatePayload = {
        file_name: formData.file_name,
        UTF8: formData.UTF8,
        PID: formData.PID,
        Begin: formData.Begin,
        Languages: formData.Languages,
        Participants: formData.Participants,
        Media: formData.Media,
        End: formData.End,
        utterances: utterances
      };

      const response = await fetch(`/api/datasets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update dataset');
      }

      setSuccess('Dataset updated successfully!');
      
      // Optionally redirect back to view after a delay
      setTimeout(() => {
        router.push(`/entries/dataset/${id}`);
      }, 1500);
    } catch (error) {
      console.error('Error updating dataset:', error);
      setError(error instanceof Error ? error.message : 'Failed to update dataset');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl">Loading dataset...</div>
      </div>
    );
  }

  if (error && !dataset) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-700">{error}</div>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/entries/dataset/${id}`}
            className="text-blue-600 hover:text-blue-500 text-sm font-medium mb-2 inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dataset View
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Edit Dataset: {dataset?.file_name}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Modify dataset information and utterances
          </p>
        </div>

        {/* Edit Form */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="file_name" className="block text-sm font-medium text-gray-700">
                    File Name *
                  </label>
                  <input
                    type="text"
                    name="file_name"
                    id="file_name"
                    required
                    value={formData.file_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="Languages" className="block text-sm font-medium text-gray-700">
                    Language
                  </label>
                  <select
                    name="Languages"
                    id="Languages"
                    value={formData.Languages}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="eng">English</option>
                    <option value="spa">Spanish</option>
                    <option value="fra">French</option>
                    <option value="deu">German</option>
                    <option value="ita">Italian</option>
                    <option value="por">Portuguese</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="PID" className="block text-sm font-medium text-gray-700">
                    PID
                  </label>
                  <input
                    type="text"
                    name="PID"
                    id="PID"
                    value={formData.PID}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="Media" className="block text-sm font-medium text-gray-700">
                    Media
                  </label>
                  <input
                    type="text"
                    name="Media"
                    id="Media"
                    value={formData.Media}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="Begin" className="block text-sm font-medium text-gray-700">
                    Begin Time
                  </label>
                  <input
                    type="text"
                    name="Begin"
                    id="Begin"
                    value={formData.Begin}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="End" className="block text-sm font-medium text-gray-700">
                    End Time
                  </label>
                  <input
                    type="text"
                    name="End"
                    id="End"
                    value={formData.End}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="Participants" className="block text-sm font-medium text-gray-700">
                  Participants
                </label>
                <input
                  type="text"
                  name="Participants"
                  id="Participants"
                  value={formData.Participants}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., PAR Participant, INV Investigator"
                />
              </div>

              <div>
                <label htmlFor="UTF8" className="block text-sm font-medium text-gray-700">
                  UTF8
                </label>
                <input
                  type="text"
                  name="UTF8"
                  id="UTF8"
                  value={formData.UTF8}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* Utterances JSON */}
              <div>
                <label htmlFor="utterancesJson" className="block text-sm font-medium text-gray-700 mb-2">
                  Utterances (JSON format)
                </label>
                <p className="text-sm text-gray-500 mb-2">
                  Edit the utterances in JSON format. Each utterance should have speaker, text, timestamp, morphology, and grammar fields.
                </p>
                <textarea
                  name="utterancesJson"
                  id="utterancesJson"
                  rows={20}
                  value={formData.utterancesJson}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono text-xs"
                  placeholder="[]"
                />
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="rounded-md bg-red-50 p-4">
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
              )}

              {success && (
                <div className="rounded-md bg-green-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Success</h3>
                      <div className="mt-2 text-sm text-green-700">{success}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3">
                <Link
                  href={`/entries/dataset/${id}`}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}