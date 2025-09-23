'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedPageProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'researcher';
}

export default function ProtectedPage({ children, requiredRole }: ProtectedPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session) {
      // No session, redirect to sign in
      router.push('/auth/signin');
      return;
    }

    if (requiredRole && session.user?.role !== requiredRole && session.user?.role !== 'admin') {
      // User doesn't have required role (admin always has access)
      router.push('/auth/error?error=AccessDenied');
      return;
    }
  }, [session, status, router, requiredRole]);

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated
  if (!session) {
    return null;
  }

  // Check role access
  if (requiredRole && session.user?.role !== requiredRole && session.user?.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}