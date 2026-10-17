'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

export default function ChatBubble({ text, isUser }) {
  return (
    <div className={`${styles.row} ${isUser ? styles.rowUser : ''}`}>
      <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAi}`}>
        {isUser ? (
          // The student's own message stays plain text
          text
        ) : (
          // The AI's message is drawn as headings, lists, bold text, tables and code.
          // react-markdown does NOT run raw HTML, so a harmful reply cannot execute.
          <div className={styles.markdown}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {text}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}