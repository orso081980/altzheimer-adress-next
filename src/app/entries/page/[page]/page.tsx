'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dataset, DatasetsResponse } from '@/types/dataset';
import ProtectedPage from '@/components/ProtectedPage';
import NavigationHeader from '@/components/NavigationHeader';

interface Props {
  params: Promise<{ page: string }>;
}

export default function EntriesPageView({ params }: Props) {
  return (
    <ProtectedPage>
      <NavigationHeader />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </div>
      }>
        <EntriesPageContent params={params} />
      </Suspense>
    </ProtectedPage>
  );
}

function EntriesPageContent({ params }: Props) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0
  });
  const router = useRouter();

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      const pageNum = parseInt(resolvedParams.page) || 1;
      setCurrentPage(pageNum);
      fetchDatasets(pageNum);
    };
    getParams();
  }, [params]);

  const fetchDatasets = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/datasets?page=${page}&limit=10`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to fetch datasets: ${response.status}`);
      }
      
      const data: DatasetsResponse = await response.json();
      setDatasets(data.datasets || []);
      setPagination(data.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching datasets:', error);
      // Don't throw the error, just set an empty state
      setDatasets([]);
      setPagination({
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
        totalPages: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dataset?')) return;
    
    try {
      const response = await fetch(`/api/datasets/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete dataset');
      
      // Refresh the current page
      fetchDatasets(currentPage);
    } catch (error) {
      console.error('Error deleting dataset:', error);
      alert('Failed to delete dataset');
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      router.push(`/entries/page/${newPage}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl">Loading datasets...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Dataset Entries
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage and analyze Alzheimer research datasets - Page {currentPage}
              </p>
            </div>
            <Link
              href="/entries/create"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Dataset
            </Link>
          </div>
        </div>

        {datasets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-xl text-gray-500">No datasets found.</div>
            <p className="mt-2 text-gray-400">Create your first dataset to get started.</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Datasets ({pagination.totalItems})
              </h2>
              
              {/* Dataset List */}
              <div className="divide-y divide-gray-200">
                {datasets.map((dataset) => (
                  <div key={dataset.id} className="py-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-sm font-medium text-gray-900">
                          {dataset.file_name || 'Unknown Dataset'}
                        </h3>
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {dataset.participants[0]?.group || 'Unknown'}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500 space-x-4">
                        <span>Participants: {dataset.participant_count}</span>
                        <span>•</span>
                        <span>Utterances: {dataset.utterances?.length || 0}</span>
                        {dataset.participants[0]?.age && (
                          <>
                            <span>•</span>
                            <span>Age: {dataset.participants[0].age}</span>
                          </>
                        )}
                        {dataset.participants[0]?.sex && (
                          <>
                            <span>•</span>
                            <span>Sex: {dataset.participants[0].sex}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Link
                        href={`/entries/dataset/${dataset.id}`}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        View
                      </Link>
                      <Link
                        href={`/entries/dataset/${dataset.id}/edit`}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(dataset.id)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{(currentPage - 1) * pagination.itemsPerPage + 1}</span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * pagination.itemsPerPage, pagination.totalItems)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.totalItems}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = i + Math.max(1, currentPage - 2);
                      if (pageNum > pagination.totalPages) return null;
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === currentPage
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}