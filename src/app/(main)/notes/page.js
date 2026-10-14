'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IoArrowBack, IoShareSocialOutline, IoDocumentTextOutline } from 'react-icons/io5';
import Button from '../../../components/Button';
import styles from './notes.module.css';

// Dummy data for now. Real summaries come from Gemini in a later phase.
const documentName = 'Database Management';
const keyPoints = [
  'Database management involves the organization and storage of data.',
  'Normalization reduces data redundancy.',
  'It improves data integrity and consistency.',
  'It helps with efficient data retrieval and storage.',
];

export default function NotesPage() {
  const router = useRouter();
  const [notice, setNotice] = useState('');

  const handleShare = async () => {
    const message =
      'Summary: ' +
      documentName +
      '\n\n' +
      keyPoints.map((point, index) => index + 1 + '. ' + point).join('\n');

    // Phones and some browsers have a share menu. Others get "copy to clipboard".
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Summary: ' + documentName, text: message });
      } catch (error) {
        // The student closed the share menu. Nothing to do.
      }
    } else {
      try {
        await navigator.clipboard.writeText(message);
        setNotice('Summary copied to your clipboard.');
      } catch (error) {
        setNotice('Could not share. Please try again.');
      }
    }
  };

  const handleSave = () => {
    // Saving to Firestore will be added in a later phase
    setNotice('Your summary was saved (demo).');
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
        <h1 className={styles.headerTitle}>Summary Result</h1>
        <button className={styles.iconButton} aria-label="Share" onClick={handleShare}>
          <IoShareSocialOutline size={22} />
        </button>
      </header>

      {/* Document name */}
      <div className={styles.documentCard}>
        <div className={styles.documentIcon}>
          <IoDocumentTextOutline size={24} />
        </div>
        <div>
          <p className={styles.documentLabel}>Document</p>
          <p className={styles.documentName}>{documentName}</p>
        </div>
      </div>

      {/* Key points */}
      <div className={styles.pointsCard}>
        <h2 className={styles.pointsTitle}>Key Points</h2>
        {keyPoints.map((point, index) => (
          <div key={index} className={styles.pointRow}>
            <div className={styles.numberCircle}>{index + 1}</div>
            <p className={styles.pointText}>{point}</p>
          </div>
        ))}
      </div>

      {/* Message shown after Save or Share */}
      {notice !== '' && <p className={styles.notice}>{notice}</p>}

      {/* Buttons */}
      <div className={styles.buttons}>
        <Button title="Save Summary" onClick={handleSave} />
        <Button title="Share" variant="secondary" onClick={handleShare} />
        <Button
          title="Summarize Another Note"
          variant="secondary"
          onClick={() => setNotice('Note summarizing will be added in a later phase.')}
        />
        <Button
          title="Back to Dashboard"
          variant="secondary"
          onClick={() => router.push('/dashboard')}
        />
      </div>
    </div>
  );
}