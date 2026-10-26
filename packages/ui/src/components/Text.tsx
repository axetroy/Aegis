/**
 * Text Component
 *
 * 文本组件，用于显示文本内容
 */

import React from 'react';
import { TextProps } from '../types';

export const Text: React.FC<TextProps> = ({ ref, style, children, numberOfLines, ...props }) => {
  const textStyle: React.CSSProperties = {
    fontSize: 16,
    lineHeight: '24px',
    color: '#000000',
    ...style,
  };

  // 处理 numberOfLines
  if (numberOfLines !== undefined) {
    textStyle.display = '-webkit-box';
    textStyle.WebkitLineClamp = numberOfLines;
    textStyle.WebkitBoxOrient = 'vertical';
    textStyle.overflow = 'hidden';
  }

  return (
    <span ref={ref as unknown as React.Ref<HTMLSpanElement>} style={textStyle} {...props}>
      {children}
    </span>
  );
};

Text.displayName = 'Text';
