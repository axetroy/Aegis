/**
 * @aegis/container - 上下文注入器
 *
 * 生成 Worker bootstrap，通过私有 MessagePort 连接内部通道
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

/**
 * 创建上下文注入器
 *
 * 生成 Worker bootstrap。协议只通过私有 MessagePort 传输，不挂到 Worker 全局对象上。
 */
export function createContextInjector(_config: ContainerConfig): {
  /** 生成隔离 Worker bootstrap 代码 */
  generateInjectionCode(): string;
  /** 在主线程创建消息处理器 */
  createMessageHandler(
    worker: Worker,
    port: MessagePort,
  ): {
    sendToWorker(type: string, payload?: unknown): void;
    onMessageFromWorker(handler: (message: InternalMessage) => void): () => void;
    ready: Promise<void>;
    destroy(): void;
  };
} {
  const generateInjectionCode = (): string => {
    return `
      self.addEventListener('message', async function initialize(event) {
        if (event.data?.type !== '__aegis_initialize' || event.ports.length !== 1) return;
        self.removeEventListener('message', initialize);
        const port = event.ports[0];
        const { entryCode, sdkModules } = event.data.payload;
        const handlers = new Set();
        const channel = {
          sendMessage(type, payload) {
            port.postMessage({ type: '__aegis_protocol', payload: { type, payload } });
          },
          onMessage(handler) {
            handlers.add(handler);
            return () => handlers.delete(handler);
          }
        };
        port.addEventListener('message', ({ data }) => {
          if (data?.type === 'protocol') {
            for (const handler of handlers) handler({ type: 'protocol', payload: data.payload });
          }
        });
        port.start();

        try {
          if (sdkModules) {
            const sdk = await import(sdkModules.bootstrapUrl);
            sdk.initializeAegisProtocol(channel);
          }
          const appUrl = URL.createObjectURL(new Blob([entryCode], { type: 'text/javascript' }));
          try {
            await import(appUrl);
          } finally {
            URL.revokeObjectURL(appUrl);
          }
          port.postMessage({ type: '__aegis_ready' });
        } catch (error) {
          port.postMessage({
            type: '__aegis_error',
            payload: { message: error instanceof Error ? error.message : String(error) }
          });
        }
      });
    `;
  };

  const createMessageHandler = (worker: Worker, port: MessagePort) => {
    const messageHandlers: Set<(message: InternalMessage) => void> = new Set();
    let resolveReady!: () => void;
    let rejectReady!: (error: Error) => void;
    const ready = new Promise<void>((resolve, reject) => {
      resolveReady = resolve;
      rejectReady = reject;
    });

    const sendToWorker = (type: string, payload?: unknown): void => {
      port.postMessage({ type, payload });
    };

    const onMessageFromWorker = (handler: (message: InternalMessage) => void): (() => void) => {
      messageHandlers.add(handler);
      return () => messageHandlers.delete(handler);
    };

    const handlePortMessage = (event: MessageEvent): void => {
      const message = event.data as InternalMessage;
      if (message.type === '__aegis_ready') {
        resolveReady();
        return;
      }
      if (message.type === '__aegis_error') {
        rejectReady(
          new Error(
            String(
              (message.payload as { message?: unknown })?.message ?? 'Worker initialization failed',
            ),
          ),
        );
      }
      for (const handler of messageHandlers) {
        handler(message);
      }
    };

    const handleWorkerError = (event: ErrorEvent): void => {
      const message: InternalMessage = {
        type: '__aegis_error',
        payload: { message: event.message || 'Worker execution failed' },
      };
      rejectReady(new Error(event.message || 'Worker execution failed'));
      for (const handler of messageHandlers) handler(message);
    };

    const handleWorkerMessageError = (): void => {
      const message: InternalMessage = {
        type: '__aegis_error',
        payload: { message: 'Worker message could not be deserialized' },
      };
      rejectReady(new Error('Worker message could not be deserialized'));
      for (const handler of messageHandlers) handler(message);
    };

    worker.addEventListener('error', handleWorkerError);
    worker.addEventListener('messageerror', handleWorkerMessageError);
    port.addEventListener('message', handlePortMessage);
    port.addEventListener('messageerror', handleWorkerMessageError);
    port.start();

    const destroy = (): void => {
      worker.removeEventListener('error', handleWorkerError);
      worker.removeEventListener('messageerror', handleWorkerMessageError);
      port.removeEventListener('message', handlePortMessage);
      port.removeEventListener('messageerror', handleWorkerMessageError);
      port.close();
      messageHandlers.clear();
    };

    return { sendToWorker, onMessageFromWorker, ready, destroy };
  };

  return { generateInjectionCode, createMessageHandler };
}
