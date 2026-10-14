'use client';

import styles from './Button.module.css';

export default function Button({ title, onClick, variant = 'primary', type = 'button' }) {
  const variantClass = variant === 'primary' ? styles.primary : styles.secondary;

  return (
    <button type={type} onClick={onClick} className={`${styles.button} ${variantClass}`}>
      {title}
    </button>
  );
}