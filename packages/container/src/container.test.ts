/**
 * @aegis/container - Container 测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Container, ContainerState } from '../src/index.js';
import type { ContainerConfig } from '../src/index.js';

// Track Worker instances created during tests
let lastWorkerInstance: any = null;

// Mock global Worker
class MockWorker {
  private listeners: Map<string, Function[]> = new Map();
  postMessage = vi.fn();
  terminate = vi.fn();

  constructor(_url?: string | URL, _opts?: WorkerOptions) {
    lastWorkerInstance = this;
  }

  addEventListener(type: string, listener: Function) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(listener);
  }

  removeEventListener(type: string, listener: Function) {
    const list = this.listeners.get(type);
    if (list) {
      const index = list.indexOf(listener);
      if (index >= 0) {
        list.splice(index, 1);
      }
    }
  }

  simulateMessage(data: unknown) {
    const list = this.listeners.get('message');
    if (list) {
      for (const listener of list) {
        listener({ data });
      }
    }
  }
}

vi.stubGlobal('Worker', MockWorker as any);
vi.stubGlobal('Blob', class {
  constructor(_parts?: BlobPart[], _options?: BlobPropertyBag) {}
} as any);
vi.stubGlobal('URL', {
  createObjectURL: vi.fn(() => 'blob:mock'),
  revokeObjectURL: vi.fn(),
});

describe('Container', () => {
  let config: ContainerConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    lastWorkerInstance = null;
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

  it('should create container with initial state', () => {
    const container = new Container(config);

    expect(container.appId).toBe('test-app');
    expect(container.state).toBe(ContainerState.Created);
    expect(container.manifest.name).toBe('Test App');
  });

  it('should initialize container', async () => {
    const container = new Container(config);
    await container.initialize();

    expect(container.state).toBe(ContainerState.Running);
    expect(lastWorkerInstance).not.toBeNull();
  });

  it('should throw when initializing from non-created state', async () => {
    const container = new Container(config);
    await container.initialize();

    await expect(container.initialize()).rejects.toThrow('Container cannot be initialized');
  });

  it('should post message when running', async () => {
    const container = new Container(config);
    await container.initialize();

    container.postMessage({ type: 'test' });

    expect(lastWorkerInstance.postMessage).toHaveBeenCalled();
  });

  it('should register message handler', async () => {
    const container = new Container(config);
    const handler = vi.fn();
    container.onMessage(handler);

    await container.initialize();

    // 模拟 Worker 发送消息
    lastWorkerInstance.simulateMessage({ type: 'test', payload: {} });

    expect(handler).toHaveBeenCalled();
  });

  it('should destroy container', async () => {
    const container = new Container(config);
    await container.initialize();
    await container.destroy();

    expect(container.state).toBe(ContainerState.Destroyed);
    expect(lastWorkerInstance.terminate).toHaveBeenCalled();
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
    expect(stateHandler).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'state-change' })
    );
    // 应该被调用两次：created→initializing, initializing→running
    expect(stateHandler).toHaveBeenCalledTimes(2);
  });
});