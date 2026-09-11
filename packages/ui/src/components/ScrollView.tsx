import React from 'react';
import { BaseStyle } from '../types';

export interface ScrollViewProps {
  style?: BaseStyle;
  children?: React.ReactNode;
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  scrollEventThrottle?: number;
}

export const ScrollView: React.FC<ScrollViewProps> = ({
  style,
  children,
  onScroll,
  showsVerticalScrollIndicator = true,
  showsHorizontalScrollIndicator = false,
}) => {
  return (
    <div
      style={{
        overflow: 'auto',
        flex: 1,
        ...style,
      }}
      onScroll={onScroll}
    >
      {children}
      {showsVerticalScrollIndicator && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 4,
            backgroundColor: 'rgba(0,0,0,0.1)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};

ScrollView.displayName = 'ScrollView';
