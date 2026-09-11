/**
 * View Component
 *
 * 容器组件，类似于 HTML 的 div
 */

import React from 'react';
import { ViewProps } from '../types';

export const View: React.FC<ViewProps> = ({
  style,
  children,
  onClick,
  ...props
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

View.displayName = 'View';
