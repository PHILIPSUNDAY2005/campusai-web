'use client';

import { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [count, setCount] = useState(0);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'var(--color-primary-light)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <Card>
          <h1 style={{ color: 'var(--color-primary)', textAlign: 'center', margin: 0 }}>
            CampusAI
          </h1>
          <p style={{ color: 'var(--color-text-grey)', textAlign: 'center', marginBottom: '24px' }}>
            Button pressed: {count} times
          </p>

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

          <div style={{ marginBottom: '12px' }}>
            <Button title="Log In" onClick={() => setCount(count + 1)} />
          </div>
          <Button title="Sign Up" variant="secondary" onClick={() => setCount(0)} />
        </Card>
      </div>
    </main>
  );
}