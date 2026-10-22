'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BsHandThumbsDownFill,
  BsHandThumbsDown,
  BsHandThumbsUpFill,
  BsHandThumbsUp,
} from 'react-icons/bs';
import styles from './ChatBubble.module.css';

// Small changes to how some elements are drawn
const markdownComponents = {
  // Links open in a new tab and cannot take over the CampusAI page
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  // Wide tables scroll sideways inside the bubble instead of breaking the page
  table: ({ children }) => (
    <div className={styles.tableWrap}>
      <table>{children}</table>
    </div>
  ),
};

// canRate: show the thumbs under this answer
// rating: 'up', 'down' or null. onRate(newRating) is called when a thumb is pressed.
export default function ChatBubble({ text, isUser, canRate = false, rating = null, onRate }) {
  if (isUser) {
    return (
      <div className={`${styles.row} ${styles.rowUser}`}>
        {/* The student's own message stays plain text */}
        <div className={`${styles.bubble} ${styles.bubbleUser}`}>{text}</div>
      </div>
    );
  }

  return (
    <div className={styles.row}>
      <div className={styles.stack}>
        <div className={`${styles.bubble} ${styles.bubbleAi}`}>
          {/* The AI's message is drawn as headings, lists, bold text, tables and code.
              react-markdown does NOT run raw HTML, so a harmful reply cannot execute. */}
          <div className={styles.markdown}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {text}
            </ReactMarkdown>
          </div>
        </div>

        {canRate && (
          <div className={styles.feedback}>
            <button
              type="button"
              className={`${styles.rateButton} ${rating === 'up' ? styles.rateUp : ''}`}
              aria-label="Good answer"
              aria-pressed={rating === 'up'}
              title="Good answer"
              onClick={() => onRate && onRate(rating === 'up' ? null : 'up')}
            >
              {rating === 'up' ? <BsHandThumbsUpFill size={17} /> : <BsHandThumbsUp size={17} />}
            </button>
            <button
              type="button"
              className={`${styles.rateButton} ${rating === 'down' ? styles.rateDown : ''}`}
              aria-label="Bad answer"
              aria-pressed={rating === 'down'}
              title="Bad answer"
              onClick={() => onRate && onRate(rating === 'down' ? null : 'down')}
            >
              {rating === 'down' ? <BsHandThumbsDownFill size={17} /> : <BsHandThumbsDown size={17} />}
            </button>
            {rating && <span className={styles.thanks}>Thanks for your feedback</span>}
          </div>
        )}
      </div>
    </div>
  );
}