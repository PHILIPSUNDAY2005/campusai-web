'use client';

import { useEffect, useState } from 'react';
import Logo from './Logo';
import styles from './SplashGate.module.css';

const SHOW_TIME = 4500; // how long the splash stays fully visible (milliseconds)
const FADE_TIME = 500; // how long the fade-out takes (milliseconds)

// Shows the load screen on top of the app once per browser tab
export default function SplashGate({ children }) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  // Fade out, then remove from the page
  const closeSplash = () => {
    setFading(true);
    setTimeout(() => setVisible(false), FADE_TIME);
  };

  useEffect(() => {
    let alreadySeen = false;
    try {
      alreadySeen = sessionStorage.getItem('campusai-splash-seen') === 'yes';
    } catch (error) {
      // Some browsers block storage. We just show the splash.
    }

    if (alreadySeen) {
      setVisible(false);
      return;
    }

    try {
      sessionStorage.setItem('campusai-splash-seen', 'yes');
    } catch (error) {
      // Ignore
    }

    const fadeTimer = setTimeout(() => setFading(true), SHOW_TIME);
    const hideTimer = setTimeout(() => setVisible(false), SHOW_TIME + FADE_TIME);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <>
      {children}
      {visible && (
        <div
          className={`${styles.splash} ${fading ? styles.fading : ''}`}
          onClick={closeSplash}
        >
          <div className={styles.content}>
            <Logo size={96} />
            <h1 className={styles.name}>CampusAI</h1>
            <p className={styles.tagline}>Your AI Study Assistant</p>
          </div>
        </div>
      )}
    </>
  );
}