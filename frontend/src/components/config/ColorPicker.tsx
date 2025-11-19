import { useRef, useState } from 'react';
import { isValidHexColor } from '../../utils/colorUtils';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

export const ColorPicker = ({ color, onChange, label }: ColorPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSwatchClick = () => {
    setIsOpen(true);
    // Trigger the native color picker
    inputRef.current?.click();
  };

  const handleSwatchKeyDown = (e: React.KeyboardEvent) => {
    // Support Enter and Space keys for accessibility
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSwatchClick();
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    
    // Validate the color before applying
    if (isValidHexColor(newColor)) {
      onChange(newColor);
    }
  };

  const handleInputClose = () => {
    setIsOpen(false);
  };

  const ariaLabel = label ? `Color for ${label}` : 'Color picker';

  return (
    <div className="inline-flex items-center">
      <button
        type="button"
        onClick={handleSwatchClick}
        onKeyDown={handleSwatchKeyDown}
        className="h-8 w-8 rounded-full border-2 border-white/20 transition-all hover:border-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
        style={{ backgroundColor: color }}
        aria-label={ariaLabel}
        title={ariaLabel}
      />
      <input
        ref={inputRef}
        type="color"
        value={color}
        onChange={handleColorChange}
        onBlur={handleInputClose}
        className="sr-only"
        aria-label={ariaLabel}
      />
    </div>
  );
};
