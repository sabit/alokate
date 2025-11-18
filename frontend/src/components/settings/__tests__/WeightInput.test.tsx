import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeightInput, clampWeight, roundToDecimalPlaces, validateWeight } from '../WeightInput';

describe('WeightInput validation utilities', () => {
  describe('clampWeight', () => {
    it('should clamp values below minimum to 0', () => {
      expect(clampWeight(-5)).toBe(0);
      expect(clampWeight(-0.1)).toBe(0);
    });

    it('should clamp values above maximum to 10', () => {
      expect(clampWeight(15)).toBe(10);
      expect(clampWeight(10.1)).toBe(10);
    });

    it('should not modify values within range', () => {
      expect(clampWeight(0)).toBe(0);
      expect(clampWeight(5)).toBe(5);
      expect(clampWeight(10)).toBe(10);
    });
  });

  describe('roundToDecimalPlaces', () => {
    it('should round to 2 decimal places by default', () => {
      expect(roundToDecimalPlaces(1.234)).toBe(1.23);
      expect(roundToDecimalPlaces(1.235)).toBe(1.24);
      expect(roundToDecimalPlaces(1.999)).toBe(2.0);
    });

    it('should handle whole numbers', () => {
      expect(roundToDecimalPlaces(5)).toBe(5);
    });
  });

  describe('validateWeight', () => {
    it('should return null for NaN', () => {
      expect(validateWeight(NaN)).toBeNull();
    });

    it('should return null for Infinity', () => {
      expect(validateWeight(Infinity)).toBeNull();
      expect(validateWeight(-Infinity)).toBeNull();
    });

    it('should clamp and round valid values', () => {
      expect(validateWeight(-5)).toBe(0);
      expect(validateWeight(15)).toBe(10);
      expect(validateWeight(5.567)).toBe(5.57);
    });
  });
});

describe('WeightInput component', () => {
  it('should render with label and helper text', () => {
    const onChange = vi.fn();
    render(
      <WeightInput
        label="Test Weight"
        value={1.5}
        onChange={onChange}
        helperText="This is helper text"
      />
    );

    expect(screen.getByText('Test Weight')).toBeInTheDocument();
    expect(screen.getByText('This is helper text')).toBeInTheDocument();
  });

  it('should display formatted value', () => {
    const onChange = vi.fn();
    render(
      <WeightInput
        label="Test Weight"
        value={1.5}
        onChange={onChange}
      />
    );

    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    expect(input.value).toBe('1.50');
  });

  it('should call onChange with validated value on blur', () => {
    const onChange = vi.fn();
    render(
      <WeightInput
        label="Test Weight"
        value={1.0}
        onChange={onChange}
      />
    );

    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '5.5' } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith(5.5);
  });

  it('should clamp values on blur', () => {
    const onChange = vi.fn();
    render(
      <WeightInput
        label="Test Weight"
        value={1.0}
        onChange={onChange}
      />
    );

    const input = screen.getByRole('spinbutton');
    
    // Test upper bound
    fireEvent.change(input, { target: { value: '15' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(10);

    // Test lower bound
    onChange.mockClear();
    fireEvent.change(input, { target: { value: '-5' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('should preserve previous value for invalid input', () => {
    const onChange = vi.fn();
    render(
      <WeightInput
        label="Test Weight"
        value={2.5}
        onChange={onChange}
      />
    );

    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    
    fireEvent.change(input, { target: { value: 'invalid' } });
    fireEvent.blur(input);

    expect(onChange).not.toHaveBeenCalled();
    expect(input.value).toBe('2.50');
  });

  it('should round to 2 decimal places', () => {
    const onChange = vi.fn();
    render(
      <WeightInput
        label="Test Weight"
        value={1.0}
        onChange={onChange}
      />
    );

    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '3.456' } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith(3.46);
  });
});
