/**
 * Vitest 测试环境配置
 */

// 添加 jest-dom 匹配器
import '@testing-library/jest-dom';

// 全局测试配置
beforeEach(() => {
  // 清理所有 mock
  vi.clearAllMocks();
});

// Mock 全局对象
Object.defineProperty(globalThis, 'self', {
  value: {
    postMessage: vi.fn(),
    onmessage: null,
  },
  writable: true,
});

// Mock performance.now
if (!globalThis.performance) {
  Object.defineProperty(globalThis, 'performance', {
    value: {
      now: () => Date.now(),
    },
  });
}
