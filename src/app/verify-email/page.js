'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import useAuth from '../../lib/useAuth';
import { getAuthErrorMessage } from '../../lib/authErrors';
import AuthShell from '../../components/AuthShell';
import Button from '../../components/Button';

const RESEND_WAIT = 60; // seconds
const SENT_FLAG = 'campusai-link-sent';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [linkSent, setLinkSent] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Not logged in -> Login. Already verified -> Dashboard.
  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user) {
      router.replace('/login');
    } else if (user.emailVerified) {
      router.replace('/dashboard');
    }
  }, [loading, user, router]);

  // Did Sign Up already send the link in this browser tab?
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SENT_FLAG) === 'yes') {
        setLinkSent(true);
        setSecondsLeft(RESEND_WAIT);
      }
    } catch (err) {
      // Storage can be blocked. The student can press "Send me the link".
    }
  }, []);

  // Count down the wait before "Resend" works again
  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }
    const timer = setTimeout(() => setSecondsLeft(secondsLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  // Every 4 seconds, ask Firebase if the link has been clicked
  useEffect(() => {
    if (!user) {
      return;
    }
    const timer = setInterval(async () => {
      try {
        if (!auth.currentUser) {
          return;
        }
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          // Get a fresh login token that says "verified"
          await auth.currentUser.getIdToken(true);
          router.replace('/dashboard');
        }
      } catch (err) {
        // A short network problem. We try again on the next round.
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [user, router]);

  // Firebase emails a verification link
  const requestLink = async () => {
    if (sending || secondsLeft > 0 || !auth.currentUser) {
      return;
    }

    setError('');
    setNotice('');
    setSending(true);

    try {
      await sendEmailVerification(auth.currentUser);
      setLinkSent(true);
      setSecondsLeft(RESEND_WAIT);
      setNotice('We sent a verification link. Check your inbox and spam folder.');
      try {
        sessionStorage.setItem(SENT_FLAG, 'yes');
      } catch (err) {
        // Ignore
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  // The student says they clicked the link
  const handleCheck = async () => {
    if (checking || !auth.currentUser) {
      return;
    }

    setError('');
    setNotice('');
    setChecking(true);

    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        await auth.currentUser.getIdToken(true);
        try {
          sessionStorage.removeItem(SENT_FLAG);
        } catch (err) {
          // Ignore
        }
        router.replace('/dashboard');
      } else {
        setError('We cannot see the verification yet. Click the link in the email, then try again.');
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      // Even if this fails, we still go to the Login page
    }
    router.replace('/login');
  };

  const email = (user && user.email) || 'your email address';

  const resendLabel = sending
    ? 'Sending...'
    : secondsLeft > 0
      ? 'Resend link (' + secondsLeft + 's)'
      : linkSent
        ? 'Resend link'
        : 'Send me the link';

  return (
    <AuthShell
      title="Verify your email"
      tagline="One last step before you start"
      footerText="Wrong email address?"
      footerLinkText="Sign up again"
      footerHref="/signup"
    >
      <p style={{ marginTop: 0, lineHeight: 1.6, textAlign: 'center' }}>
        {linkSent ? (
          <>
            We sent a verification link to <strong>{email}</strong>. Click the link in that email,
            then come back to this page. It moves on by itself once you have verified. Check your
            spam folder if you cannot find it.
          </>
        ) : (
          <>
            We will send a verification link to <strong>{email}</strong>.
          </>
        )}
      </p>

      {error !== '' && (
        <p style={{ color: 'var(--color-error)', fontSize: '14px', textAlign: 'center' }}>
          {error}
        </p>
      )}
      {notice !== '' && (
        <p style={{ color: 'var(--color-primary)', fontSize: '14px', textAlign: 'center' }}>
          {notice}
        </p>
      )}

      <div style={{ display: 'grid', gap: '12px' }}>
        <Button
          title={checking ? 'Checking...' : "I've verified my email"}
          onClick={handleCheck}
        />
        <Button title={resendLabel} variant="secondary" onClick={requestLink} />
        <Button title="Log Out" variant="secondary" onClick={handleLogout} />
      </div>
    </AuthShell>
  );
}
