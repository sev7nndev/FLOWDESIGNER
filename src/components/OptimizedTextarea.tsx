import React, { memo, useState, useCallback, useEffect } from 'react';

interface OptimizedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  rows?: number;
  debounceMs?: number;
}

/**
 * Textarea otimizado com debounce para melhor performance em mobile
 * Especialmente útil para o campo de briefing que pode ter muito texto
 */
const OptimizedTextareaComponent: React.FC<OptimizedTextareaProps> = ({
  value,
  onChange,
  placeholder,
  className,
  maxLength,
  rows,
  debounceMs = 500 // Maior debounce para textarea
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [localValue, debounceMs, onChange, value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalValue(e.target.value);
  }, []);

  return (
    <textarea
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      maxLength={maxLength}
      rows={rows}
      className={className}
    />
  );
};

export const OptimizedTextarea = memo(OptimizedTextareaComponent);
