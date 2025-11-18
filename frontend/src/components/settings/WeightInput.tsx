import { useState, useEffect } from 'react';
import { twMerge } from 'tailwind-merge';

// Validation constants
const MIN_WEIGHT = 0;
const MAX_WEIGHT = 10;
const DECIMAL_PLACES = 2;

/**
 * Clamps a value between min and max bounds
 */
export const clampWeight = (value: number, min = MIN_WEIGHT, max = MAX_WEIGHT): number => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Rounds a value to specified decimal places
 */
export const roundToDecimalPlaces = (value: number, places = DECIMAL_PLACES): number => {
  const multiplier = Math.pow(10, places);
  return Math.round(value * multiplier) / multiplier;
};

/**
 * Validates and normalizes a weight value
 * Returns the normalized value or null if invalid
 */
export const validateWeight = (value: number): number | null => {
  if (isNaN(value) || !isFinite(value)) {
    return null;
  }
  
  const clamped = clampWeight(value);
  const rounded = roundToDecimalPlaces(clamped);
  
  return rounded;
};

interface WeightInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  helperText?: string;
  className?: string;
}

export const WeightInput = ({ 
  label, 
  value, 
  onChange, 
  helperText,
  className 
}: WeightInputProps) => {
  // Local state for the input field to handle intermediate values
  const [inputValue, setInputValue] = useState(value.toFixed(DECIMAL_PLACES));

  // Sync local state when prop value changes
  useEffect(() => {
    setInputValue(value.toFixed(DECIMAL_PLACES));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setInputValue(rawValue);
    
    // Validate and propagate changes immediately (for spinner buttons)
    const numericValue = parseFloat(rawValue);
    const validated = validateWeight(numericValue);
    
    if (validated !== null) {
      onChange(validated);
    }
  };

  const handleBlur = () => {
    const numericValue = parseFloat(inputValue);
    const validated = validateWeight(numericValue);
    
    if (validated !== null) {
      // Valid input - update parent and format display
      onChange(validated);
      setInputValue(validated.toFixed(DECIMAL_PLACES));
    } else {
      // Invalid input - revert to previous valid value
      setInputValue(value.toFixed(DECIMAL_PLACES));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className={twMerge('flex flex-col', className)}>
      <label className="text-sm font-medium text-slate-200" htmlFor={`weight-${label}`}>
        {label}
      </label>
      <input
        id={`weight-${label}`}
        type="number"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        min={MIN_WEIGHT}
        max={MAX_WEIGHT}
        step={0.1}
        className="mt-2 w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-inner focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
      />
      {helperText && (
        <p className="mt-1 text-xs text-slate-400">{helperText}</p>
      )}
    </div>
  );
};
