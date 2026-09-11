/**
 * Aegis UI 类型定义
 */

import { ReactNode, HTMLAttributes, CSSProperties } from 'react';

// 基础样式属性
export interface BaseStyle {
  display?: CSSProperties['display'];
  flexDirection?: CSSProperties['flexDirection'];
  justifyContent?: CSSProperties['justifyContent'];
  alignItems?: CSSProperties['alignItems'];
  flex?: CSSProperties['flex'];
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  padding?: number | string;
  paddingTop?: number | string;
  paddingRight?: number | string;
  paddingBottom?: number | string;
  paddingLeft?: number | string;
  margin?: number | string;
  marginTop?: number | string;
  marginRight?: number | string;
  marginBottom?: number | string;
  marginLeft?: number | string;
  gap?: number;
  backgroundColor?: CSSProperties['backgroundColor'];
  color?: CSSProperties['color'];
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: CSSProperties['borderColor'];
  borderStyle?: CSSProperties['borderStyle'];
  opacity?: CSSProperties['opacity'];
  overflow?: CSSProperties['overflow'];
  position?: CSSProperties['position'];
  top?: CSSProperties['top'];
  left?: CSSProperties['left'];
  right?: CSSProperties['right'];
  bottom?: CSSProperties['bottom'];
  maxWidth?: CSSProperties['maxWidth'];
  boxShadow?: CSSProperties['boxShadow'];
  zIndex?: CSSProperties['zIndex'];
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
