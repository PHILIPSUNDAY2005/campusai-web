'use client';

import { useState } from 'react';
import styles from './Input.module.css';

export default function Input({
  label,
  id,
  value,
  onChangeText,
  placeholder,
  type = 'text',
  isPassword = false,
}) {
  // hidden = true means the password is shown as dots
  const [hidden, setHidden] = useState(isPassword);

  // Password boxes switch between "password" and "text". Others keep their type.
  const inputType = isPassword ? (hidden ? 'password' : 'text') : type;

  return (
    <div className={styles.wrapper}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.inputRow}>
        <input
          id={id}
          className={styles.input}
          type={inputType}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChangeText(event.target.value)}
        />
        {isPassword && (
          <button type="button" className={styles.toggle} onClick={() => setHidden(!hidden)}>
            {hidden ? 'Show' : 'Hide'}
          </button>
        )}
      </div>
    </div>
  );
}