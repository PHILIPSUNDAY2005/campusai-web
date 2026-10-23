'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { BsBell, BsBellFill, BsImage, BsClockHistory, BsHandThumbsUp, BsPerson } from 'react-icons/bs';
import styles from './WhatsNew.module.css';

// Change this text when you add a new update. The blue dot comes back
// for every student who has not seen the new version yet.
const VERSION = '2026-10-22';
const STORAGE_KEY = 'campusai-whatsnew-seen';

const updates = [
  {
    icon: BsImage,
    title: 'Ask about a photo',
    text: 'In AI Chat, tap the picture icon to attach a photo of your notes or a diagram.',
  },
  {
    icon: BsClockHistory,
    title: 'Your chats are saved',
    text: 'Tap the clock icon in AI Chat to open or delete your previous conversations.',
  },
  {
    icon: BsHandThumbsUp,
    title: 'Rate the answers',
    text: 'Use the thumbs up or down under an answer to tell us if it helped.',
  },
  {
    icon: BsPerson,
    title: 'Edit your profile',
    text: 'Change your name and read the help topics on the Profile page.',
  },
];

// Remembers in this browser whether the latest updates were opened
const listeners = new Set();
let openedThisVisit = false; // works even if the browser cannot save anything

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readSeen() {
  if (openedThisVisit) {
    return true;
  }
  try {
    return window.localStorage.getItem(STORAGE_KEY) === VERSION;
  } catch (error) {
    return false;
  }
}

function markSeen() {
  openedThisVisit = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, VERSION);
  } catch (error) {
    // Not saved (private window). The dot may show again next time. That is fine.
  }
  listeners.forEach((listener) => listener());
}

// The bell on the Dashboard: opens a small list of what is new in CampusAI
export default function WhatsNew() {
  const [open, setOpen] = useState(false);
  // Before the page is ready in the browser we say "seen", so no dot flashes
  const seen = useSyncExternalStore(subscribe, readSeen, () => true);
  const wrapRef = useRef(null);

  // Close when tapping outside or pressing Escape
  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const onPointer = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !seen) {
      markSeen();
    }
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.bell}
        aria-label={seen ? 'What is new' : 'What is new (new updates)'}
        aria-expanded={open}
        onClick={toggle}
      >
        {open ? <BsBellFill size={20} /> : <BsBell size={20} />}
        {!seen && <span className={styles.dot} />}
      </button>

      {open && (
        <div className={styles.panel} role="dialog" aria-label="What is new">
          <p className={styles.heading}>What&apos;s new</p>
          <ul className={styles.list}>
            {updates.map((item) => (
              <li key={item.title} className={styles.item}>
                <span className={styles.icon}>
                  <item.icon size={18} />
                </span>
                <span>
                  <span className={styles.title}>{item.title}</span>
                  <span className={styles.text}>{item.text}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className={styles.footer}>Study reminders are coming soon.</p>
        </div>
      )}
    </div>
  );
}