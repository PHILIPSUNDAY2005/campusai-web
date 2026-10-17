'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { getAuthErrorMessage } from '../../lib/authErrors';
import AuthShell from '../../components/AuthShell';
import Input from '../../components/Input';
import Button from '../../components/Button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault(); // stops the browser from reloading the page

    if (loading) {
      return;
    }

    if (email.trim() === '' || password === '') {
      setError('Please enter your email and password.');
      return;
    }

    setError('');
    setNotice('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.push('/dashboard');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (email.trim() === '') {
      setNotice('');
      setError('Type your email in the box above first, then click "Forgot your password?".');
      return;
    }

    setError('');

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setNotice('If an account exists for this email, a reset link has been sent. Check your inbox and spam folder.');
    } catch (err) {
      setNotice('');
      setError(getAuthErrorMessage(err));
    }
  };

  return (
    <AuthShell
      title="CampusAI"
      tagline="Your AI Study Assistant"
      footerText="Don't have an account?"
      footerLinkText="Sign Up"
      footerHref="/signup"
    >
      <form onSubmit={handleSubmit}>
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="you@school.edu"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          id="password"
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          isPassword
        />

        <div style={{ textAlign: 'right', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={handleForgotPassword}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              fontSize: '14px',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Forgot your password?
          </button>
        </div>

        {error !== '' && (
          <p style={{ color: 'var(--color-error)', fontSize: '14px', marginTop: 0 }}>{error}</p>
        )}
        {notice !== '' && (
          <p style={{ color: 'var(--color-primary)', fontSize: '14px', marginTop: 0 }}>{notice}</p>
        )}

        <Button title={loading ? 'Logging in...' : 'Log In'} type="submit" />
      </form>
    </AuthShell>
  );
}