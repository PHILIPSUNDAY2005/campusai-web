'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthShell from '../../components/AuthShell';
import Input from '../../components/Input';
import Button from '../../components/Button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault(); // stops the browser from reloading the page

    if (email.trim() === '' || password === '') {
      setError('Please enter your email and password.');
      return;
    }

    setError('');
    // Firebase login will be added in a later phase
    router.push('/dashboard');
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
            onClick={() => alert('Password reset will be added later.')}
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

        <Button title="Log In" type="submit" />
      </form>
    </AuthShell>
  );
}