'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import {
  BsArrowLeft,
  BsCamera,
  BsXLg,
  BsCloudUpload,
  BsFileEarmarkText,
  BsImage,
} from 'react-icons/bs';
import { auth, db } from '../../../lib/firebase';
import Button from '../../../components/Button';
import notesStyles from '../notes/notes.module.css';
import styles from './upload.module.css';

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const EXTENSION_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
  txt: 'text/plain',
};

function getType(file) {
  const declared = (file.type || '').toLowerCase();
  if (declared === 'image/jpg') {
    return 'image/jpeg';
  }
  if (Object.values(EXTENSION_TYPES).includes(declared)) {
    return declared;
  }
  const name = (file.name || '').toLowerCase();
  const ext = name.includes('.') ? name.split('.').pop() : '';
  return EXTENSION_TYPES[ext] || '';
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) {
    return Math.max(1, Math.round(bytes / 1024)) + ' KB';
  }
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function UploadPage() {
  const router = useRouter();
  const cameraRef = useRef(null);
  const fileRef = useRef(null);
  const xhrRef = useRef(null);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [phase, setPhase] = useState('empty'); // empty, ready, uploading, analysing, failed, done
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dragging, setDragging] = useState(false);

  // Free the preview picture when it is no longer needed
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const busy = phase === 'uploading' || phase === 'analysing';

  const selectFile = (chosen) => {
    if (!chosen || busy) {
      return;
    }

    const type = getType(chosen);
    if (type === '') {
      setError('Please choose a JPG, PNG, WebP, PDF or TXT file.');
      return;
    }
    if (chosen.size === 0) {
      setError('That file is empty.');
      return;
    }
    if (chosen.size > MAX_BYTES) {
      setError('That file is too big. The limit is 4 MB.');
      return;
    }

    setError('');
    setNotice('');
    setFile(chosen);
    setPreviewUrl(type.startsWith('image/') ? URL.createObjectURL(chosen) : '');
    setPhase('ready');
  };

  const handleInputChange = (event) => {
    selectFile(event.target.files && event.target.files[0]);
    event.target.value = ''; // lets the student pick the same file again
  };

  const removeFile = () => {
    if (busy) {
      return;
    }
    setFile(null);
    setPreviewUrl('');
    setError('');
    setPhase('empty');
  };

  const cancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
    }
  };

  const startUpload = async () => {
    if (!file || busy) {
      return;
    }
    if (!auth.currentUser) {
      setError('Please log in again.');
      setPhase('failed');
      return;
    }

    setError('');
    setNotice('');
    setProgress(0);
    setPhase('uploading');

    let token;
    try {
      token = await auth.currentUser.getIdToken();
    } catch (err) {
      setError('Please log in again.');
      setPhase('failed');
      return;
    }

    const form = new FormData();
    form.append('file', file);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open('POST', '/api/upload-summarize');
    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    xhr.timeout = 90000;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.upload.onload = () => {
      setProgress(100);
      setPhase('analysing');
    };
    xhr.onload = () => {
      xhrRef.current = null;
      let data = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch (err) {
        // The answer was not JSON. We show a general message below.
      }
      if (xhr.status >= 200 && xhr.status < 300 && Array.isArray(data.points)) {
        setResult({ title: data.title, points: data.points });
        setSaved(false);
        setPhase('done');
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
        setPhase('failed');
      }
    };
    xhr.onerror = () => {
      xhrRef.current = null;
      setError('Network problem. Please check your connection and try again.');
      setPhase('failed');
    };
    xhr.ontimeout = () => {
      xhrRef.current = null;
      setError('This is taking too long. Please try again.');
      setPhase('failed');
    };
    xhr.onabort = () => {
      xhrRef.current = null;
      setNotice('Upload cancelled.');
      setPhase('ready');
    };

    xhr.send(form);
  };

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

  const handleShare = async () => {
    if (!result) {
      return;
    }
    const message =
      'Summary: ' +
      result.title +
      '\n\n' +
      result.points.map((point, index) => index + 1 + '. ' + point).join('\n');

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Summary: ' + result.title, text: message });
      } catch (err) {
        // The student closed the share menu.
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

  const uploadAnother = () => {
    setFile(null);
    setPreviewUrl('');
    setResult(null);
    setError('');
    setNotice('');
    setSaved(false);
    setPhase('empty');
  };

  const isImage = file ? getType(file).startsWith('image/') : false;
  const FileIcon = isImage ? BsImage : BsFileEarmarkText;

  return (
    <div className={notesStyles.page}>
      <header className={notesStyles.header}>
        <button
          className={notesStyles.iconButton}
          aria-label="Back to Dashboard"
          onClick={() => router.push('/dashboard')}
        >
          <BsArrowLeft size={22} />
        </button>
        <h1 className={notesStyles.headerTitle}>{result ? 'Summary Result' : 'Upload Notes'}</h1>
        <span className={notesStyles.iconSpacer}></span>
      </header>

      {phase !== 'done' && (
        <div className={notesStyles.formCard}>
          <input
            ref={cameraRef}
            type="file"
            hidden
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={handleInputChange}
          />
          <input
            ref={fileRef}
            type="file"
            hidden
            accept=".jpg,.jpeg,.png,.webp,.pdf,.txt,image/jpeg,image/png,image/webp,application/pdf,text/plain"
            onChange={handleInputChange}
          />

          {!file && (
            <div
              className={`${styles.dropzone} ${dragging ? styles.dropzoneActive : ''}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                selectFile(event.dataTransfer.files && event.dataTransfer.files[0]);
              }}
            >
              <div className={styles.dropIcon}>
                <BsCloudUpload size={40} />
              </div>
              <p className={styles.dropTitle}>Upload your notes</p>
              <p className={styles.dropHint}>
                Take a photo of your notes, or choose a picture, PDF or text file.
                <br />
                JPG, PNG, WebP, PDF or TXT, up to 4 MB. On a computer you can also drop a file here.
              </p>
              <div className={styles.actions} style={{ marginTop: '16px' }}>
                <Button
                  title="Take a photo"
                  onClick={() => cameraRef.current && cameraRef.current.click()}
                />
                <Button
                  title="Choose a file"
                  variant="secondary"
                  onClick={() => fileRef.current && fileRef.current.click()}
                />
              </div>
            </div>
          )}

          {file && (
            <>
              {previewUrl !== '' && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Preview of your notes" className={styles.preview} />
              )}

              <div className={styles.fileCard}>
                <div className={styles.fileIcon}>
                  <FileIcon size={22} />
                </div>
                <div className={styles.fileText}>
                  <p className={styles.fileName}>{file.name}</p>
                  <p className={styles.fileSize}>{formatSize(file.size)}</p>
                </div>
                {!busy && (
                  <button
                    type="button"
                    className={styles.removeButton}
                    aria-label="Remove file"
                    onClick={removeFile}
                  >
                    <BsXLg size={20} />
                  </button>
                )}
              </div>
            </>
          )}

          {phase === 'uploading' && (
            <>
              <div className={styles.progressTrack}>
                <div className={styles.progressBar} style={{ width: progress + '%' }}></div>
              </div>
              <p className={styles.status}>Uploading... {progress}%</p>
            </>
          )}

          {phase === 'analysing' && (
            <>
              <div className={styles.progressTrack}>
                <div className={styles.progressBar} style={{ width: '100%' }}></div>
              </div>
              <p className={styles.status}>Reading your notes with AI. This can take a few seconds...</p>
            </>
          )}

          {error !== '' && <p className={notesStyles.error}>{error}</p>}
          {notice !== '' && <p className={notesStyles.notice}>{notice}</p>}

          <div className={styles.actions}>
            {(phase === 'ready' || phase === 'failed') && (
              <Button
                title={phase === 'failed' ? 'Try again' : 'Upload and summarize'}
                onClick={startUpload}
              />
            )}
            {busy && <Button title="Cancel" variant="secondary" onClick={cancelUpload} />}
            {phase === 'failed' && (
              <Button title="Choose another file" variant="secondary" onClick={removeFile} />
            )}
          </div>
        </div>
      )}

      {phase === 'done' && result && (
        <>
          <div className={notesStyles.documentCard}>
            <div className={notesStyles.documentIcon}>
              <BsFileEarmarkText size={24} />
            </div>
            <div>
              <p className={notesStyles.documentLabel}>Document</p>
              <p className={notesStyles.documentName}>{result.title}</p>
            </div>
          </div>

          <div className={notesStyles.pointsCard}>
            <h2 className={notesStyles.pointsTitle}>Key Points</h2>
            {result.points.map((point, index) => (
              <div key={index} className={notesStyles.pointRow}>
                <div className={notesStyles.numberCircle}>{index + 1}</div>
                <p className={notesStyles.pointText}>{point}</p>
              </div>
            ))}
          </div>

          {notice !== '' && <p className={notesStyles.notice}>{notice}</p>}

          <div className={notesStyles.buttons}>
            <Button
              title={saved ? 'Saved' : saving ? 'Saving...' : 'Save Summary'}
              onClick={handleSave}
            />
            <Button title="Share" variant="secondary" onClick={handleShare} />
            <Button title="Upload Another File" variant="secondary" onClick={uploadAnother} />
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