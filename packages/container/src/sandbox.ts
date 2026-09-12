/**
 * @aegis/container - 沙箱化全局对象
 *
 * 在 Worker 中替换全局对象，阻止应用直接访问底层 API
 */

// 沙箱化配置
export interface SandboxConfig {
  /** 是否拦截 postMessage */
  interceptPostMessage: boolean;
  /** 是否拦截 close/terminate */
  interceptClose: boolean;
  /** 是否拦截 fetch/XMLHttpRequest */
  interceptNetwork: boolean;
  /** 是否拦截 localStorage/sessionStorage */
  interceptStorage: boolean;
}

const DEFAULT_SANDBOX_CONFIG: SandboxConfig = {
  interceptPostMessage: true,
  interceptClose: true,
  interceptNetwork: false, // 由 capability 系统控制
  interceptStorage: false, // 由 capability 系统控制
};

/**
 * 获取当前全局上下文（兼容 Worker / 浏览器 / jsdom）
 */
function getGlobal(): typeof self {
  return globalThis as unknown as typeof self;
}

/**
 * 沙箱化 Worker 全局对象
 *
 * 替换 self.postMessage 和 self.close，阻止应用直接通信
 */
export function createSandbox(config: Partial<SandboxConfig> = {}): {
  restore: () => void;
  interceptedMessages: Array<{ type: string; payload?: unknown }>;
} {
  const ctx = getGlobal();
  const cfg = { ...DEFAULT_SANDBOX_CONFIG, ...config };
  const interceptedMessages: Array<{ type: string; payload?: unknown }> = [];

  // 保存原始引用（延迟获取，避免模块加载时 self 不存在）
  const originalPostMessage = ctx.postMessage;
  const originalClose = ctx.close;

  // 拦截 postMessage
  if (cfg.interceptPostMessage && ctx.postMessage) {
    ctx.postMessage = ((message: unknown, ...args: unknown[]) => {
      // 捕获消息而不是发送
      if (message && typeof message === 'object' && 'type' in message) {
        interceptedMessages.push(message as { type: string; payload?: unknown });
      }
      // 不调用原始 postMessage，阻止应用直接通信
    }) as typeof ctx.postMessage;
  }

  // 拦截 close
  if (cfg.interceptClose && ctx.close) {
    ctx.close = (() => {
      // 阻止应用关闭 Worker
      console.warn('[Aegis Sandbox] Worker.close() intercepted and blocked');
    }) as typeof ctx.close;
  }

  // 恢复函数
  const restore = (): void => {
    if (originalPostMessage && ctx.postMessage) ctx.postMessage = originalPostMessage;
    if (originalClose && ctx.close) ctx.close = originalClose;
  };

  return { restore, interceptedMessages };
}

/**
 * 获取被拦截的消息列表
 */
export function getInterceptedMessages(
  sandbox: { interceptedMessages: Array<{ type: string; payload?: unknown }> }
): Array<{ type: string; payload?: unknown }> {
  return [...sandbox.interceptedMessages];
}

/**
 * 清空被拦截的消息列表
 */
export function clearInterceptedMessages(
  sandbox: { interceptedMessages: Array<{ type: string; payload?: unknown }> }
): void {
  sandbox.interceptedMessages.length = 0;
}
