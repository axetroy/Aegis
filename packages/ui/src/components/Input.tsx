import React from 'react';
import { BaseStyle } from '../types';

export interface InputProps {
  style?: BaseStyle & {
    fontSize?: number;
    placeholderColor?: string;
    borderWidth?: number;
    borderColor?: string;
  };
  value?: string;
  placeholder?: string;
  onChangeText?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  keyboardType?: 'default' | 'numeric' | 'email';
  secureTextEntry?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const Input: React.FC<InputProps> = ({
  style,
  value,
  placeholder,
  onChangeText,
  onFocus,
  onBlur,
  keyboardType = 'default',
  secureTextEntry = false,
  disabled = false,
  autoFocus = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeText?.(e.target.value);
  };

  const inputType = secureTextEntry ? 'password' : keyboardType === 'numeric' ? 'number' : 'text';

  return (
    <input
      type={inputType}
      value={value}
      placeholder={placeholder}
      onChange={handleChange}
      onFocus={onFocus}
      onBlur={onBlur}
      disabled={disabled}
      autoFocus={autoFocus}
      style={{
        padding: '8px 12px',
        fontSize: 16,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: '#ccc',
        borderRadius: 4,
        backgroundColor: disabled ? '#f5f5f5' : '#fff',
        color: '#000',
        width: '100%',
        boxSizing: 'border-box',
        ...style,
      }}
    />
  );
};

Input.displayName = 'Input';
