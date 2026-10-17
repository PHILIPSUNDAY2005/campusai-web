import './globals.css';
import SplashGate from '../components/SplashGate';

export const metadata = {
  title: 'CampusAI',
  description: 'Your AI Study Assistant',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

// Runs before the page is drawn, so the right theme shows with no white flash.
// This is our own fixed text, not anything a user or the AI can change.
const themeScript = `
(function () {
  try {
    var saved = localStorage.getItem('campusai-theme') || 'system';
    var dark = saved === 'dark' || (saved === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <SplashGate>{children}</SplashGate>
      </body>
    </html>
  );
}