'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import useAuth from '../../lib/useAuth';
import { getAuthErrorMessage } from '../../lib/authErrors';
import AuthShell from '../../components/AuthShell';
import Button from '../../components/Button';
import CodeInput from '../../components/CodeInput';

const RESEND_WAIT = 60; // seconds
const SENT_FLAG = 'campusai-code-sent';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [showLinkOption, setShowLinkOption] = useState(false);
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

  // Did Sign Up already send a code in this browser tab?
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SENT_FLAG) === 'yes') {
        setCodeSent(true);
        setSecondsLeft(RESEND_WAIT);
      }
    } catch (err) {
      // Storage can be blocked. The student can press "Send me a code".
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

  // After a verification link was emailed, check every 4 seconds if it was clicked
  useEffect(() => {
    if (!linkSent) {
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
  }, [linkSent, router]);

  // Asks our server to email a code
  const requestCode = async () => {
    if (sending || secondsLeft > 0 || !auth.currentUser) {
      return;
    }

    setError('');
    setNotice('');
    setSending(true);

    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/verification/send', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.alreadyVerified) {
        router.replace('/dashboard');
        return;
      }

      if (response.ok) {
        setCodeSent(true);
        setSecondsLeft(RESEND_WAIT);
        setCode('');
        setNotice('We sent a new 6-digit code. Check your inbox and spam folder.');
        try {
          sessionStorage.setItem(SENT_FLAG, 'yes');
        } catch (err) {
          // Ignore
        }
      } else if (response.status === 429 && data.secondsLeft) {
        setCodeSent(true);
        setSecondsLeft(data.secondsLeft);
        setNotice('A code was sent a moment ago. Check your inbox and spam folder.');
      } else if (response.status === 502) {
        // Our email service failed. Offer the backup: a link sent by Firebase.
        setShowLinkOption(true);
        setError('We could not email the code right now. You can use the verification link instead.');
      } else {
        setError(data.error || 'Could not send the code. Please try again.');
      }
    } catch (err) {
      setError('Network problem. Please check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  // Backup: Firebase emails a verification link
  const requestLink = async () => {
    if (sending || !auth.currentUser) {
      return;
    }

    setError('');
    setNotice('');
    setSending(true);

    try {
      await sendEmailVerification(auth.currentUser);
      setLinkSent(true);
      setNotice(
        'We sent a verification link to your email. Click it, then come back to this page. Check your spam folder too.'
      );
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  // Asks our server to check the code the student typed
  const handleVerify = async () => {
    if (checking || !auth.currentUser) {
      return;
    }
    if (code.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }

    setError('');
    setNotice('');
    setChecking(true);

    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/verification/check', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.verified) {
        // Refresh the account so the app sees "verified"
        await auth.currentUser.reload();
        await auth.currentUser.getIdToken(true);
        try {
          sessionStorage.removeItem(SENT_FLAG);
        } catch (err) {
          // Ignore
        }
        router.replace('/dashboard');
        return;
      }

      setError(data.error || 'That code did not work. Please try again.');
      setCode('');
    } catch (err) {
      setError('Network problem. Please check your connection and try again.');
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
      ? 'Resend code (' + secondsLeft + 's)'
      : codeSent
        ? 'Resend code'
        : 'Send me a code';

  return (
    <AuthShell
      title="Verify your email"
      tagline="One last step before you start"
      footerText="Wrong email address?"
      footerLinkText="Sign up again"
      footerHref="/signup"
    >
      <p style={{ marginTop: 0, marginBottom: 0, lineHeight: 1.6, textAlign: 'center' }}>
        {codeSent ? (
          <>
            Enter the 6-digit code we sent to <strong>{email}</strong>. The code expires in 10
            minutes. Check your spam folder if you cannot find it.
          </>
        ) : (
          <>
            We will send a 6-digit code to <strong>{email}</strong>.
          </>
        )}
      </p>

      <CodeInput value={code} onChange={setCode} disabled={checking} />

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
        <Button title={checking ? 'Checking...' : 'Verify'} onClick={handleVerify} />
        <Button title={resendLabel} variant="secondary" onClick={requestCode} />
        {showLinkOption && (
          <Button
            title={linkSent ? 'Waiting for you to click the link...' : 'Email me a verification link instead'}
            variant="secondary"
            onClick={requestLink}
          />
        )}
        <Button title="Log Out" variant="secondary" onClick={handleLogout} />
      </div>
    </AuthShell>
  );
}