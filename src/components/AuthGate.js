'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from '../lib/useAuth';
import Logo from './Logo';

// Shows the app pages only to logged-in students with a verified email.
// The pages are always rendered (so Next.js can check them), but they stay
// hidden until the checks pass.
export default function AuthGate({ children }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user) {
      router.replace('/login');
    } else if (!user.emailVerified) {
      router.replace('/verify-email');
    }
  }, [loading, user, router]);

  const ready = !loading && !!user && user.emailVerified;

  return (
    <>
      {!ready && (
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
      )}
      <div hidden={!ready}>{children}</div>
    </>
  );
}