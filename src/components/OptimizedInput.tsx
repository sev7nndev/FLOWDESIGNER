import React, { memo, useState, useCallback, useEffect } from 'react';

interface OptimizedInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  type?: string;
  debounceMs?: number;
}

/**
 * Input otimizado com debounce para melhor performance em mobile
 * Evita re-renders excessivos durante digitação
 */
const OptimizedInputComponent: React.FC<OptimizedInputProps> = ({
  value,
  onChange,
  placeholder,
  className,
  maxLength,
  type = 'text',
  debounceMs = 300
}) => {
  const [localValue, setLocalValue] = useState(value);

  // Sync local value with prop value when it changes externally
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [localValue, debounceMs, onChange, value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  }, []);

  return (
    <input
      type={type}
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      maxLength={maxLength}
      className={className}
    />
  );
};

export const OptimizedInput = memo(OptimizedInputComponent);
