import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { UIMessageType } from '@aegis/protocol';
import { Button, Form, Input, ScrollView } from '@aegis/ui';
import { createRenderer } from '@aegis/renderer';
import { render } from './index';

describe('Aegis UI renderer integration', () => {
  it('delivers input, focus, scroll, and form events to worker callbacks', async () => {
    const handlers = new Set<(message: { type: string; payload?: unknown }) => void>();
    const messages: Array<{ type: string; payload: unknown }> = [];
    const protocol = {
      sendMessage: vi.fn((type: string, payload: unknown) => messages.push({ type, payload })),
      onMessage: (handler: (message: { type: string; payload?: unknown }) => void) => {
        handlers.add(handler);
        return () => handlers.delete(handler);
      },
    };
    const workerSelf = self as unknown as { __aegis_protocol?: typeof protocol };
    const previousProtocol = workerSelf.__aegis_protocol;
    workerSelf.__aegis_protocol = protocol;

    const host = document.createElement('div');
    document.body.appendChild(host);
    const renderer = createRenderer({
      container: host,
      appId: 'ui-events',
      onEvent: (message) => {
        for (const handler of handlers) handler({ type: 'protocol', payload: message });
      },
    });
    const onChangeText = vi.fn();
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const onScroll = vi.fn();
    const onSubmit = vi.fn();
    const unmount = render(
      React.createElement(
        Form,
        { onSubmit },
        React.createElement(Input, { name: 'query', onChangeText, onFocus, onBlur }),
        React.createElement(Button, { type: 'submit' }, 'Send'),
        React.createElement(ScrollView, { onScroll }),
      ),
    );

    try {
      await new Promise((resolve) => setTimeout(resolve, 0));
      const syncTree = messages.find((message) => message.type === UIMessageType.SyncTree);
      expect(syncTree).toBeDefined();
      if (!syncTree) throw new Error('Expected a synced UI tree');
      renderer.handleMessage(syncTree as { type: string; payload: Record<string, unknown> });

      const input = renderer.shadowRoot.querySelector<HTMLInputElement>('input');
      const form = renderer.shadowRoot.querySelector<HTMLFormElement>('form');
      const submitButton = renderer.shadowRoot.querySelector<HTMLButtonElement>('button');
      const scrollView = renderer.shadowRoot.querySelector<HTMLElement>(
        'div[style*="overflow: auto"]',
      );
      expect(input).toBeTruthy();
      expect(form).toBeTruthy();
      expect(submitButton?.type).toBe('submit');
      expect(scrollView).toBeTruthy();
      if (!input || !form || !submitButton || !scrollView)
        throw new Error('Expected Aegis UI nodes');

      input.value = 'aegis';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('focus'));
      input.dispatchEvent(new Event('blur'));
      Object.defineProperties(scrollView, {
        scrollTop: { configurable: true, value: 12 },
        scrollLeft: { configurable: true, value: 3 },
        scrollHeight: { configurable: true, value: 200 },
        clientHeight: { configurable: true, value: 80 },
        clientWidth: { configurable: true, value: 120 },
      });
      scrollView.dispatchEvent(new Event('scroll'));
      submitButton.click();

      expect(onChangeText).toHaveBeenCalledWith('aegis');
      expect(onFocus).toHaveBeenCalledOnce();
      expect(onBlur).toHaveBeenCalledOnce();
      expect(onScroll).toHaveBeenCalledWith({
        scrollTop: 12,
        scrollLeft: 3,
        scrollHeight: 200,
        clientHeight: 80,
        clientWidth: 120,
      });
      expect(onSubmit).toHaveBeenCalledWith({ query: 'aegis' });
    } finally {
      unmount();
      renderer.destroy();
      host.remove();
      workerSelf.__aegis_protocol = previousProtocol;
    }
  });
});
