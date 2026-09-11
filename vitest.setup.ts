/**
 * Vitest 测试环境配置
 */

// 添加 jest-dom 匹配器
import '@testing-library/jest-dom';

// Mock window.postMessage（jsdom 要求 2 个参数）
const originalPostMessage = window.postMessage.bind(window);
window.postMessage = function (message: any, targetOriginOrOptions?: any) {
  // 在测试环境中转发原始调用
  if (typeof targetOriginOrOptions === 'string') {
    return originalPostMessage(message, targetOriginOrOptions);
  }
  return originalPostMessage(message, '*');
} as typeof window.postMessage;

// Mock self.postMessage（用于 Worker 环境）
Object.defineProperty(globalThis, 'self', {
  value: {
    postMessage: vi.fn(),
    onmessage: null,
  },
  writable: true,
});

// 全局测试配置
beforeEach(() => {
  vi.clearAllMocks();
});

// Mock performance.now
if (!globalThis.performance) {
  Object.defineProperty(globalThis, 'performance', {
    value: {
      now: () => Date.now(),
    },
  });
}
