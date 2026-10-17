'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from '../lib/useAuth';
import Logo from './Logo';

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
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          color: 'var(--color-text-grey)',
        }}
      >
        <Logo size={56} />
        <span>Loading...</span>
      </div>
    );
  }

  return children;
}