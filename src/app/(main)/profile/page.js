'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, updateProfile } from 'firebase/auth';
import { IoPersonOutline, IoHelpCircleOutline, IoChevronForward } from 'react-icons/io5';
import { auth } from '../../../lib/firebase';
import useAuth from '../../../lib/useAuth';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import ThemeToggle from '../../../components/ThemeToggle';
import styles from './profile.module.css';

const helpTopics = [
  {
    question: 'How do I ask the AI a question?',
    answer:
      'Open AI Chat from the Dashboard, type your question and press send. You can also attach a photo (for example a diagram or a page of notes) and ask about it.',
  },
  {
    question: 'How do I summarize my notes?',
    answer:
      'Open Notes, paste your text and tap Summarize. To summarize a photo, PDF or text file, use Upload instead.',
  },
  {
    question: 'Where are my old conversations?',
    answer:
      'In AI Chat, tap the clock icon at the top to see your previous conversations. Tap one to continue it, or use the bin icon to delete it.',
  },
  {
    question: 'The AI says "Please log in again".',
    answer:
      'Log out from this page, log in again and try once more. If it keeps happening, check your internet connection.',
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const [panel, setPanel] = useState(''); // '', 'edit' or 'help'
  const [nameInput, setNameInput] = useState('');
  const [savedName, setSavedName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageIsError, setMessageIsError] = useState(false);

  // The saved name, or the start of the email if no name was saved
  const userName =
    savedName ||
    (user && user.displayName) ||
    (user && user.email ? user.email.split('@')[0] : 'Student');
  const userEmail = (user && user.email) || '';

  const togglePanel = (name) => {
    setMessage('');
    if (panel === name) {
      setPanel('');
      return;
    }
    if (name === 'edit') {
      setNameInput((user && user.displayName) || savedName || '');
    }
    setPanel(name);
  };

  const handleSaveName = async () => {
    if (saving) {
      return;
    }

    const name = nameInput.trim().replace(/\s+/g, ' ');
    if (name.length < 2 || name.length > 40) {
      setMessageIsError(true);
      setMessage('Please enter a name between 2 and 40 characters.');
      return;
    }
    if (!auth.currentUser) {
      setMessageIsError(true);
      setMessage('Please log in again.');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      await updateProfile(auth.currentUser, { displayName: name });
      setSavedName(name);
      setMessageIsError(false);
      setMessage('Your name has been updated.');
    } catch (error) {
      console.error('Profile update error:', error);
      setMessageIsError(true);
      setMessage('Could not save your name. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }
    setLoggingOut(true);

    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      setLoggingOut(false);
      alert('Could not log out. Please try again.');
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Profile</h1>

      {/* User info */}
      <div className={styles.userCard}>
        <div className={styles.avatar}>{userName.charAt(0).toUpperCase()}</div>
        <p className={styles.userName}>{userName}</p>
        <p className={styles.userEmail}>{userEmail}</p>
      </div>

      {/* Light, dark or system theme */}
      <ThemeToggle />

      {/* Edit profile */}
      <button className={styles.optionRow} onClick={() => togglePanel('edit')}>
        <span className={styles.optionIcon}>
          <IoPersonOutline size={20} />
        </span>
        <span className={styles.optionText}>Edit Profile</span>
        <IoChevronForward size={20} />
      </button>

      {panel === 'edit' && (
        <div className={styles.panel}>
          <Input
            label="Full name"
            id="profile-name"
            value={nameInput}
            onChangeText={setNameInput}
            placeholder="Your name"
          />
          <p className={styles.hint}>Your email address cannot be changed here.</p>
          {message && (
            <p className={messageIsError ? styles.messageError : styles.messageOk}>{message}</p>
          )}
          <div className={styles.buttonRow}>
            <Button title={saving ? 'Saving...' : 'Save'} onClick={handleSaveName} />
            <Button title="Close" variant="secondary" onClick={() => togglePanel('edit')} />
          </div>
        </div>
      )}

      {/* Help and support */}
      <button className={styles.optionRow} onClick={() => togglePanel('help')}>
        <span className={styles.optionIcon}>
          <IoHelpCircleOutline size={20} />
        </span>
        <span className={styles.optionText}>Help &amp; Support</span>
        <IoChevronForward size={20} />
      </button>

      {panel === 'help' && (
        <div className={styles.panel}>
          {helpTopics.map((topic) => (
            <div key={topic.question} className={styles.helpItem}>
              <p className={styles.helpQuestion}>{topic.question}</p>
              <p className={styles.helpAnswer}>{topic.answer}</p>
            </div>
          ))}
        </div>
      )}

      <div className={styles.logout}>
        <Button
          title={loggingOut ? 'Logging out...' : 'Log Out'}
          variant="secondary"
          onClick={handleLogout}
        />
      </div>
    </div>
  );
}
