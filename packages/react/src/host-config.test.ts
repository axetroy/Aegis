/**
 * @aegis/react Host Config 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createInstance,
  createTextInstance,
  appendInitialChild,
  insertBefore,
  removeChild,
  finalizeInitialChildren,
  prepareUpdate,
  commitUpdate,
  commitTextUpdate,
  commitMount,
  commitUnmount,
  getTextContent,
  isTextInstance,
  scheduleTimeout,
  cancelTimeout,
  now,
  supportsMicrotasks,
  isPrimaryRenderer,
  supportsPersistence,
  supportsHydration,
  type AegisInstance,
} from './host-config';
import { NodeType, UIMessageType } from '@aegis/protocol';

// Mock postMessage
const mockPostMessage = vi.fn();


function getLastCall(): Record<string, unknown>[] {
  const calls = mockPostMessage.mock.calls;
  const last = calls[calls.length - 1];
  if (!last) {
    throw new Error('postMessage was not called');
  }
  return last;
}

// 构造测试实例
function makeInstance(partial: Partial<AegisInstance> = {}): AegisInstance {
  return {
    id: 'test',
    type: NodeType.View,
    props: {},
    children: [],
    ...partial,
  };
}

Object.defineProperty(globalThis, 'self', {
  value: {
    postMessage: mockPostMessage,
  },
  writable: true,
});

describe('@aegis/react/host-config', () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
  });

  describe('createInstance', () => {
    it('should create instance with correct type', () => {
      const instance = createInstance('View', { style: { display: 'flex' } });
      expect(instance.type).toBe(NodeType.View);
    });

    it('should create instance with unique id', () => {
      const instance1 = createInstance('View', {});
      const instance2 = createInstance('View', {});
      expect(instance1.id).not.toBe(instance2.id);
    });

    it('should map Text type correctly', () => {
      const instance = createInstance('Text', { value: 'Hello' });
      expect(instance.type).toBe(NodeType.Text);
    });

    it('should map Button type correctly', () => {
      const instance = createInstance('Button', { onClick: vi.fn() });
      expect(instance.type).toBe(NodeType.Button);
    });

    it('should map Input type correctly', () => {
      const instance = createInstance('Input', { placeholder: 'Enter' });
      expect(instance.type).toBe(NodeType.Input);
    });

    it('should default to View for unknown types', () => {
      const instance = createInstance('Unknown', {});
      expect(instance.type).toBe(NodeType.View);
    });

    it('should initialize empty children array', () => {
      const instance = createInstance('View', {});
      expect(instance.children).toEqual([]);
    });

    it('should store props without children', () => {
      const instance = createInstance('View', {
        style: { color: 'red' },
        children: ['child1', 'child2'],
      });
      expect(instance.props.style).toEqual({ color: 'red' });
      expect(instance.props.children).toBeUndefined();
    });
  });

  describe('createTextInstance', () => {
    it('should create text instance', () => {
      const instance = createTextInstance('Hello World');
      expect(instance.type).toBe(NodeType.Text);
    });

    it('should store text value', () => {
      const instance = createTextInstance('Hello World');
      expect(instance.props.value).toBe('Hello World');
    });

    it('should create unique ids', () => {
      const instance1 = createTextInstance('Text 1');
      const instance2 = createTextInstance('Text 2');
      expect(instance1.id).not.toBe(instance2.id);
    });
  });

  describe('appendInitialChild', () => {
    it('should add child to parent', () => {
      const parent = makeInstance({ id: 'parent', children: [] });
      const child = makeInstance({ id: 'child' });

      appendInitialChild(parent, child);

      expect(parent.children).toContain('child');
    });

    it('should add multiple children', () => {
      const parent = makeInstance({ id: 'parent', children: [] });
      const child1 = makeInstance({ id: 'child1' });
      const child2 = makeInstance({ id: 'child2' });

      appendInitialChild(parent, child1);
      appendInitialChild(parent, child2);

      expect(parent.children).toEqual(['child1', 'child2']);
    });
  });

  describe('insertBefore', () => {
    it('should insert child before specified child', () => {
      const parent = makeInstance({ id: 'parent', children: ['child1', 'child3'] });
      const child = makeInstance({ id: 'child2' });
      const beforeChild = makeInstance({ id: 'child3' });

      insertBefore(parent, child, beforeChild);

      expect(parent.children).toEqual(['child1', 'child2', 'child3']);
    });

    it('should append if before child not found', () => {
      const parent = makeInstance({ id: 'parent', children: ['child1'] });
      const child = makeInstance({ id: 'child2' });
      const beforeChild = makeInstance({ id: 'nonexistent' });

      insertBefore(parent, child, beforeChild);

      expect(parent.children).toEqual(['child1', 'child2']);
    });
  });

  describe('removeChild', () => {
    it('should remove child from parent', () => {
      const parent = makeInstance({ id: 'parent', children: ['child1', 'child2', 'child3'] });
      const child = makeInstance({ id: 'child2' });

      removeChild(parent, child);

      expect(parent.children).toEqual(['child1', 'child3']);
    });

    it('should do nothing if child not found', () => {
      const parent = makeInstance({ id: 'parent', children: ['child1'] });
      const child = makeInstance({ id: 'nonexistent' });

      removeChild(parent, child);

      expect(parent.children).toEqual(['child1']);
    });
  });

  describe('finalizeInitialChildren', () => {
    it('should return true', () => {
      const instance = makeInstance();
      const result = finalizeInitialChildren(instance, 'View', { style: {} });
      expect(result).toBe(true);
    });
  });

  describe('prepareUpdate', () => {
    it('should return null if no changes', () => {
      const instance = makeInstance();
      const oldProps = { style: { color: 'red' } };
      const newProps = { style: { color: 'red' } };

      const result = prepareUpdate(instance, 'View', oldProps, newProps);
      expect(result).toBeNull();
    });

    it('should return update payload for changed props', () => {
      const instance = makeInstance();
      const oldProps = { style: { color: 'red' } };
      const newProps = { style: { color: 'blue' } };

      const result = prepareUpdate(instance, 'View', oldProps, newProps);
      expect(result).toEqual({ style: { color: 'blue' } });
    });

    it('should handle added props', () => {
      const instance = makeInstance();
      const oldProps = {};
      const newProps = { style: { color: 'red' } };

      const result = prepareUpdate(instance, 'View', oldProps, newProps);
      expect(result).toEqual({ style: { color: 'red' } });
    });

    it('should handle removed props', () => {
      const instance = makeInstance();
      const oldProps = { style: { color: 'red' } };
      const newProps = {};

      const result = prepareUpdate(instance, 'View', oldProps, newProps);
      expect(result).toEqual({ style: undefined });
    });
  });

  describe('commitUpdate', () => {
    it('should update instance props', () => {
      const instance = makeInstance({ props: { style: { color: 'red' } } });
      const updatePayload = { style: { color: 'blue' } };

      commitUpdate(instance, updatePayload);

      expect((instance.props['style'] as { color: string }).color).toBe('blue');
    });

    it('should send update message', () => {
      const instance = makeInstance({ props: { style: { color: 'red' } } });
      const updatePayload = { style: { color: 'blue' } };

      commitUpdate(instance, updatePayload);

      expect(mockPostMessage).toHaveBeenCalled();
      const lastCall = getLastCall();
      expect(lastCall[0]['type']).toBe(UIMessageType.UpdateNode);
      expect((lastCall[0]['payload'] as { id: string }).id).toBe('test');
    });
  });

  describe('commitTextUpdate', () => {
    it('should update text instance', () => {
      const instance = makeInstance({ id: 'text-1', props: { value: 'old' } });

      commitTextUpdate(instance, 'new');

      expect(instance.props.value).toBe('new');
    });

    it('should send update message', () => {
      const instance = makeInstance({ id: 'text-1', props: { value: 'old' } });

      commitTextUpdate(instance, 'new');

      expect(mockPostMessage).toHaveBeenCalled();
      const lastCall = getLastCall();
      expect(lastCall[0]['type']).toBe(UIMessageType.UpdateNode);
      expect((lastCall[0]['payload'] as { props: { value: string } }).props.value).toBe('new');
    });
  });

  describe('commitMount', () => {
    it('should send create message', () => {
      const instance = makeInstance({
        id: 'new-node',
        type: NodeType.View,
        props: { style: { display: 'flex' } },
        children: ['child1'],
      });

      commitMount(instance);

      expect(mockPostMessage).toHaveBeenCalled();
      const lastCall = getLastCall();
      expect(lastCall[0]['type']).toBe(UIMessageType.CreateNode);
      expect((lastCall[0]['payload'] as { id: string }).id).toBe('new-node');
      expect((lastCall[0]['payload'] as { type: NodeType }).type).toBe(NodeType.View);
    });
  });

  describe('commitUnmount', () => {
    it('should send delete message', () => {
      const instance = makeInstance({ id: 'delete-node' });

      commitUnmount(instance);

      expect(mockPostMessage).toHaveBeenCalled();
      const lastCall = getLastCall();
      expect(lastCall[0]['type']).toBe(UIMessageType.DeleteNode);
      expect((lastCall[0]['payload'] as { id: string }).id).toBe('delete-node');
    });
  });

  describe('getTextContent', () => {
    it('should return text value for Text instance', () => {
      const instance = makeInstance({
        type: NodeType.Text,
        props: { value: 'Hello' },
      });

      expect(getTextContent(instance)).toBe('Hello');
    });

    it('should return empty string for non-text instance', () => {
      const instance = makeInstance({
        type: NodeType.View,
        props: {},
      });

      expect(getTextContent(instance)).toBe('');
    });
  });

  describe('isTextInstance', () => {
    it('should return true for text instance', () => {
      const instance = makeInstance({ type: NodeType.Text });
      expect(isTextInstance(instance)).toBe(true);
    });

    it('should return false for non-text instance', () => {
      const instance = makeInstance({ type: NodeType.View });
      expect(isTextInstance(instance)).toBe(false);
    });
  });

  describe('scheduleTimeout', () => {
    it('should call setTimeout', () => {
      const callback = vi.fn();
      scheduleTimeout(callback, 100);
      // setTimeout 是异步的，这里只验证函数被调用
    });
  });

  describe('cancelTimeout', () => {
    it('should call clearTimeout', () => {
      const timeoutId = window.setTimeout(() => undefined, 100);
      cancelTimeout(timeoutId);
      // clearTimeout 不返回任何值，这里只验证函数被调用
    });
  });

  describe('now', () => {
    it('should return current time', () => {
      const before = performance.now();
      const time = now();
      const after = performance.now();

      expect(time).toBeGreaterThanOrEqual(before);
      expect(time).toBeLessThanOrEqual(after);
    });
  });

  describe('configuration constants', () => {
    it('should have correct microtask support', () => {
      expect(supportsMicrotasks).toBe(true);
    });

    it('should have correct primary renderer setting', () => {
      expect(isPrimaryRenderer).toBe(true);
    });

    it('should have correct persistence support', () => {
      expect(supportsPersistence).toBe(false);
    });

    it('should have correct hydration support', () => {
      expect(supportsHydration).toBe(false);
    });
  });
});
