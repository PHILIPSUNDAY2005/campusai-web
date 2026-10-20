'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { IoArrowBack, IoShareSocialOutline, IoDocumentTextOutline } from 'react-icons/io5';
import { auth, db } from '../../../lib/firebase';
import Button from '../../../components/Button';
import styles from './notes.module.css';

const MIN_LENGTH = 50;
const MAX_LENGTH = 12000;

export default function NotesPage() {
  const router = useRouter();
  const [notesText, setNotesText] = useState('');
  const [result, setResult] = useState(null); // { title, points } after summarizing
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleSummarize = async () => {
    if (loading) {
      return;
    }

    const text = notesText.trim();

    if (text.length < MIN_LENGTH) {
      setError('Please paste a little more text (at least 50 characters).');
      return;
    }
    if (text.length > MAX_LENGTH) {
      setError('These notes are too long. Please paste a shorter section.');
      return;
    }

    setError('');
    setNotice('');
    setSaved(false);
    setLoading(true);

    try {
      if (!auth.currentUser) {
        throw new Error('Please log in again.');
      }

      // The server needs the student's login token to answer
      const token = await auth.currentUser.getIdToken();

      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ text: text }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      setResult({ title: data.title, points: data.points });
    } catch (err) {
      setError(
        err && err.message && err.message !== 'Failed to fetch'
          ? err.message
          : 'Something went wrong. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!result) {
      return;
    }

    const message =
      'Summary: ' +
      result.title +
      '\n\n' +
      result.points.map((point, index) => index + 1 + '. ' + point).join('\n');

    // Phones and some browsers have a share menu. Others get "copy to clipboard".
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Summary: ' + result.title, text: message });
      } catch (err) {
        // The student closed the share menu. Nothing to do.
      }
    } else {
      try {
        await navigator.clipboard.writeText(message);
        setNotice('Summary copied to your clipboard.');
      } catch (err) {
        setNotice('Could not share. Please try again.');
      }
    }
  };

  // Saves the summary under this student's own account in Firestore
  const handleSave = async () => {
    if (saving || saved || !result) {
      return;
    }
    if (!auth.currentUser) {
      setNotice('Please log in again.');
      return;
    }

    setSaving(true);
    setNotice('');

    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'summaries'), {
        title: result.title.slice(0, 120),
        points: result.points.slice(0, 10),
        createdAt: serverTimestamp(),
      });
      setSaved(true);
      setNotice('Summary saved. You can find it under Recent Activities on your Dashboard.');
    } catch (err) {
      console.error('Save error:', err);
      setNotice('Could not save the summary. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSummarizeAnother = () => {
    setResult(null);
    setNotesText('');
    setError('');
    setNotice('');
    setSaved(false);
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button
          className={styles.iconButton}
          aria-label="Back to Dashboard"
          onClick={() => router.push('/dashboard')}
        >
          <IoArrowBack size={22} />
        </button>
        <h1 className={styles.headerTitle}>{result ? 'Summary Result' : 'Summarize Notes'}</h1>
        {result ? (
          <button className={styles.iconButton} aria-label="Share" onClick={handleShare}>
            <IoShareSocialOutline size={22} />
          </button>
        ) : (
          <span className={styles.iconSpacer}></span>
        )}
      </header>

      {/* STEP 1: paste notes */}
      {!result && (
        <div className={styles.formCard}>
          <label htmlFor="notes" className={styles.label}>
            Paste your lecture notes
          </label>
          <textarea
            id="notes"
            className={styles.textarea}
            rows={10}
            placeholder="Paste or type your notes here..."
            value={notesText}
            onChange={(event) => setNotesText(event.target.value)}
          />
          <p className={styles.counter}>
            {notesText.length} / {MAX_LENGTH} characters
          </p>

          {error !== '' && <p className={styles.error}>{error}</p>}

          <Button
            title={loading ? 'Summarizing...' : 'Summarize'}
            onClick={handleSummarize}
          />
        </div>
      )}

      {/* STEP 2: show the summary */}
      {result && (
        <>
          <div className={styles.documentCard}>
            <div className={styles.documentIcon}>
              <IoDocumentTextOutline size={24} />
            </div>
            <div>
              <p className={styles.documentLabel}>Document</p>
              <p className={styles.documentName}>{result.title}</p>
            </div>
          </div>

          <div className={styles.pointsCard}>
            <h2 className={styles.pointsTitle}>Key Points</h2>
            {result.points.map((point, index) => (
              <div key={index} className={styles.pointRow}>
                <div className={styles.numberCircle}>{index + 1}</div>
                <p className={styles.pointText}>{point}</p>
              </div>
            ))}
          </div>

          {notice !== '' && <p className={styles.notice}>{notice}</p>}

          <div className={styles.buttons}>
            <Button
              title={saved ? 'Saved' : saving ? 'Saving...' : 'Save Summary'}
              onClick={handleSave}
            />
            <Button title="Share" variant="secondary" onClick={handleShare} />
            <Button
              title="Summarize Another Note"
              variant="secondary"
              onClick={handleSummarizeAnother}
            />
            <Button
              title="Back to Dashboard"
              variant="secondary"
              onClick={() => router.push('/dashboard')}
            />
          </div>
        </>
      )}
    </div>
  );
}
