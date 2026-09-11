/**
 * Button Component
 *
 * 按钮组件，用于用户交互
 */

import React from 'react';
import { ButtonProps } from '../types';

export const Button: React.FC<ButtonProps> = ({
  style,
  children,
  disabled,
  onClick,
  ...props
}) => {
  return (
    <button
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 16px',
        backgroundColor: '#007AFF',
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',
        border: 'none',
        borderRadius: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

Button.displayName = 'Button';
