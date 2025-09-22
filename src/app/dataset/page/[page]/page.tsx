'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Dataset {
  _id?: string;
  filename?: string;
  metadata?: {
    participant_id?: string;
    task?: string;
    age?: number;
    gender?: string;
    mmse?: number;
    [key: string]: any;
  };
  utterances?: any[];
}

interface DatasetResponse {
  datasets: Dataset[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

interface Props {
  params: Promise<{ page: string }>;
}

export default function DatasetPage({ params }: Props) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
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
    setLoading(true);
    try {
      const response = await fetch(`/api/datasets?page=${page}&limit=10`);
      if (!response.ok) throw new Error('Failed to fetch datasets');
      
      const data: DatasetResponse = await response.json();
      setDatasets(data.datasets || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching datasets:', error);
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
      
      fetchDatasets(currentPage);
    } catch (error) {
      console.error('Error deleting dataset:', error);
      alert('Failed to delete dataset');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading datasets...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2 inline-block"
              >
                ← Back to Home
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                Alzheimer Dataset Manager - Page {currentPage}
              </h1>
              <p className="mt-2 text-gray-600">
                Manage and explore Alzheimer research datasets
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Datasets ({pagination.totalCount})
            </h2>
          </div>
          
          {datasets.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500">No datasets found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {datasets.map((dataset) => (
                <div key={dataset._id || Math.random()} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {dataset.filename || 'Unknown Dataset'}
                      </h3>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <span>Participant: {dataset.metadata?.participant_id || 'N/A'}</span>
                        <span>Task: {dataset.metadata?.task || 'N/A'}</span>
                        <span>Utterances: {dataset.utterances?.length || 0}</span>
                      </div>
                      {dataset.metadata?.age && (
                        <div className="mt-1 text-sm text-gray-500">
                          Age: {dataset.metadata.age}
                          {dataset.metadata.gender && `, Gender: ${dataset.metadata.gender}`}
                          {dataset.metadata.mmse && `, MMSE: ${dataset.metadata.mmse}`}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/dataset/${dataset._id}`}
                        className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(dataset._id?.toString() || '')}
                        className="inline-flex items-center px-3 py-1 text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <Link
                  href={`/dataset/page/${currentPage - 1}`}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 ${
                    currentPage <= 1 ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  Previous
                </Link>
                <Link
                  href={`/dataset/page/${currentPage + 1}`}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 ${
                    currentPage >= pagination.totalPages ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  Next
                </Link>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{(currentPage - 1) * pagination.limit + 1}</span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * pagination.limit, pagination.totalCount)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.totalCount}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <Link
                      href={`/dataset/page/${currentPage - 1}`}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
                        currentPage <= 1 ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      Previous
                    </Link>
                    
                    {[...Array(Math.min(pagination.totalPages, 7))].map((_, index) => {
                      let page;
                      if (pagination.totalPages <= 7) {
                        page = index + 1;
                      } else {
                        if (index === 0) page = 1;
                        else if (index === 6) page = pagination.totalPages;
                        else page = Math.max(2, Math.min(pagination.totalPages - 1, currentPage - 3 + index));
                      }
                      
                      return (
                        <Link
                          key={page}
                          href={`/dataset/page/${page}`}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </Link>
                      );
                    })}
                    
                    <Link
                      href={`/dataset/page/${currentPage + 1}`}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
                        currentPage >= pagination.totalPages ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      Next
                    </Link>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}