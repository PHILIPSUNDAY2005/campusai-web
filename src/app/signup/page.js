'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
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
  const [agreed, setAgreed] = useState(false);
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
    if (!agreed) {
      setError('Please agree to the Terms and Conditions and Privacy Policy to continue.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 1. Create the account in Firebase (this also signs the student in)
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);

      // 2. Save the student's full name on the account
      await updateProfile(credential.user, { displayName: fullName.trim() });

      // 3. Email a verification link. If this fails, the student can press
      //    "Send me the link" on the next page, so we do not stop here.
      try {
        await sendEmailVerification(credential.user);
        sessionStorage.setItem('campusai-link-sent', 'yes');
      } catch (mailError) {
        console.error('Verification email failed:', mailError);
      }

      router.push('/verify-email');
    } catch (err) {
      if (err && err.code === 'auth/email-already-in-use') {
        // The account was started before. If the password is right, carry on from there.
        try {
          const credential = await signInWithEmailAndPassword(auth, email.trim(), password);

          if (!credential.user.displayName) {
            await updateProfile(credential.user, { displayName: fullName.trim() });
          }

          router.push(credential.user.emailVerified ? '/dashboard' : '/verify-email');
          return;
        } catch (signInError) {
          setError(
            'An account with this email already exists, and that password does not match it. ' +
              'Log in with your password, or use "Forgot your password?" on the Login page.'
          );
        }
      } else {
        setError(getAuthErrorMessage(err));
      }
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

        {/* Terms and Conditions */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '16px' }}>
          <input
            id="terms"
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            style={{ width: '20px', height: '20px', marginTop: '2px', accentColor: 'var(--color-primary)', flexShrink: 0 }}
          />
          <label
            htmlFor="terms"
            style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--color-text-grey)' }}
          >
            I agree to the{' '}
            <Link
              href="/terms"
              target="_blank"
              style={{ color: 'var(--color-primary)', fontWeight: 600 }}
            >
              Terms and Conditions
            </Link>{' '}
            and the{' '}
            <Link
              href="/privacy"
              target="_blank"
              style={{ color: 'var(--color-primary)', fontWeight: 600 }}
            >
              Privacy Policy
            </Link>
            .
          </label>
        </div>

        {error !== '' && (
          <p style={{ color: 'var(--color-error)', fontSize: '14px', marginTop: 0 }}>{error}</p>
        )}

        <Button title={loading ? 'Creating account...' : 'Create Account'} type="submit" />
      </form>
    </AuthShell>
  );
}