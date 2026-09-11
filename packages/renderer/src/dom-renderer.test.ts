/**
 * @aegis/renderer DOM Renderer 单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AegisDOMRenderer, createRenderer, type RendererConfig } from './dom-renderer';
import { NodeType, UIMessageType, generateId } from '@aegis/protocol';

// Mock postMessage
const mockPostMessage = vi.fn();
Object.defineProperty(globalThis, 'self', {
  value: {
    postMessage: mockPostMessage,
  },
  writable: true,
});

describe('@aegis/renderer/dom-renderer', () => {
  let container: HTMLDivElement;
  let renderer: AegisDOMRenderer;

  beforeEach(() => {
    // 创建测试容器
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    // 清空 mock
    mockPostMessage.mockClear();

    // 创建渲染器
    const config: RendererConfig = {
      container,
      appId: 'test-app',
    };
    renderer = createRenderer(config);
  });

  afterEach(() => {
    // 清理
    renderer.destroy();
    document.body.removeChild(container);
  });

  describe('createRenderer', () => {
    it('should create a renderer instance', () => {
      expect(renderer).toBeInstanceOf(AegisDOMRenderer);
    });
  });

  describe('constructor', () => {
    it('should create root element with correct id', () => {
      const root = container.querySelector('[data-aegis-app="test-app"]');
      expect(root).toBeTruthy();
      expect(root?.id).toMatch(/aegis-root-test-app/);
    });

    it('should apply default styles to root', () => {
      const root = container.querySelector('[data-aegis-app="test-app"]');
      expect(root?.getAttribute('style')).toContain('display: flex');
      expect(root?.getAttribute('style')).toContain('flex-direction: column');
    });
  });

  describe('destroy', () => {
    it('should remove all content from container', () => {
      renderer.destroy();
      expect(container.innerHTML).toBe('');
    });

    it('should be callable multiple times', () => {
      renderer.destroy();
      renderer.destroy();
      expect(container.innerHTML).toBe('');
    });
  });

  describe('Node Creation', () => {
    it('should create View node', () => {
      const message = {
        type: UIMessageType.CreateNode,
        id: generateId(),
        timestamp: Date.now(),
        payload: {
          id: 'view-1',
          type: NodeType.View,
          props: { style: { display: 'flex' } },
          children: [],
        },
      };

      // 模拟接收消息
      window.dispatchEvent(new MessageEvent('message', { data: message }));

      const view = container.querySelector('#view-1');
      expect(view).toBeTruthy();
      expect(view?.tagName).toBe('DIV');
    });

    it('should create Text node', () => {
      const message = {
        type: UIMessageType.CreateNode,
        id: generateId(),
        timestamp: Date.now(),
        payload: {
          id: 'text-1',
          type: NodeType.Text,
          props: { value: 'Hello World' },
          children: [],
        },
      };

      window.dispatchEvent(new MessageEvent('message', { data: message }));

      const text = container.querySelector('#text-1');
      expect(text).toBeTruthy();
      expect(text?.tagName).toBe('SPAN');
      expect(text?.textContent).toBe('Hello World');
    });

    it('should create Button node', () => {
      const message = {
        type: UIMessageType.CreateNode,
        id: generateId(),
        timestamp: Date.now(),
        payload: {
          id: 'btn-1',
          type: NodeType.Button,
          props: { children: 'Click Me', onClick: vi.fn() },
          children: [],
        },
      };

      window.dispatchEvent(new MessageEvent('message', { data: message }));

      const button = container.querySelector('#btn-1');
      expect(button).toBeTruthy();
      expect(button?.tagName).toBe('BUTTON');
      expect(button?.textContent).toBe('Click Me');
    });

    it('should create Input node', () => {
      const message = {
        type: UIMessageType.CreateNode,
        id: generateId(),
        timestamp: Date.now(),
        payload: {
          id: 'input-1',
          type: NodeType.Input,
          props: { value: 'test', placeholder: 'Enter text' },
          children: [],
        },
      };

      window.dispatchEvent(new MessageEvent('message', { data: message }));

      const input = container.querySelector('#input-1') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.tagName).toBe('INPUT');
      expect(input.value).toBe('test');
      expect(input.placeholder).toBe('Enter text');
    });

    it('should apply styles to created node', () => {
      const message = {
        type: UIMessageType.CreateNode,
        id: generateId(),
        timestamp: Date.now(),
        payload: {
          id: 'styled-view',
          type: NodeType.View,
          props: {
            style: {
              backgroundColor: 'red',
              padding: 10,
              borderRadius: 5,
            },
          },
          children: [],
        },
      };

      window.dispatchEvent(new MessageEvent('message', { data: message }));

      const view = container.querySelector('#styled-view');
      expect(view?.getAttribute('style')).toContain('background-color: red');
      expect(view?.getAttribute('style')).toContain('padding: 10px');
      expect(view?.getAttribute('style')).toContain('border-radius: 5px');
    });
  });

  describe('Node Update', () => {
    beforeEach(() => {
      // 先创建一个节点
      const createMessage = {
        type: UIMessageType.CreateNode,
        id: generateId(),
        timestamp: Date.now(),
        payload: {
          id: 'update-test',
          type: NodeType.Text,
          props: { value: 'Original' },
          children: [],
        },
      };
      window.dispatchEvent(new MessageEvent('message', { data: createMessage }));
    });

    it('should update node text content', () => {
      const updateMessage = {
        type: UIMessageType.UpdateNode,
        id: generateId(),
        timestamp: Date.now(),
        payload: {
          id: 'update-test',
          props: { value: 'Updated' },
        },
      };

      window.dispatchEvent(new MessageEvent('message', { data: updateMessage }));

      const text = container.querySelector('#update-test');
      expect(text?.textContent).toBe('Updated');
    });

    it('should update node styles', () => {
      const updateMessage = {
        type: UIMessageType.UpdateNode,
        id: generateId(),
        timestamp: Date.now(),
        payload: {
          id: 'update-test',
          props: { style: { color: 'blue' } },
        },
      };

      window.dispatchEvent(new MessageEvent('message', { data: updateMessage }));

      const text = container.querySelector('#update-test');
      expect(text?.getAttribute('style')).toContain('color: blue');
    });

    it('should send error response for non-existent node', () => {
      const updateMessage = {
        type: UIMessageType.UpdateNode,
        id: generateId(),
        timestamp: Date.now(),
        payload: {
          id: 'non-existent',
          props: { value: 'test' },
        },
      };

      window.dispatchEvent(new MessageEvent('message', { data: updateMessage }));

      // 应该发送错误消息
      expect(mockPostMessage).toHaveBeenCalled();
    });
  });

  describe('Node Deletion', () => {
    it('should delete existing node', () => {
      // 创建节点
      const createMessage = {
        type: UIMessageType.CreateNode,
        id: generateId(),
        timestamp: Date.now(),
        payload: {
          id: 'delete-test',
          type: NodeType.View,
          props: {},
          children: [],
        },
      };
      window.dispatchEvent(new MessageEvent('message', { data: createMessage }));

      // 验证节点存在
      expect(container.querySelector('#delete-test')).toBeTruthy();

      // 删除节点
      const deleteMessage = {
        type: UIMessageType.DeleteNode,
        id: generateId(),
        timestamp: Date.now(),
        payload: { id: 'delete-test' },
      };
      window.dispatchEvent(new MessageEvent('message', { data: deleteMessage }));

      // 验证节点已删除
      expect(container.querySelector('#delete-test')).toBeFalsy();
    });

    it('should send error response for non-existent node', () => {
      const deleteMessage = {
        type: UIMessageType.DeleteNode,
        id: generateId(),
        timestamp: Date.now(),
        payload: { id: 'non-existent' },
      };

      window.dispatchEvent(new MessageEvent('message', { data: deleteMessage }));

      expect(mockPostMessage).toHaveBeenCalled();
    });
  });

  describe('Tree Sync', () => {
    it('should sync complete tree', () => {
      const syncMessage = {
        type: UIMessageType.SyncTree,
        id: generateId(),
        timestamp: Date.now(),
        payload: {
          root: {
            id: 'sync-root',
            type: NodeType.View,
            props: { style: { display: 'flex' } },
            children: ['child-1', 'child-2'],
          },
          nodes: {
            'child-1': {
              id: 'child-1',
              type: NodeType.Text,
              props: { value: 'Hello' },
              children: [],
            },
            'child-2': {
              id: 'child-2',
              type: NodeType.Button,
              props: { children: 'Click' },
              children: [],
            },
          },
        },
      };

      window.dispatchEvent(new MessageEvent('message', { data: syncMessage }));

      // 验证根节点
      const root = container.querySelector('#sync-root');
      expect(root).toBeTruthy();

      // 验证子节点
      const child1 = container.querySelector('#child-1');
      expect(child1).toBeTruthy();
      expect(child1?.textContent).toBe('Hello');

      const child2 = container.querySelector('#child-2');
      expect(child2).toBeTruthy();
      expect(child2?.tagName).toBe('BUTTON');
    });

    it('should replace existing tree', () => {
      // 先创建一些节点
      const createMessage = {
        type: UIMessageType.CreateNode,
        id: generateId(),
        timestamp: Date.now(),
        payload: {
          id: 'old-node',
          type: NodeType.View,
          props: {},
          children: [],
        },
      };
      window.dispatchEvent(new MessageEvent('message', { data: createMessage }));

      // 同步新树
      const syncMessage = {
        type: UIMessageType.SyncTree,
        id: generateId(),
        timestamp: Date.now(),
        payload: {
          root: {
            id: 'new-root',
            type: NodeType.View,
            props: {},
            children: [],
          },
          nodes: {},
        },
      };
      window.dispatchEvent(new MessageEvent('message', { data: syncMessage }));

      // 旧节点应该被移除
      expect(container.querySelector('#old-node')).toBeFalsy();
      // 新根节点应该存在
      expect(container.querySelector('#new-root')).toBeTruthy();
    });
  });

  describe('Event Handling', () => {
    it('should add click event listener', () => {
      const onClick = vi.fn();

      const createMessage = {
        type: UIMessageType.CreateNode,
        id: generateId(),
        timestamp: Date.now(),
        payload: {
          id: 'click-btn',
          type: NodeType.Button,
          props: { onClick, children: 'Click' },
          children: [],
        },
      };

      window.dispatchEvent(new MessageEvent('message', { data: createMessage }));

      const button = container.querySelector('#click-btn');
      fireEvent.click(button!);

      // onClick 会被调用，然后发送事件到 Worker
      expect(mockPostMessage).toHaveBeenCalled();
    });

    it('should add input event listener', () => {
      const onChangeText = vi.fn();

      const createMessage = {
        type: UIMessageType.CreateNode,
        id: generateId(),
        timestamp: Date.now(),
        payload: {
          id: 'input-field',
          type: NodeType.Input,
          props: { onChangeText, placeholder: 'Type here' },
          children: [],
        },
      };

      window.dispatchEvent(new MessageEvent('message', { data: createMessage }));

      const input = container.querySelector('#input-field') as HTMLInputElement;
      fireEvent.input(input, { target: { value: 'test input' } });

      expect(mockPostMessage).toHaveBeenCalled();
    });
  });
});

// 需要导入 fireEvent
import { fireEvent } from '@testing-library/dom';
