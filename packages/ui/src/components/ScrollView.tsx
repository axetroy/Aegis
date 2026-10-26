import React from 'react';
import type { AegisScrollViewRef } from '@aegis/protocol';
import { BaseStyle } from '../types';

export interface ScrollViewProps {
  ref?: React.Ref<AegisScrollViewRef>;
  style?: BaseStyle;
  children?: React.ReactNode;
  onScroll?: (event: ScrollViewEvent) => void;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  scrollEventThrottle?: number;
}

export interface ScrollViewEvent {
  scrollTop: number;
  scrollLeft: number;
  scrollHeight: number;
  clientHeight: number;
  clientWidth: number;
}

export const ScrollView: React.FC<ScrollViewProps> = ({
  ref,
  style,
  children,
  onScroll,
  showsVerticalScrollIndicator = true,
  showsHorizontalScrollIndicator: _showsHorizontalScrollIndicator = false,
}) => {
  const handleScroll = (event: React.UIEvent<HTMLElement> | ScrollViewEvent): void => {
    if ('currentTarget' in event) {
      const target = event.currentTarget;
      onScroll?.({
        scrollTop: target.scrollTop,
        scrollLeft: target.scrollLeft,
        scrollHeight: target.scrollHeight,
        clientHeight: target.clientHeight,
        clientWidth: target.clientWidth,
      });
      return;
    }
    onScroll?.(event);
  };

  return React.createElement(
    'scroll-view' as React.ElementType,
    {
      ref: ref as unknown as React.Ref<HTMLElement>,
      style: {
        overflow: 'auto',
        flex: 1,
        ...style,
      },
      onScroll: handleScroll,
    },
    children,
    showsVerticalScrollIndicator
      ? React.createElement('div', {
          style: {
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 4,
            backgroundColor: 'rgba(0,0,0,0.1)',
            pointerEvents: 'none',
          },
        })
      : null,
  );
};

ScrollView.displayName = 'ScrollView';
