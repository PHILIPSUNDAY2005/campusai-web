import Link from 'next/link';

export default function DashboardPage() {
  return (
    <main style={{ padding: '24px' }}>
      <h1>Dashboard</h1>
      <p>The real Dashboard comes next.</p>
      <Link href="/login">Back to Login</Link>
    </main>
  );
}