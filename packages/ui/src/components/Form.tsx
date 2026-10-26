import React from 'react';
import { BaseStyle } from '../types';

export interface FormProps {
  style?: BaseStyle;
  children?: React.ReactNode;
  onSubmit?: (data: Record<string, string>) => void | Promise<void>;
  className?: string;
  id?: string;
}

export const Form: React.FC<FormProps> = ({
  onSubmit,
  children,
  style,
  className,
  id,
  ...props
}) => {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement> | Record<string, string>) => {
    if (typeof (event as React.FormEvent<HTMLFormElement>).preventDefault === 'function') {
      const formEvent = event as React.FormEvent<HTMLFormElement>;
      formEvent.preventDefault();
      if (!onSubmit) return;

      const formData = new FormData(formEvent.currentTarget);
      const data: Record<string, string> = {};
      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
          Object.defineProperty(data, key, {
            value,
            enumerable: true,
            configurable: true,
            writable: true,
          });
        }
      }
      onSubmit(data);
      return;
    }

    onSubmit?.(event as Record<string, string>);
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
