import styles from './ChatBubble.module.css';

export default function ChatBubble({ text, isUser }) {
  return (
    <div className={`${styles.row} ${isUser ? styles.rowUser : ''}`}>
      <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAi}`}>
        {text}
      </div>
    </div>
  );
}