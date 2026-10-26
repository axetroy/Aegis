/**
 * @aegis/container - 上下文注入器
 *
 * 在 Worker 中注入内部通道，替代被拦截的全局对象
 */

import type { ContainerConfig } from './types.js';

// 内部通道消息类型
export interface InternalMessage {
  type: string;
  payload?: unknown;
  id?: string;
}

// Protocol 通道接口
export interface AegisProtocolChannel {
  sendMessage(type: string, payload?: unknown): void;
  onMessage(handler: (message: InternalMessage) => void): () => void;
}

// Capability 通道接口
export interface AegisCapabilityChannel {
  request(capability: string, options?: unknown): Promise<unknown>;
  onGrant(handler: (capability: string, grant: unknown) => void): () => void;
  onDeny(handler: (capability: string, reason: string) => void): () => void;
}

// Resource 追踪接口
export interface AegisResourceTracker {
  trackMemory(bytes: number): void;
  trackUINodes(count: number): void;
  trackMessage(type: string): void;
  getUsage(): { memory: number; uiNodes: number; messages: number };
  checkLimits(limits: { maxMemory: number; maxUINodes: number; maxMessagesPerSecond: number }): boolean;
}

// 注入的上下文
export interface AegisContext {
  __aegis_protocol: AegisProtocolChannel;
  __aegis_capability: AegisCapabilityChannel;
  __aegis_resource: AegisResourceTracker;
}

/**
 * 创建上下文注入器
 *
 * 生成注入到 Worker 中的内部通道代码
 */
export function createContextInjector(config: ContainerConfig): {
  /** 生成注入到 Worker 的代码 */
  generateInjectionCode(): string;
  /** 在主线程创建消息处理器 */
  createMessageHandler(worker: Worker): {
    sendToWorker(type: string, payload?: unknown): void;
    onMessageFromWorker(handler: (message: InternalMessage) => void): () => void;
    destroy(): void;
  };
} {
  const { appId } = config;

  const generateInjectionCode = (): string => {
    // 返回注入到 Worker 中的代码
    // 这些代码会在 Worker 启动时执行
    return `
      // === Aegis Context Injection ===
      // App ID: ${appId}
      
      // 拦截原始通信
      const _originalPostMessage = self.postMessage;
      const _originalClose = self.close;
      
      // 阻止直接通信
      self.postMessage = function(msg) {
        // 捕获但不发送
        console.warn('[Aegis] Direct postMessage intercepted:', msg);
      };
      self.close = function() {
        console.warn('[Aegis] Worker.close() intercepted');
      };
      
      // 内部消息队列
      const _aegisMessageQueue = [];
      const _aegisMessageHandlers = new Map();
      
      // Protocol 通道
      self.__aegis_protocol = {
        sendMessage(type, payload) {
          _aegisMessageQueue.push({ type, payload, id: Date.now().toString(36) });
          _originalPostMessage.call(self, {
            type: '__aegis_protocol',
            payload: { type, payload }
          });
        },
        onMessage(handler) {
          const id = Math.random().toString(36).slice(2);
          _aegisMessageHandlers.set(id, handler);
          return () => _aegisMessageHandlers.delete(id);
        }
      };
      
      // Capability 通道
      const _capabilityGrants = new Map();
      const _capabilityHandlers = new Map();
      
      self.__aegis_capability = {
        async request(capability, options) {
          return new Promise((resolve, reject) => {
            const requestId = Date.now().toString(36);
            _capabilityHandlers.set(requestId, { resolve, reject });
            _originalPostMessage.call(self, {
              type: '__aegis_capability_request',
              payload: { capability, options, requestId }
            });
          });
        },
        onGrant(handler) {
          const id = Math.random().toString(36).slice(2);
          _capabilityGrants.set(id, handler);
          return () => _capabilityGrants.delete(id);
        },
        onDeny(handler) {
          const id = Math.random().toString(36).slice(2);
          _capabilityGrants.set(id, handler);
          return () => _capabilityGrants.delete(id);
        }
      };
      
      // Resource 追踪
      let _memoryUsage = 0;
      let _uiNodeCount = 0;
      let _messageCount = 0;
      
      self.__aegis_resource = {
        trackMemory(bytes) { _memoryUsage += bytes; },
        trackUINodes(count) { _uiNodeCount += count; },
        trackMessage(type) { _messageCount++; },
        getUsage() {
          return { memory: _memoryUsage, uiNodes: _uiNodeCount, messages: _messageCount };
        },
        checkLimits(limits) {
          return _memoryUsage <= limits.maxMemory && 
                 _uiNodeCount <= limits.maxUINodes;
        }
      };
      
      // 监听主线程消息
      self.onmessage = function(event) {
        const msg = event.data;
        if (msg && msg.type === '__aegis_capability_response') {
          const handler = _capabilityHandlers.get(msg.payload.requestId);
          if (handler) {
            if (msg.payload.granted) {
              handler.resolve(msg.payload.grant);
            } else {
              handler.reject(new Error(msg.payload.reason));
            }
            _capabilityHandlers.delete(msg.payload.requestId);
          }
        }
        // 转发给注册的处理器
        for (const handler of _aegisMessageHandlers.values()) {
          handler(msg);
        }
      };
    `;
  };

  const createMessageHandler = (worker: Worker) => {
    const messageHandlers: Set<(message: InternalMessage) => void> = new Set();

    const sendToWorker = (type: string, payload?: unknown): void => {
      worker.postMessage({ type, payload });
    };

    const onMessageFromWorker = (handler: (message: InternalMessage) => void): (() => void) => {
      messageHandlers.add(handler);
      return () => messageHandlers.delete(handler);
    };

    const handleWorkerMessage = (event: MessageEvent): void => {
      const message = event.data as InternalMessage;
      for (const handler of messageHandlers) {
        handler(message);
      }
    };

    const handleWorkerError = (event: ErrorEvent): void => {
      const message: InternalMessage = {
        type: '__aegis_error',
        payload: { message: event.message || 'Worker execution failed' },
      };
      for (const handler of messageHandlers) handler(message);
    };

    const handleWorkerMessageError = (): void => {
      const message: InternalMessage = {
        type: '__aegis_error',
        payload: { message: 'Worker message could not be deserialized' },
      };
      for (const handler of messageHandlers) handler(message);
    };

    worker.addEventListener('message', handleWorkerMessage);
    worker.addEventListener('error', handleWorkerError);
    worker.addEventListener('messageerror', handleWorkerMessageError);

    const destroy = (): void => {
      worker.removeEventListener('message', handleWorkerMessage);
      worker.removeEventListener('error', handleWorkerError);
      worker.removeEventListener('messageerror', handleWorkerMessageError);
      messageHandlers.clear();
    };

    return { sendToWorker, onMessageFromWorker, destroy };
  };

  return { generateInjectionCode, createMessageHandler };
}
