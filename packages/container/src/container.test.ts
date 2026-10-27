/**
 * @aegis/container - Container 测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Container, ContainerState, type ContainerConfig } from '../src/index.js';
import { rewriteSdkImports } from '../src/container.js';

// Track Worker instances created during tests
const workerInstances: MockWorker[] = [];

type MockMessageListener = (event: { data: unknown }) => void;

class MockMessagePort {
  peer?: MockMessagePort;
  listeners = new Set<(event: { data: unknown }) => void>();
  started = false;

  addEventListener(_type: string, listener: (event: { data: unknown }) => void): void {
    this.listeners.add(listener);
  }

  removeEventListener(_type: string, listener: (event: { data: unknown }) => void): void {
    this.listeners.delete(listener);
  }

  postMessage(data: unknown): void {
    queueMicrotask(() => {
      for (const listener of this.peer?.listeners ?? []) listener({ data });
    });
  }

  start(): void {
    this.started = true;
  }

  close(): void {
    this.listeners.clear();
  }
}

class MockMessageChannel {
  port1 = new MockMessagePort();
  port2 = new MockMessagePort();

  constructor() {
    this.port1.peer = this.port2;
    this.port2.peer = this.port1;
  }
}

// Mock global Worker
class MockWorker {
  private listeners = new Map<string, MockMessageListener[]>();
  port?: MockMessagePort;
  postMessage = vi.fn((_message: unknown, transfer?: Transferable[]) => {
    const port = transfer?.[0] as unknown as MockMessagePort | undefined;
    if (!port) return;
    this.port = port;
    this.port.postMessage({ type: '__aegis_ready' });
  });
  terminate = vi.fn(() => this.port?.close());

  constructor(_url?: string | URL, _opts?: WorkerOptions) {
    workerInstances.push(this);
  }

  addEventListener(type: string, listener: MockMessageListener) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    const listeners = this.listeners.get(type);
    if (listeners) listeners.push(listener);
  }

  removeEventListener(type: string, listener: MockMessageListener) {
    const list = this.listeners.get(type);
    if (list) {
      const index = list.indexOf(listener);
      if (index >= 0) {
        list.splice(index, 1);
      }
    }
  }

  simulateMessage(data: unknown) {
    this.port?.postMessage(data);
  }
}

vi.stubGlobal('Worker', MockWorker as any);
vi.stubGlobal('MessageChannel', MockMessageChannel as any);
vi.stubGlobal('URL', {
  createObjectURL: vi.fn(() => 'blob:mock'),
  revokeObjectURL: vi.fn(),
});

describe('Container', () => {
  let config: ContainerConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    workerInstances.length = 0;
    config = {
      appId: 'test-app',
      manifest: {
        name: 'Test App',
        version: '1.0.0',
        permissions: [],
      },
      entryCode: 'console.log("hello");',
    };
  });

  it('rewrites only trusted SDK module specifiers in ESM app bundles', () => {
    const source = [
      'import { render } from "@aegis/react";',
      "import { View } from '@aegis/ui';",
      'import { useState } from "react";',
      'import { jsx } from "react/jsx-runtime";',
      'const label = "react";',
    ].join('\n');

    expect(rewriteSdkImports(source, 'https://host.test/aegis-sdk/public.js')).toBe(
      [
        'import { render } from "https://host.test/aegis-sdk/public.js";',
        'import { View } from "https://host.test/aegis-sdk/public.js";',
        'import { useState } from "https://host.test/aegis-sdk/public.js";',
        'import { jsx } from "https://host.test/aegis-sdk/public.js";',
        'const label = "react";',
      ].join('\n'),
    );
  });

  it('should create container with initial state', () => {
    const container = new Container(config);

    expect(container.appId).toBe('test-app');
    expect(container.state).toBe(ContainerState.Created);
    expect(container.manifest.name).toBe('Test App');
  });

  it('should initialize container', async () => {
    const container = new Container(config);
    const originalPostMessage = globalThis.postMessage;
    const originalClose = globalThis.close;
    await container.initialize();

    expect(container.state).toBe(ContainerState.Running);
    expect(workerInstances).toHaveLength(1);
    expect(globalThis.postMessage).toBe(originalPostMessage);
    expect(globalThis.close).toBe(originalClose);
  });

  it('should throw when initializing from non-created state', async () => {
    const container = new Container(config);
    await container.initialize();

    await expect(container.initialize()).rejects.toThrow('Container cannot be initialized');
  });

  it('should post message when running', async () => {
    const container = new Container(config);
    await container.initialize();

    const received = new Promise<unknown>((resolve) => {
      workerInstances[0]?.port?.addEventListener('message', ({ data }) => resolve(data));
    });
    container.postMessage({ type: 'test' });

    await expect(received).resolves.toEqual({ type: 'test', payload: undefined });
  });

  it('should register message handler', async () => {
    const container = new Container(config);
    const handler = vi.fn();
    container.onMessage(handler);

    await container.initialize();

    // 模拟 Worker 通过私有通道发送消息
    workerInstances[0]?.simulateMessage({ type: 'test', payload: {} });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(handler).toHaveBeenCalled();
  });

  it('should destroy container', async () => {
    const container = new Container(config);
    await container.initialize();
    await container.destroy();

    expect(container.state).toBe(ContainerState.Destroyed);
    expect(workerInstances[0]?.terminate).toHaveBeenCalled();
  });

  it('should track resource usage', async () => {
    const container = new Container(config);
    const usage = container.resourceUsage;

    expect(usage.memory).toBe(0);
    expect(usage.uiNodes).toBe(0);
  });

  it('should handle state change events', async () => {
    const container = new Container(config);
    const stateHandler = vi.fn();
    container.onStateChange(stateHandler);

    await container.initialize();

    // onStateChange 收到 ContainerEvent 对象
    expect(stateHandler).toHaveBeenCalledWith(expect.objectContaining({ type: 'state-change' }));
    // 应该被调用两次：created→initializing, initializing→running
    expect(stateHandler).toHaveBeenCalledTimes(2);
  });
});
