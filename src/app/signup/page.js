'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { getAuthErrorMessage } from '../../lib/authErrors';
import AuthShell from '../../components/AuthShell';
import Input from '../../components/Input';
import Button from '../../components/Button';

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    if (
      fullName.trim() === '' ||
      email.trim() === '' ||
      password === '' ||
      confirmPassword === ''
    ) {
      setError('Please fill in every field.');
      return;
    }
    if (password.length < 6) {
      setError('Your password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The two passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 1. Create the account in Firebase (this also signs the student in)
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);

      // 2. Save the student's full name on the account
      await updateProfile(credential.user, { displayName: fullName.trim() });

      router.push('/dashboard');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create Account"
      tagline="Join CampusAI and start learning"
      footerText="Already have an account?"
      footerLinkText="Log In"
      footerHref="/login"
    >
      <form onSubmit={handleSubmit}>
        <Input
          id="fullName"
          label="Full Name"
          placeholder="Your full name"
          value={fullName}
          onChangeText={setFullName}
        />
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
          placeholder="At least 6 characters"
          value={password}
          onChangeText={setPassword}
          isPassword
        />
        <Input
          id="confirmPassword"
          label="Confirm Password"
          placeholder="Type the password again"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          isPassword
        />

        {error !== '' && (
          <p style={{ color: 'var(--color-error)', fontSize: '14px', marginTop: 0 }}>{error}</p>
        )}

        <Button title={loading ? 'Creating account...' : 'Create Account'} type="submit" />
      </form>
    </AuthShell>
  );
}