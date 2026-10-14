import './globals.css';

export const metadata = {
  title: 'CampusAI',
  description: 'Your AI Study Assistant',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}