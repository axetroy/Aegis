/**
 * @aegis/container - Sandbox 测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSandbox } from '../src/sandbox.js';

describe('Sandbox', () => {
  // 在 jsdom 中 self.postMessage / self.close 可能不存在，需要预设
  let mockPostMessage: ReturnType<typeof vi.fn>;
  let mockClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockPostMessage = vi.fn();
    mockClose = vi.fn();
    // 设置到 globalThis（sandbox 使用 globalThis）
    (globalThis as any).postMessage = mockPostMessage;
    (globalThis as any).close = mockClose;
  });

  afterEach(() => {
    delete (globalThis as any).postMessage;
    delete (globalThis as any).close;
  });

  it('should intercept postMessage', () => {
    const sandbox = createSandbox({ interceptPostMessage: true, interceptClose: false });

    // 调用被拦截的 postMessage
    (globalThis as any).postMessage({ type: 'test', payload: { data: 123 } });

    // 消息应该被拦截
    expect(sandbox.interceptedMessages).toHaveLength(1);
    expect(sandbox.interceptedMessages[0].type).toBe('test');

    // 原始 postMessage 不应该被调用
    expect(mockPostMessage).not.toHaveBeenCalled();

    sandbox.restore();
  });

  it('should intercept close', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const sandbox = createSandbox({ interceptPostMessage: false, interceptClose: true });

    (globalThis as any).close();

    expect(consoleSpy).toHaveBeenCalledWith('[Aegis Sandbox] Worker.close() intercepted and blocked');
    expect(mockClose).not.toHaveBeenCalled();
    consoleSpy.mockRestore();

    sandbox.restore();
  });

  it('should restore original functions after restore', () => {
    const sandbox = createSandbox({ interceptPostMessage: true, interceptClose: true });

    sandbox.restore();

    // 恢复后应该调用原始函数
    expect((globalThis as any).postMessage).toBe(mockPostMessage);
    expect((globalThis as any).close).toBe(mockClose);
  });

  it('should not intercept when disabled', () => {
    const sandbox = createSandbox({ interceptPostMessage: false, interceptClose: false });

    // postMessage 不应该被拦截
    (globalThis as any).postMessage({ type: 'test' });

    expect(sandbox.interceptedMessages).toHaveLength(0);
    expect(mockPostMessage).toHaveBeenCalled();

    sandbox.restore();
  });
});