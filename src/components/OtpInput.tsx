import {
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
  type ClipboardEvent,
} from 'react';
import './OtpInput.css';

interface Props {
  digits: string[];
  onChange: (digits: string[]) => void;
  disabled?: boolean;
}

export function OtpInput({ digits, onChange, disabled }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(index: number, e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = val;
    onChange(next);
    if (val && index < 5) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...digits];
    [...text].forEach((char, i) => { next[i] = char; });
    onChange(next);
    const focusIndex = Math.min(text.length, 5);
    refs.current[focusIndex]?.focus();
  }

  return (
    <div className="otp-container">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          className="otp-digit"
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  );
}
