import { useState, useRef, useCallback, useEffect } from 'react';
import { parseNumber } from '../utils/parseNumber';

interface UseNumericFieldOptions {
  storeValue: number;
  onCommit: (value: number) => void;
  format?: (value: number) => string;
  validate?: (value: number) => boolean;
}

export function useNumericField({
  storeValue,
  onCommit,
  format = String,
  validate = isFinite,
}: UseNumericFieldOptions) {
  const [localValue, setLocalValue] = useState(() => format(storeValue));
  const focusedRef = useRef(false);

  // Sync from store when not focused
  useEffect(() => {
    if (!focusedRef.current) {
      setLocalValue(format(storeValue));
    }
  }, [storeValue, format]);

  const commit = useCallback(() => {
    const parsed = parseNumber(localValue);
    if (!isNaN(parsed) && validate(parsed)) {
      onCommit(parsed);
      setLocalValue(format(parsed));
    } else {
      setLocalValue(format(storeValue));
    }
  }, [localValue, validate, onCommit, format, storeValue]);

  const revert = useCallback(() => {
    setLocalValue(format(storeValue));
  }, [format, storeValue]);

  const inputProps = {
    type: 'text' as const,
    inputMode: 'decimal' as const,
    value: localValue,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalValue(e.target.value);
    },
    onFocus: () => {
      focusedRef.current = true;
    },
    onBlur: () => {
      focusedRef.current = false;
      commit();
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.currentTarget.blur();
      } else if (e.key === 'Escape') {
        focusedRef.current = false;
        revert();
        e.currentTarget.blur();
      }
    },
  };

  return { inputProps };
}
