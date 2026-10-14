'use client';

import Button from './Button';
import styles from './FeatureCard.module.css';

export default function FeatureCard({ icon: Icon, title, description, buttonTitle, onClick }) {
  // With a button, only the button is clickable. Without one, the whole card is.
  const cardClickable = !buttonTitle;

  return (
    <div
      className={`${styles.card} ${cardClickable ? styles.clickable : ''}`}
      onClick={cardClickable ? onClick : undefined}
      onKeyDown={(event) => {
        if (cardClickable && event.key === 'Enter') {
          onClick();
        }
      }}
      role={cardClickable ? 'button' : undefined}
      tabIndex={cardClickable ? 0 : undefined}
    >
      <div className={styles.row}>
        <div className={styles.iconCircle}>
          <Icon size={24} />
        </div>
        <div className={styles.text}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.description}>{description}</p>
        </div>
      </div>

      {buttonTitle && (
        <div className={styles.buttonBox}>
          <Button title={buttonTitle} onClick={onClick} />
        </div>
      )}
    </div>
  );
}