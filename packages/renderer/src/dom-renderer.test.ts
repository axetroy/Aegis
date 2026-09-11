/**
 * @aegis/renderer DOM Renderer 单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AegisDOMRenderer, createRenderer, type RendererConfig } from './dom-renderer';
import { NodeType, UIMessageType } from '@aegis/protocol';

describe('@aegis/renderer/dom-renderer', () => {
  let container: HTMLDivElement;
  let renderer: AegisDOMRenderer;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    const config: RendererConfig = {
      container,
      appId: 'test-app',
    };
    renderer = createRenderer(config);
  });

  afterEach(() => {
    renderer.destroy();
    document.body.removeChild(container);
  });

  describe('createRenderer', () => {
    it('should create a renderer instance', () => {
      expect(renderer).toBeInstanceOf(AegisDOMRenderer);
    });
  });

  describe('constructor', () => {
    it('should create root element', () => {
      const root = container.querySelector('[data-aegis-app="test-app"]');
      expect(root).toBeTruthy();
      expect(root?.tagName).toBe('DIV');
    });

    it('should apply default styles to root', () => {
      const root = container.querySelector('[data-aegis-app="test-app"]');
      expect(root?.getAttribute('style')).toContain('display: flex');
    });
  });

  describe('destroy', () => {
    it('should remove all content from container', () => {
      renderer.destroy();
      expect(container.innerHTML).toBe('');
    });
  });

  describe('Node Creation', () => {
    it('should create View node', () => {
      renderer.handleMessage({
        type: UIMessageType.CreateNode,
        payload: {
          id: 'view-1',
          type: NodeType.View,
          props: { style: { display: 'flex' } },
          children: [],
        },
      });

      const view = container.querySelector('#view-1');
      expect(view).toBeTruthy();
      expect(view?.tagName).toBe('DIV');
    });

    it('should create Text node', () => {
      renderer.handleMessage({
        type: UIMessageType.CreateNode,
        payload: {
          id: 'text-1',
          type: NodeType.Text,
          props: { value: 'Hello World' },
          children: [],
        },
      });

      const text = container.querySelector('#text-1');
      expect(text).toBeTruthy();
      expect(text?.tagName).toBe('SPAN');
      expect(text?.textContent).toBe('Hello World');
    });

    it('should create Button node', () => {
      renderer.handleMessage({
        type: UIMessageType.CreateNode,
        payload: {
          id: 'btn-1',
          type: NodeType.Button,
          props: { children: 'Click Me' },
          children: [],
        },
      });

      const button = container.querySelector('#btn-1');
      expect(button).toBeTruthy();
      expect(button?.tagName).toBe('BUTTON');
      expect(button?.textContent).toBe('Click Me');
    });

    it('should create Input node', () => {
      renderer.handleMessage({
        type: UIMessageType.CreateNode,
        payload: {
          id: 'input-1',
          type: NodeType.Input,
          props: { value: 'test', placeholder: 'Enter text' },
          children: [],
        },
      });

      const input = container.querySelector('#input-1') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.tagName).toBe('INPUT');
      expect(input.value).toBe('test');
      expect(input.placeholder).toBe('Enter text');
    });
  });

  describe('Node Update', () => {
    it('should update node text content', () => {
      renderer.handleMessage({
        type: UIMessageType.CreateNode,
        payload: {
          id: 'text-to-update',
          type: NodeType.Text,
          props: { value: 'Original' },
          children: [],
        },
      });

      renderer.handleMessage({
        type: UIMessageType.UpdateNode,
        payload: {
          id: 'text-to-update',
          props: { value: 'Updated' },
        },
      });

      const text = container.querySelector('#text-to-update');
      expect(text?.textContent).toBe('Updated');
    });
  });

  describe('Node Deletion', () => {
    it('should delete existing node', () => {
      renderer.handleMessage({
        type: UIMessageType.CreateNode,
        payload: {
          id: 'delete-test',
          type: NodeType.View,
          props: {},
          children: [],
        },
      });

      expect(container.querySelector('#delete-test')).toBeTruthy();

      renderer.handleMessage({
        type: UIMessageType.DeleteNode,
        payload: { id: 'delete-test' },
      });

      expect(container.querySelector('#delete-test')).toBeFalsy();
    });
  });

  describe('Tree Sync', () => {
    it('should sync complete tree', () => {
      renderer.handleMessage({
        type: UIMessageType.SyncTree,
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
      });

      const root = container.querySelector('#sync-root');
      expect(root).toBeTruthy();

      const child1 = container.querySelector('#child-1');
      expect(child1).toBeTruthy();
      expect(child1?.textContent).toBe('Hello');

      const child2 = container.querySelector('#child-2');
      expect(child2).toBeTruthy();
      expect(child2?.tagName).toBe('BUTTON');
    });

    it('should replace existing tree', () => {
      renderer.handleMessage({
        type: UIMessageType.CreateNode,
        payload: {
          id: 'old-node',
          type: NodeType.View,
          props: {},
          children: [],
        },
      });

      renderer.handleMessage({
        type: UIMessageType.SyncTree,
        payload: {
          root: {
            id: 'new-root',
            type: NodeType.View,
            props: {},
            children: [],
          },
          nodes: {},
        },
      });

      expect(container.querySelector('#old-node')).toBeFalsy();
      expect(container.querySelector('#new-root')).toBeTruthy();
    });
  });
});
