'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedPage from '@/components/ProtectedPage';
import NavigationHeader from '@/components/NavigationHeader';

export default function CreateDataset() {
  return (
    <ProtectedPage>
      <NavigationHeader />
      <CreateDatasetContent />
    </ProtectedPage>
  );
}

function CreateDatasetContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [jsonData, setJsonData] = useState<any>(null);
  const router = useRouter();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setError('Please upload a JSON file');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        setJsonData(parsed);
        setError(null);
        setSuccess(`File "${file.name}" loaded successfully!`);
      } catch (err) {
        setError('Invalid JSON file. Please check the format.');
        setJsonData(null);
      }
    };

    reader.onerror = () => {
      setError('Error reading file');
    };

    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jsonData) {
      setError('Please upload a JSON file first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare dataset data from JSON
      const datasetPayload = {
        file_name: fileName.replace('.json', '') || jsonData.metadata?.file_name || 'Untitled Dataset',
        UTF8: jsonData.metadata?.UTF8 || '',
        PID: jsonData.metadata?.PID || '',
        Begin: jsonData.metadata?.Begin || '',
        Languages: jsonData.metadata?.Languages || 'eng',
        Participants: jsonData.metadata?.Participants || '',
        ID: jsonData.metadata?.ID || [],
        Media: jsonData.metadata?.Media || '',
        End: jsonData.metadata?.End || '',
        utterances: jsonData.utterances || []
      };

      const response = await fetch('/api/datasets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datasetPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create dataset');
      }

      const result = await response.json();
      
      // Redirect to the new dataset
      router.push(`/entries/dataset/${result.id}`);
    } catch (error) {
      console.error('Error creating dataset:', error);
      setError(error instanceof Error ? error.message : 'Failed to create dataset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/entries/page/1"
            className="text-blue-600 hover:text-blue-500 text-sm font-medium mb-2 inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Datasets
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create New Dataset</h1>
          <p className="mt-1 text-sm text-gray-600">
            Upload a JSON file containing dataset information
          </p>
        </div>

        {/* Upload Form */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit}>
              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  JSON Dataset File
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                        <span>Upload a JSON file</span>
                        <input
                          type="file"
                          className="sr-only"
                          accept=".json"
                          onChange={handleFileUpload}
                          disabled={loading}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">JSON files only</p>
                  </div>
                </div>
                {fileName && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected file: <span className="font-medium">{fileName}</span>
                  </p>
                )}
              </div>

              {/* Dataset Preview */}
              {jsonData && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Dataset Preview</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">File Name:</span>
                        <span className="ml-2 text-gray-900">
                          {fileName.replace('.json', '') || jsonData.metadata?.file_name || 'Untitled Dataset'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Language:</span>
                        <span className="ml-2 text-gray-900">
                          {jsonData.metadata?.Languages || 'eng'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Participants:</span>
                        <span className="ml-2 text-gray-900">
                          {jsonData.metadata?.ID?.length || 0}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Utterances:</span>
                        <span className="ml-2 text-gray-900">
                          {jsonData.utterances?.length || 0}
                        </span>
                      </div>
                    </div>
                    
                    {/* Show first few utterances */}
                    {jsonData.utterances && jsonData.utterances.length > 0 && (
                      <div className="mt-4">
                        <span className="font-medium text-gray-700">Sample utterances:</span>
                        <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                          {jsonData.utterances.slice(0, 3).map((utterance: any, index: number) => (
                            <div key={index} className="bg-white p-3 rounded border text-sm">
                              <div className="font-medium text-gray-800">
                                {utterance.speaker}: {utterance.text}
                              </div>
                              {utterance.morphology && (
                                <div className="text-purple-600 mt-1 font-mono text-xs">
                                  Morphology: {typeof utterance.morphology === 'string' ? utterance.morphology : JSON.stringify(utterance.morphology)}
                                </div>
                              )}
                            </div>
                          ))}
                          {jsonData.utterances.length > 3 && (
                            <div className="text-gray-500 text-center text-sm">
                              ... and {jsonData.utterances.length - 3} more utterances
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error/Success Messages */}
              {error && (
                <div className="mb-6 rounded-md bg-red-50 p-4">
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
                <div className="mb-6 rounded-md bg-green-50 p-4">
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

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <Link
                  href="/entries/page/1"
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={!jsonData || loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    'Create Dataset'
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