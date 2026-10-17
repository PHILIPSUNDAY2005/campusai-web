'use client';

import { useEffect, useState } from 'react';
import { IoSunnyOutline, IoMoonOutline, IoPhonePortraitOutline } from 'react-icons/io5';
import styles from './ThemeToggle.module.css';

const STORAGE_KEY = 'campusai-theme';

const options = [
  { value: 'light', label: 'Light', icon: IoSunnyOutline },
  { value: 'dark', label: 'Dark', icon: IoMoonOutline },
  { value: 'system', label: 'System', icon: IoPhonePortraitOutline },
];

// Puts the theme on the page: "dark" or "light"
function applyTheme(choice) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = choice === 'dark' || (choice === 'system' && prefersDark);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}

export default function ThemeToggle() {
  const [choice, setChoice] = useState('system');

  // Read the saved choice when the page opens
  useEffect(() => {
    let saved = 'system';
    try {
      saved = localStorage.getItem(STORAGE_KEY) || 'system';
    } catch (error) {
      // Storage can be blocked. We fall back to "system".
    }
    setChoice(saved);
  }, []);

  // When the choice is "System", follow the phone or laptop if it changes
  useEffect(() => {
    if (choice !== 'system') {
      return;
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [choice]);

  const handleChoose = (value) => {
    setChoice(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (error) {
      // Ignore. The theme still changes for this visit.
    }
    applyTheme(value);
  };

  return (
    <div className={styles.card}>
      <p className={styles.title}>Appearance</p>
      <div className={styles.options}>
        {options.map((option) => {
          const Icon = option.icon;
          const selected = choice === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              className={`${styles.option} ${selected ? styles.selected : ''}`}
              onClick={() => handleChoose(option.value)}
            >
              <Icon size={20} />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}