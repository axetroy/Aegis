/**
 * @aegis/renderer DOM Renderer 单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AegisDOMRenderer, createRenderer, type RendererConfig } from './dom-renderer';
import { sanitizeStyleSheet } from './style-sheet-policy';
import { NodeType, UIMessageType } from '@aegis/protocol';

describe('@aegis/renderer/dom-renderer', () => {
  let container: HTMLDivElement;
  let renderer: AegisDOMRenderer;

  const queryApp = <T extends Element = Element>(selector: string): T | null =>
    renderer.shadowRoot.querySelector<T>(selector);

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
    vi.unstubAllGlobals();
  });

  describe('createRenderer', () => {
    it('should create a renderer instance', () => {
      expect(renderer).toBeInstanceOf(AegisDOMRenderer);
    });
  });

  describe('constructor', () => {
    it('should create root element', () => {
      const root = queryApp('[data-aegis-app="test-app"]');
      expect(root).toBeTruthy();
      expect(root?.tagName).toBe('DIV');
    });

    it('should apply default styles to root', () => {
      const root = queryApp<HTMLElement>('[data-aegis-app="test-app"]');
      expect(root?.getAttribute('style')).toContain('display: flex');
      expect(root?.style.contain).toBe('layout paint');
      expect(root?.style.isolation).toBe('isolate');
    });

    it('should attach an isolated shadow root to the host container', () => {
      expect(container.shadowRoot).toBe(renderer.shadowRoot);
      expect(container.querySelector('[data-aegis-app="test-app"]')).toBeNull();
    });
  });

  describe('destroy', () => {
    it('should remove all content from container', () => {
      renderer.destroy();
      expect(container.innerHTML).toBe('');
    });
  });

  describe('Global styles', () => {
    it('should scope stylesheets to the app shadow root and preserve them across tree syncs', () => {
      renderer.handleMessage({
        type: UIMessageType.SetGlobalStyleSheet,
        payload: {
          styleSheetId: 'app-base',
          cssText: '@media (min-width: 400px) { .card:hover { color: red; } }',
        },
      });

      expect(
        renderer.shadowRoot.querySelector('style[data-aegis-stylesheet="app-base"]')?.textContent,
      ).toContain('.card:hover');

      renderer.handleMessage({
        type: UIMessageType.SyncTree,
        payload: {
          root: { id: 'synced-root', type: NodeType.View, props: {}, children: [] },
          nodes: {},
        },
      });

      expect(
        renderer.shadowRoot.querySelector('style[data-aegis-stylesheet="app-base"]'),
      ).toBeTruthy();

      renderer.handleMessage({
        type: UIMessageType.SetGlobalStyleSheet,
        payload: { styleSheetId: 'app-base', cssText: '.card { color: blue; }' },
      });
      expect(
        renderer.shadowRoot.querySelector('style[data-aegis-stylesheet="app-base"]')?.textContent,
      ).toContain('blue');

      renderer.handleMessage({
        type: UIMessageType.RemoveGlobalStyleSheet,
        payload: { styleSheetId: 'app-base' },
      });
      expect(
        renderer.shadowRoot.querySelector('style[data-aegis-stylesheet="app-base"]'),
      ).toBeNull();
    });

    it('should persist and remove theme variables across tree syncs', () => {
      renderer.handleMessage({
        type: UIMessageType.SetThemeVariables,
        payload: { variables: { '--brand-color': '#157f6b' } },
      });
      renderer.handleMessage({
        type: UIMessageType.SyncTree,
        payload: {
          root: { id: 'theme-root', type: NodeType.View, props: {}, children: [] },
          nodes: {},
        },
      });

      expect(
        renderer.shadowRoot
          .querySelector<HTMLElement>('[data-aegis-app]')
          ?.style.getPropertyValue('--brand-color'),
      ).toBe('#157f6b');

      renderer.handleMessage({
        type: UIMessageType.SetThemeVariables,
        payload: { variables: { '--brand-color': null } },
      });
      expect(
        renderer.shadowRoot
          .querySelector<HTMLElement>('[data-aegis-app]')
          ?.style.getPropertyValue('--brand-color'),
      ).toBe('');
    });

    it('should remove app stylesheets when the renderer is destroyed', () => {
      renderer.handleMessage({
        type: UIMessageType.SetGlobalStyleSheet,
        payload: { styleSheetId: 'app-base', cssText: '.card { color: red; }' },
      });

      renderer.destroy();

      expect(container.shadowRoot?.querySelector('style')).toBeNull();
      expect(container.shadowRoot?.querySelector('[data-aegis-app]')).toBeNull();
    });
  });

  describe('Style sheet policy', () => {
    it('should allow scoped rules and standard conditional at-rules', () => {
      expect(() =>
        sanitizeStyleSheet('@media (min-width: 400px) { .card:hover { color: red; } }'),
      ).not.toThrow();
    });

    it.each([
      '@import "https://example.com/app.css";',
      '@font-face { font-family: remote; src: url(https://example.com/font.woff2); }',
      ':host { display: none; }',
      '::slotted(*) { display: none; }',
      '.card { background-image: image-set("https://example.com/a.png" 1x); }',
      '.card { background-image: u\\72l(https://example.com/a.png); }',
      '.card { background-image: /**/ url(https://example.com/a.png); }',
    ])('should reject unsafe stylesheet input: %s', (cssText) => {
      expect(() => sanitizeStyleSheet(cssText)).toThrow();
    });
  });

  describe('Node Creation', () => {
    it('should apply arbitrary CSS properties and custom properties', () => {
      renderer.handleMessage({
        type: UIMessageType.CreateNode,
        payload: {
          id: 'styled-view',
          type: NodeType.View,
          props: {
            style: {
              letterSpacing: '0.1em',
              '--accent-color': 'rebeccapurple',
            },
          },
          children: [],
        },
      });

      const view = queryApp<HTMLElement>('#styled-view')!;
      expect(view.style.getPropertyValue('letter-spacing')).toBe('0.1em');
      expect(view.style.getPropertyValue('--accent-color')).toBe('rebeccapurple');
    });

    it('should reject CSS URL functions, including escaped function names', () => {
      renderer.handleMessage({
        type: UIMessageType.CreateNode,
        payload: {
          id: 'resource-style',
          type: NodeType.View,
          props: {
            style: {
              backgroundImage: 'url(https://example.com/image.png)',
              '--image': 'u\\72l(https://example.com/image.png)',
              maskImage: 'u\\110000rl(https://example.com/image.png)',
              listStyleImage: 'image-set("https://example.com/image.png" 1x)',
            },
          },
          children: [],
        },
      });

      const view = queryApp<HTMLElement>('#resource-style')!;
      expect(view.style.getPropertyValue('background-image')).toBe('');
      expect(view.style.getPropertyValue('--image')).toBe('');
      expect(view.style.getPropertyValue('mask-image')).toBe('');
      expect(view.style.getPropertyValue('list-style-image')).toBe('');
    });

    it('should add units only when a numeric CSS value requires them', () => {
      vi.stubGlobal('CSS', {
        supports: (property: string, value: string) =>
          property === 'opacity'
            ? /^\d+(\.\d+)?$/.test(value)
            : property === 'width' && /^\d+px$/.test(value),
      });

      renderer.handleMessage({
        type: UIMessageType.CreateNode,
        payload: {
          id: 'numeric-style',
          type: NodeType.View,
          props: { style: { width: 24, opacity: 0.5 } },
          children: [],
        },
      });

      const view = queryApp<HTMLElement>('#numeric-style')!;
      expect(view.style.getPropertyValue('width')).toBe('24px');
      expect(view.style.getPropertyValue('opacity')).toBe('0.5');
    });

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

      const view = queryApp('#view-1');
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

      const text = queryApp('#text-1');
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

      const button = queryApp('#btn-1');
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

      const input = queryApp<HTMLInputElement>('#input-1')!;
      expect(input).toBeTruthy();
      expect(input.tagName).toBe('INPUT');
      expect(input.value).toBe('test');
      expect(input.placeholder).toBe('Enter text');
    });
  });

  describe('Node Update', () => {
    it('should remove CSS properties omitted by the next style object', () => {
      renderer.handleMessage({
        type: UIMessageType.CreateNode,
        payload: {
          id: 'style-to-update',
          type: NodeType.View,
          props: { style: { letterSpacing: '0.1em', color: 'red' } },
          children: [],
        },
      });

      renderer.handleMessage({
        type: UIMessageType.UpdateNode,
        payload: {
          id: 'style-to-update',
          props: { style: { color: 'blue' } },
        },
      });

      const view = queryApp<HTMLElement>('#style-to-update')!;
      expect(view.style.getPropertyValue('letter-spacing')).toBe('');
      expect(view.style.getPropertyValue('color')).toBe('blue');
    });

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

      const text = queryApp('#text-to-update');
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

      expect(queryApp('#delete-test')).toBeTruthy();

      renderer.handleMessage({
        type: UIMessageType.DeleteNode,
        payload: { id: 'delete-test' },
      });

      expect(queryApp('#delete-test')).toBeFalsy();
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

      const root = queryApp('#sync-root');
      expect(root).toBeTruthy();

      const child1 = queryApp('#child-1');
      expect(child1).toBeTruthy();
      expect(child1?.textContent).toBe('Hello');

      const child2 = queryApp('#child-2');
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

      expect(queryApp('#old-node')).toBeFalsy();
      expect(queryApp('#new-root')).toBeTruthy();
    });
  });
});
