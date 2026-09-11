/**
 * Aegis UI 类型定义
 */

import { ReactNode, HTMLAttributes } from 'react';

// 基础样式属性
export interface BaseStyle {
  display?: 'flex' | 'none' | 'block';
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  flex?: number;
  width?: number | string;
  height?: number | string;
  padding?: number;
  margin?: number;
  backgroundColor?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  opacity?: number;
  overflow?: 'visible' | 'hidden' | 'scroll';
}

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
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
    lineHeight?: number;
  };
  children?: ReactNode;
  numberOfLines?: number;
}

// Button 组件属性
export interface ButtonProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'style'> {
  style?: BaseStyle & {
    backgroundColor?: string;
    color?: string;
    fontSize?: number;
  };
  children?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

// Input 组件属性
export interface InputProps extends Omit<HTMLInputElement, 'style' | 'onChange' | 'value'> {
  style?: BaseStyle & {
    fontSize?: number;
    color?: string;
    placeholderColor?: string;
    backgroundColor?: string;
  };
  value?: string;
  placeholder?: string;
  onChangeText?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}
