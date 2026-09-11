/**
 * @aegis/runtime Worker Runtime 单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AegisWorkerRuntime, createRuntime, type RuntimeConfig, type AppState } from './worker-runtime';
import { UIMessageType, EventMessageType, generateId } from '@aegis/protocol';

// Mock postMessage
const mockPostMessage = vi.fn();
Object.defineProperty(globalThis, 'self', {
  value: {
    postMessage: mockPostMessage,
    onmessage: null as ((event: MessageEvent) => void) | null,
  },
  writable: true,
});

describe('@aegis/runtime/worker-runtime', () => {
  let runtime: AegisWorkerRuntime;

  beforeEach(() => {
    mockPostMessage.mockClear();
    (self.onmessage as any) = null;

    const config: RuntimeConfig = {
      appId: 'test-app',
    };
    runtime = createRuntime(config);
  });

  describe('createRuntime', () => {
    it('should create a runtime instance', () => {
      expect(runtime).toBeInstanceOf(AegisWorkerRuntime);
    });
  });

  describe('constructor', () => {
    it('should set up message handler', () => {
      expect(self.onmessage).toBeDefined();
      expect(typeof self.onmessage).toBe('function');
    });
  });

  describe('getState', () => {
    it('should return initial empty state', () => {
      const state = runtime.getState();
      expect(state).toEqual({});
    });

    it('should return a copy of state', () => {
      const state1 = runtime.getState();
      const state2 = runtime.getState();
      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });
  });

  describe('setState', () => {
    it('should update state with object', () => {
      runtime.setState({ count: 0 });
      expect(runtime.getState()).toEqual({ count: 0 });
    });

    it('should merge state with existing state', () => {
      runtime.setState({ count: 0 });
      runtime.setState({ name: 'test' });
      expect(runtime.getState()).toEqual({ count: 0, name: 'test' });
    });

    it('should overwrite existing keys', () => {
      runtime.setState({ count: 0 });
      runtime.setState({ count: 10 });
      expect(runtime.getState()).toEqual({ count: 10 });
    });

    it('should update state with function', () => {
      runtime.setState({ count: 0 });
      runtime.setState((state) => ({ count: state.count + 1 }));
      expect(runtime.getState()).toEqual({ count: 1 });
    });

    it('should handle multiple state updates', () => {
      runtime.setState({ a: 1 });
      runtime.setState({ b: 2 });
      runtime.setState({ c: 3 });
      expect(runtime.getState()).toEqual({ a: 1, b: 2, c: 3 });
    });
  });

  describe('on (event registration)', () => {
    it('should register event handler', () => {
      const handler = vi.fn();
      runtime.on('click', handler);

      // 应该发送注册消息
      expect(mockPostMessage).toHaveBeenCalled();
      const lastCall = mockPostMessage.mock.calls[mockPostMessage.mock.calls.length - 1];
      expect(lastCall[0].type).toBe(EventMessageType.Register);
      expect(lastCall[0].payload.eventType).toBe('click');
    });

    it('should register multiple handlers', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      runtime.on('click', handler1);
      runtime.on('input', handler2);

      expect(mockPostMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe('off (event unregistration)', () => {
    it('should unregister event handler', () => {
      const handler = vi.fn();
      runtime.on('click', handler);

      // 获取 handlerId
      const registerCall = mockPostMessage.mock.calls[0][0];
      const handlerId = registerCall.payload.handlerId;

      // 注销处理器
      runtime.off(handlerId);

      // 注意：off 只是从内部映射中移除，不会发送消息
      // 这个行为可能需要根据实际需求调整
    });
  });

  describe('sendUIUpdate', () => {
    it('should send UI update message', () => {
      const payload = {
        id: 'node-1',
        props: { value: 'updated' },
      };

      runtime.sendUIUpdate(UIMessageType.UpdateNode, payload);

      expect(mockPostMessage).toHaveBeenCalled();
      const lastCall = mockPostMessage.mock.calls[mockPostMessage.mock.calls.length - 1];
      expect(lastCall[0].type).toBe(UIMessageType.UpdateNode);
      expect(lastCall[0].payload).toEqual(payload);
    });

    it('should send CreateNode message', () => {
      const payload = {
        id: 'new-node',
        type: 'view',
        props: {},
        children: [],
      };

      runtime.sendUIUpdate(UIMessageType.CreateNode, payload);

      const lastCall = mockPostMessage.mock.calls[mockPostMessage.mock.calls.length - 1];
      expect(lastCall[0].type).toBe(UIMessageType.CreateNode);
    });

    it('should send DeleteNode message', () => {
      const payload = { id: 'delete-node' };

      runtime.sendUIUpdate(UIMessageType.DeleteNode, payload);

      const lastCall = mockPostMessage.mock.calls[mockPostMessage.mock.calls.length - 1];
      expect(lastCall[0].type).toBe(UIMessageType.DeleteNode);
    });
  });

  describe('message handling', () => {
    it('should handle NodeCreated message', () => {
      const message = {
        type: UIMessageType.NodeCreated,
        id: generateId(),
        timestamp: Date.now(),
        payload: { id: 'node-1', success: true },
      };

      // 模拟接收消息
      self.onmessage!(new MessageEvent('message', { data: message }));

      // 目前只是打印日志，没有其他副作用
    });

    it('should handle Error message', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const message = {
        type: UIMessageType.Error,
        id: generateId(),
        timestamp: Date.now(),
        payload: { error: 'Test error' },
      };

      self.onmessage!(new MessageEvent('message', { data: message }));

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle Dispatch event', () => {
      const handler = vi.fn();
      runtime.on('click', handler);

      // 获取注册的 handlerId
      const registerCall = mockPostMessage.mock.calls[0][0];
      const handlerId = registerCall.payload.handlerId;

      // 模拟派发事件
      const dispatchMessage = {
        type: EventMessageType.Dispatch,
        id: generateId(),
        timestamp: Date.now(),
        payload: {
          type: 'click',
          nodeId: 'button-1',
          handlerId,
          timestamp: Date.now(),
          data: { x: 100, y: 200 },
        },
      };

      self.onmessage!(new MessageEvent('message', { data: dispatchMessage }));

      // 处理器应该被调用
      expect(handler).toHaveBeenCalled();
      expect(handler).toHaveBeenCalledWith(dispatchMessage.payload.data);
    });

    it('should handle event handler error', async () => {
      const errorHandler = vi.fn().mockRejectedValue(new Error('Handler failed'));
      runtime.on('click', errorHandler);

      const handlerId = mockPostMessage.mock.calls[0][0].payload.handlerId;

      const dispatchMessage = {
        type: EventMessageType.Dispatch,
        id: generateId(),
        timestamp: Date.now(),
        payload: {
          type: 'click',
          nodeId: 'button-1',
          handlerId,
          timestamp: Date.now(),
          data: {},
        },
      };

      self.onmessage!(new MessageEvent('message', { data: dispatchMessage }));

      // 等待异步操作
      await new Promise((resolve) => setTimeout(resolve, 10));

      // 应该发送失败结果
      const resultCalls = mockPostMessage.mock.calls.filter(
        (call) => call[0].type === EventMessageType.Result
      );
      expect(resultCalls.length).toBeGreaterThan(0);

      const lastResult = resultCalls[resultCalls.length - 1][0];
      expect(lastResult.payload.success).toBe(false);
      expect(lastResult.payload.error).toBe('Handler failed');
    });
  });

  describe('init', () => {
    it('should call the app function', async () => {
      const appFn = vi.fn().mockResolvedValue(undefined);
      runtime.init(appFn);

      // 等待异步操作
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(appFn).toHaveBeenCalled();
    });

    it('should handle app function error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const appFn = vi.fn().mockRejectedValue(new Error('App failed'));
      runtime.init(appFn);

      // 等待异步操作
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
