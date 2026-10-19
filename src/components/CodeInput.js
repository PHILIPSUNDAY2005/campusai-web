'use client';

import { useRef } from 'react';
import styles from './CodeInput.module.css';

const LENGTH = 6;

// Six boxes for a 6-digit code. "value" is a string of digits like "482913".
export default function CodeInput({ value, onChange, disabled = false }) {
  const refs = useRef([]);

  const focusBox = (index) => {
    const box = refs.current[index];
    if (box) {
      box.focus();
      box.select();
    }
  };

  const handleChange = (index, event) => {
    const typed = event.target.value.replace(/\D/g, ''); // keep digits only

    if (typed === '') {
      // The box was cleared: remove that digit
      onChange(value.slice(0, index) + value.slice(index + 1));
      return;
    }

    const newValue = (value.slice(0, index) + typed + value.slice(index + 1)).slice(0, LENGTH);
    onChange(newValue);
    focusBox(Math.min(index + typed.length, LENGTH - 1));
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !value[index] && index > 0) {
      // Empty box + Backspace: go back and remove the previous digit
      event.preventDefault();
      onChange(value.slice(0, index - 1));
      focusBox(index - 1);
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focusBox(index - 1);
    } else if (event.key === 'ArrowRight' && index < LENGTH - 1) {
      event.preventDefault();
      focusBox(index + 1);
    }
  };

  const handlePaste = (event) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH);
    if (pasted !== '') {
      event.preventDefault();
      onChange(pasted);
      focusBox(Math.min(pasted.length, LENGTH - 1));
    }
  };

  return (
    <div className={styles.row} onPaste={handlePaste}>
      {Array.from({ length: LENGTH }).map((_, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element;
          }}
          className={styles.box}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          aria-label={'Digit ' + (index + 1) + ' of 6'}
          value={value[index] || ''}
          disabled={disabled}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onFocus={(event) => event.target.select()}
        />
      ))}
    </div>
  );
}