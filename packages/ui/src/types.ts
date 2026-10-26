/**
 * Aegis UI 类型定义
 */

import { ReactNode, HTMLAttributes, CSSProperties } from 'react';

// 基础样式属性
export type BaseStyle = CSSProperties & Record<string, string | number | undefined>;

// View 组件属性
export interface ViewProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
  style?: BaseStyle;
  children?: ReactNode;
  onClick?: () => void;
}

// Text 组件属性
export interface TextProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'style'> {
  style?: BaseStyle & {
    fontSize?: number;
    fontWeight?: CSSProperties['fontWeight'];
    textAlign?: CSSProperties['textAlign'];
    lineHeight?: number | string;
  };
  children?: ReactNode;
  numberOfLines?: number;
}

// Button 组件属性
export interface ButtonProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'style'> {
  style?: BaseStyle & {
    fontSize?: number;
  };
  children?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

// Input 组件属性
export interface InputProps extends Omit<HTMLInputElement, 'style' | 'onChange' | 'value' | 'placeholder'> {
  style?: BaseStyle & {
    fontSize?: number;
    placeholderColor?: string;
  };
  value?: string;
  placeholder?: string;
  onChangeText?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}
