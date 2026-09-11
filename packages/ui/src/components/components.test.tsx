/**
 * @aegis/ui Components 单元测试
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { View } from './View';
import { Text } from './Text';
import { Button } from './Button';

describe('@aegis/ui Components', () => {
  describe('View', () => {
    it('should render without crashing', () => {
      render(<View>Test</View>);
      expect(screen.getByText('Test')).toBeTruthy();
    });

    it('should render children', () => {
      render(
        <View>
          <span>Child 1</span>
          <span>Child 2</span>
        </View>
      );
      expect(screen.getByText('Child 1')).toBeTruthy();
      expect(screen.getByText('Child 2')).toBeTruthy();
    });

    it('should apply default styles', () => {
      render(<View data-testid="view">Test</View>);
      const view = screen.getByTestId('view');
      expect(view.style.display).toBe('flex');
      expect(view.style.flexDirection).toBe('column');
    });

    it('should apply custom styles', () => {
      render(
        <View
          data-testid="view"
          style={{ backgroundColor: 'red', padding: 10 }}
        >
          Test
        </View>
      );
      const view = screen.getByTestId('view');
      expect(view.style.backgroundColor).toBe('red');
      expect(view.style.padding).toBe('10px');
    });

    it('should handle onClick', () => {
      const handleClick = vi.fn();
      render(
        <View data-testid="view" onClick={handleClick}>
          Clickable
        </View>
      );
      fireEvent.click(screen.getByTestId('view'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should forward additional props', () => {
      render(
        <View data-testid="view" data-custom="test-value">
          Test
        </View>
      );
      const view = screen.getByTestId('view');
      expect(view.getAttribute('data-custom')).toBe('test-value');
    });
  });

  describe('Text', () => {
    it('should render without crashing', () => {
      render(<Text>Hello</Text>);
      expect(screen.getByText('Hello')).toBeTruthy();
    });

    it('should render text content', () => {
      render(<Text>Test Text</Text>);
      expect(screen.getByText('Test Text')).toBeTruthy();
    });

    it('should apply default styles', () => {
      render(<Text data-testid="text">Test</Text>);
      const text = screen.getByTestId('text');
      expect(text.style.fontSize).toBe('16px');
      expect(text.style.lineHeight).toBe('24px');
      expect(text.style.color).toBe('rgb(0, 0, 0)');
    });

    it('should apply custom styles', () => {
      render(
        <Text
          data-testid="text"
          style={{ fontSize: 20, color: 'blue', fontWeight: 'bold' }}
        >
          Test
        </Text>
      );
      const text = screen.getByTestId('text');
      expect(text.style.fontSize).toBe('20px');
      expect(text.style.color).toBe('blue');
      expect(text.style.fontWeight).toBe('bold');
    });

    it('should handle numberOfLines', () => {
      render(
        <Text data-testid="text" numberOfLines={2}>
          Long text content that should be truncated
        </Text>
      );
      const text = screen.getByTestId('text');
      expect(text.style.webkitLineClamp).toBe('2');
      expect(text.style.webkitBoxOrient).toBe('vertical');
      expect(text.style.overflow).toBe('hidden');
    });

    it('should forward additional props', () => {
      render(
        <Text data-testid="text" data-custom="test-value">
          Test
        </Text>
      );
      const text = screen.getByTestId('text');
      expect(text.getAttribute('data-custom')).toBe('test-value');
    });
  });

  describe('Button', () => {
    it('should render without crashing', () => {
      render(<Button>Click Me</Button>);
      expect(screen.getByText('Click Me')).toBeTruthy();
    });

    it('should render children text', () => {
      render(<Button>Button Text</Button>);
      expect(screen.getByRole('button')).toBeTruthy();
      expect(screen.getByText('Button Text')).toBeTruthy();
    });

    it('should apply default styles', () => {
      render(<Button data-testid="button">Test</Button>);
      const button = screen.getByTestId('button');
      expect(button.style.backgroundColor).toBe('rgb(0, 122, 255)');
      expect(button.style.color).toBe('rgb(255, 255, 255)');
      expect(button.style.fontSize).toBe('16px');
      expect(button.style.borderRadius).toBe('8px');
    });

    it('should apply custom styles', () => {
      render(
        <Button
          data-testid="button"
          style={{ backgroundColor: 'green', width: 100 }}
        >
          Test
        </Button>
      );
      const button = screen.getByTestId('button');
      expect(button.style.backgroundColor).toBe('green');
      expect(button.style.width).toBe('100px');
    });

    it('should handle onClick', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle disabled state', () => {
      const handleClick = vi.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button.disabled).toBe(true);
      expect(button.style.opacity).toBe('0.5');
      expect(button.style.cursor).toBe('not-allowed');

      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should forward additional props', () => {
      render(
        <Button data-testid="button" data-custom="test-value">
          Test
        </Button>
      );
      const button = screen.getByTestId('button');
      expect(button.getAttribute('data-custom')).toBe('test-value');
    });

    it('should have correct display name', () => {
      expect(Button.displayName).toBe('Button');
    });
  });
});
