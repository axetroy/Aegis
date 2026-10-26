import React from 'react';
import type { AegisInputRef } from '@aegis/protocol';
import { BaseStyle } from '../types';

export interface InputProps {
  ref?: React.Ref<AegisInputRef>;
  style?: BaseStyle & {
    fontSize?: number;
    placeholderColor?: string;
    borderWidth?: number;
    borderColor?: string;
  };
  value?: string;
  placeholder?: string;
  name?: string;
  onChangeText?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  keyboardType?: 'default' | 'numeric' | 'email';
  secureTextEntry?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const Input: React.FC<InputProps> = ({
  ref,
  style,
  value,
  placeholder,
  name,
  onChangeText,
  onFocus,
  onBlur,
  keyboardType = 'default',
  secureTextEntry = false,
  disabled = false,
  autoFocus = false,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement> | { value?: unknown }) => {
    const value = 'target' in event ? event.target.value : event.value;
    if (typeof value === 'string') onChangeText?.(value);
  };

  const inputType = secureTextEntry ? 'password' : keyboardType === 'numeric' ? 'number' : 'text';

  return (
    <input
      ref={ref as unknown as React.Ref<HTMLInputElement>}
      type={inputType}
      value={value}
      placeholder={placeholder}
      name={name}
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
