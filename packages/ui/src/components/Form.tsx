import React from 'react';
import { BaseStyle } from '../types';

export interface FormProps {
  style?: BaseStyle;
  children?: React.ReactNode;
  onSubmit?: (data: Record<string, string>) => void | Promise<void>;
  className?: string;
  id?: string;
}

export const Form: React.FC<FormProps> = ({ onSubmit, children, style, className, id, ...props }) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!onSubmit) return;

    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      data[key] = value as string;
    }
    onSubmit(data);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={className}
      id={id}
      {...props}
      style={{ display: 'flex', flexDirection: 'column', ...style }}
    >
      {children}
    </form>
  );
};

Form.displayName = 'Form';
