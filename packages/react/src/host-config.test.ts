/**
 * @aegis/react Host Config 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { Input } from '@aegis/ui';
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
  detachDeletedInstance,
  getPublicInstance,
  handleNodeMethodResult,
  setGlobalStyleSheet,
  removeGlobalStyleSheet,
  setThemeVariables,
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
import {
  NodeType,
  UIMessageType,
  type AegisInputRef,
  type AegisViewRef,
  type NodeRect,
} from '@aegis/protocol';
import { render as renderReactTree } from './index';
import { getAegisProtocolChannel, setAegisProtocolChannel } from './protocol-bridge';

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

  describe('global styles', () => {
    it('should send stylesheet updates and removals through the UI protocol', () => {
      setGlobalStyleSheet('base', '.card { color: red; }');
      expect(getLastCall()[0]['type']).toBe(UIMessageType.SetGlobalStyleSheet);
      expect(getLastCall()[0]['payload']).toEqual({
        styleSheetId: 'base',
        cssText: '.card { color: red; }',
      });

      removeGlobalStyleSheet('base');
      expect(getLastCall()[0]['type']).toBe(UIMessageType.RemoveGlobalStyleSheet);
      expect(getLastCall()[0]['payload']).toEqual({ styleSheetId: 'base' });
    });

    it('should send theme variable patches and allow removal', () => {
      setThemeVariables({ '--brand-color': '#157f6b', '--surface': null });

      expect(getLastCall()[0]['type']).toBe(UIMessageType.SetThemeVariables);
      expect(getLastCall()[0]['payload']).toEqual({
        variables: { '--brand-color': '#157f6b', '--surface': null },
      });
    });

    it('should reject invalid theme variables and excessive stylesheets', () => {
      expect(() => setThemeVariables({ color: 'red' })).toThrow('must start with --');
      expect(() => setThemeVariables({ '--image': 'url(https://example.com/a.png)' })).toThrow(
        'forbidden CSS resource',
      );
      expect(() => setGlobalStyleSheet('base', 'x'.repeat(64 * 1024 + 1))).toThrow('64 KB limit');
    });
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
    it('should return false', () => {
      const instance = makeInstance();
      const result = finalizeInitialChildren(instance, 'View', { style: {} });
      expect(result).toBe(false);
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

      commitTextUpdate(instance, 'old', 'new');

      expect(instance.props.value).toBe('new');
    });

    it('should send update message', () => {
      const instance = makeInstance({ id: 'text-1', props: { value: 'old' } });

      commitTextUpdate(instance, 'old', 'new');

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

  describe('logical refs', () => {
    it('should return a stable public handle without exposing the host instance', () => {
      const instance = createInstance('View', {});
      const handle = getPublicInstance(instance) as AegisViewRef;

      expect(handle).toBe(getPublicInstance(instance));
      expect(handle.nodeId).toBe(instance.id);
      expect(handle.type).toBe(NodeType.View);
      expect(handle).not.toHaveProperty('props');
      expect(handle).not.toHaveProperty('children');
      expect(handle).not.toHaveProperty('focus');
    });

    it('should resolve async handle calls from matching host responses', async () => {
      const instance = createInstance('Input', {});
      const handle = getPublicInstance(instance) as AegisInputRef;
      const rect: NodeRect = {
        x: 1,
        y: 2,
        width: 30,
        height: 20,
        top: 2,
        right: 31,
        bottom: 22,
        left: 1,
      };

      const result = handle.measure();
      const request = getLastCall()[0];
      expect(request['type']).toBe(UIMessageType.InvokeNodeMethod);
      expect(request['payload']).toMatchObject({ nodeId: instance.id, method: 'measure' });
      handleNodeMethodResult({
        requestId: (request['payload'] as { requestId: string }).requestId,
        success: true,
        result: rect,
      });

      await expect(result).resolves.toEqual(rect);
    });

    it('should reject pending calls when the referenced node is detached', async () => {
      const instance = createInstance('Input', {});
      const handle = getPublicInstance(instance) as AegisInputRef;
      const result = handle.focus();

      detachDeletedInstance(instance);

      await expect(result).rejects.toThrow('detached');
      await expect(handle.focus()).rejects.toThrow('detached');
    });

    it('should reject host errors and limit concurrent calls', async () => {
      const instance = createInstance('Input', {});
      const handle = getPublicInstance(instance) as AegisInputRef;
      const rejectedCall = handle.focus();
      const request = getLastCall()[0]['payload'] as { requestId: string };
      handleNodeMethodResult({
        requestId: request.requestId,
        success: false,
        error: 'Not allowed',
      });
      await expect(rejectedCall).rejects.toThrow('Not allowed');

      const pendingCalls = Array.from({ length: 128 }, () => handle.measure());
      await expect(handle.measure()).rejects.toThrow('Too many pending');
      detachDeletedInstance(instance);
      await Promise.allSettled(pendingCalls);
    });

    it('should attach React refs, resolve host calls, and clear refs on unmount', async () => {
      const handlers = new Set<(message: { type: string; payload?: unknown }) => void>();
      const expectedRect: NodeRect = {
        x: 0,
        y: 0,
        width: 100,
        height: 32,
        top: 0,
        right: 100,
        bottom: 32,
        left: 0,
      };
      const protocol = {
        sendMessage: vi.fn((type: string, payload: unknown) => {
          if (
            type !== UIMessageType.InvokeNodeMethod ||
            typeof payload !== 'object' ||
            payload === null
          )
            return;
          const requestId = (payload as { requestId: string }).requestId;
          for (const handler of handlers) {
            handler({
              type: 'protocol',
              payload: {
                type: UIMessageType.NodeMethodResult,
                payload: { requestId, success: true, result: expectedRect },
              },
            });
          }
        }),
        onMessage: (handler: (message: { type: string; payload?: unknown }) => void) => {
          handlers.add(handler);
          return () => handlers.delete(handler);
        },
      };
      const previousProtocol = getAegisProtocolChannel();
      setAegisProtocolChannel(protocol);

      const ref = React.createRef<AegisInputRef>();
      const unmount = renderReactTree(
        React.createElement(Input, {
          ref,
          placeholder: 'Search',
        }),
      );

      try {
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(ref.current?.nodeId).toBeTruthy();
        expect(ref.current?.type).toBe(NodeType.Input);
        await expect(ref.current?.measure()).resolves.toEqual(expectedRect);

        unmount();
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(ref.current).toBeNull();
      } finally {
        setAegisProtocolChannel(previousProtocol);
      }
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
