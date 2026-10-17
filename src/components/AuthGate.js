'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from '../lib/useAuth';

// Shows its content only to logged-in students
export default function AuthGate({ children }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <p style={{ textAlign: 'center', marginTop: '40vh', color: 'var(--color-text-grey)' }}>
        Loading...
      </p>
    );
  }

  return children;
}