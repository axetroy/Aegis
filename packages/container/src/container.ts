/**
 * @aegis/container - Container 核心类
 *
 * 管理应用的完整生命周期：创建 → 初始化 → 运行 → 暂停 → 销毁
 */

import type { AppManifest } from '@aegis/protocol';
import {
  ContainerState,
  type ContainerConfig,
  type ContainerEvent,
  type ContainerEventHandler,
  type WorkerMessage,
  type ResourceUsage,
  type AegisContainer,
} from './types.js';
import { createSandbox } from './sandbox.js';
import { createContextInjector } from './context-injector.js';

// 默认资源限制
const DEFAULT_RESOURCE_LIMITS = {
  maxMemory: 64 * 1024 * 1024, // 64MB
  maxStorage: 10 * 1024 * 1024, // 10MB
  maxUINodes: 5000,
  maxMessageSize: 1024 * 1024, // 1MB
  maxMessagesPerSecond: 1000,
};

/**
 * Aegis Container
 *
 * 为每个应用创建隔离的执行环境
 */
export class Container implements AegisContainer {
  readonly appId: string;
  readonly manifest: AppManifest;

  static async fromPackage(
    source: File | Blob | ArrayBuffer,
    options?: {
      appId?: string;
      resourceLimits?: ContainerConfig['resourceLimits'];
      signature?: ContainerConfig['signature'];
    },
  ): Promise<Container> {
    const { extractAegisPackage } = await import('@aegis/adapter/extract-aegis-package');
    const result = await extractAegisPackage(source);
    return new Container({
      appId: options?.appId || result.manifest.name || 'unknown-app',
      manifest: result.manifest,
      entryCode: result.entryCode,
      resourceLimits: options?.resourceLimits,
      signature: options?.signature,
    });
  }

  private _state: ContainerState = ContainerState.Created;
  private _worker: Worker | null = null;
  private _sandbox: ReturnType<typeof createSandbox> | null = null;
  private _messageHandler: ReturnType<ReturnType<typeof createContextInjector>['createMessageHandler']> | null = null;
  private _resourceUsage: ResourceUsage = {
    memory: 0,
    uiNodes: 0,
    messageQueue: 0,
    storage: 0,
  };
  private _resourceLimits: typeof DEFAULT_RESOURCE_LIMITS;
  private _messageHandlers: Set<(message: WorkerMessage) => void> = new Set();
  private _stateHandlers: Set<ContainerEventHandler> = new Set();
  private _config: ContainerConfig;

  constructor(config: ContainerConfig) {
    this.appId = config.appId;
    this.manifest = config.manifest;
    this._config = config;
    this._resourceLimits = {
      ...DEFAULT_RESOURCE_LIMITS,
      ...config.resourceLimits,
    };
  }

  get state(): ContainerState {
    return this._state;
  }

  get resourceUsage(): ResourceUsage {
    return { ...this._resourceUsage };
  }

  /**
   * 获取资源限制配置
   */
  getResourceLimits(): typeof DEFAULT_RESOURCE_LIMITS {
    return { ...this._resourceLimits };
  }

  /**
   * 初始化容器
   *
   * 1. 创建 Worker
   * 2. 沙箱化全局对象
   * 3. 注入上下文通道
   * 4. 加载用户代码
   */
  async initialize(): Promise<void> {
    if (this._state !== ContainerState.Created) {
      throw new Error(`Container cannot be initialized from state: ${this._state}`);
    }

    this.setState(ContainerState.Initializing);

    try {
      // 1. 创建 Worker（使用 Blob URL 实现完全隔离）
      const injectionCode = createContextInjector(this._config).generateInjectionCode();
      const workerCode = `
        ${injectionCode}
        // === 用户代码 ===
        ${this._config.entryCode}
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this._worker = new Worker(workerUrl);

      // 2. 创建沙箱
      this._sandbox = createSandbox();

      // 3. 创建消息处理器
      this._messageHandler = createContextInjector(this._config).createMessageHandler(this._worker);

      // 4. 监听 Worker 消息
      this._messageHandler.onMessageFromWorker((message) => {
        this.handleWorkerMessage(message);
      });

      // 5. 释放 Blob URL
      URL.revokeObjectURL(workerUrl);

      this.setState(ContainerState.Running);
    } catch (error) {
      this.setState(ContainerState.Error);
      throw error;
    }
  }

  /**
   * 发送消息到 Worker
   */
  postMessage(message: WorkerMessage): void {
    if (this._state !== ContainerState.Running) {
      throw new Error(`Container is not running, state: ${this._state}`);
    }

    if (!this._messageHandler) {
      throw new Error('Message handler not initialized');
    }

    // 检查消息大小限制
    const messageSize = JSON.stringify(message).length;
    const maxSize = this._resourceLimits.maxMessageSize;
    if (maxSize && messageSize > maxSize) {
      throw new Error(`Message size ${messageSize} exceeds limit ${maxSize}`);
    }

    this._resourceUsage.messageQueue++;
    this._messageHandler.sendToWorker(message.type, message.payload);
  }

  /**
   * 注册消息监听
   */
  onMessage(handler: (message: WorkerMessage) => void): () => void {
    this._messageHandlers.add(handler);
    return () => this._messageHandlers.delete(handler);
  }

  /**
   * 注册状态变化监听
   */
  onStateChange(handler: ContainerEventHandler): () => void {
    this._stateHandlers.add(handler);
    return () => this._stateHandlers.delete(handler);
  }

  /**
   * 暂停容器
   */
  async pause(): Promise<void> {
    if (this._state !== ContainerState.Running) {
      throw new Error(`Container cannot be paused from state: ${this._state}`);
    }

    // Worker 没有原生暂停方法，通过消息控制
    this.postMessage({ type: '__aegis_pause' });
    this.setState(ContainerState.Paused);
  }

  /**
   * 恢复容器
   */
  async resume(): Promise<void> {
    if (this._state !== ContainerState.Paused) {
      throw new Error(`Container cannot be resumed from state: ${this._state}`);
    }

    this.postMessage({ type: '__aegis_resume' });
    this.setState(ContainerState.Running);
  }

  /**
   * 销毁容器
   *
   * 1. 终止 Worker
   * 2. 撤销所有能力
   * 3. 清理资源
   */
  async destroy(): Promise<void> {
    if (this._state === ContainerState.Destroyed) {
      return;
    }

    // 终止 Worker
    if (this._worker) {
      this._worker.terminate();
      this._worker = null;
    }

    // 清理消息处理器
    if (this._messageHandler) {
      this._messageHandler.destroy();
      this._messageHandler = null;
    }

    // 恢复沙箱
    if (this._sandbox) {
      this._sandbox.restore();
      this._sandbox = null;
    }

    // 清理处理器
    this._messageHandlers.clear();
    this._stateHandlers.clear();

    // 重置资源使用
    this._resourceUsage = {
      memory: 0,
      uiNodes: 0,
      messageQueue: 0,
      storage: 0,
    };

    this.setState(ContainerState.Destroyed);
  }

  // ============ 私有方法 ============

  private setState(state: ContainerState): void {
    const previousState = this._state;
    this._state = state;

    const event: ContainerEvent = {
      type: 'state-change',
      appId: this.appId,
      data: { from: previousState, to: state },
      timestamp: Date.now(),
    };

    for (const handler of this._stateHandlers) {
      handler(event);
    }
  }

  private handleWorkerMessage(message: unknown): void {
    const msg = message as { type: string; payload?: unknown };

    // 处理内部消息
    if (msg.type === '__aegis_protocol') {
      // Protocol 消息转发给宿主
      for (const handler of this._messageHandlers) {
        handler({ type: 'protocol', payload: msg.payload });
      }
    } else if (msg.type === '__aegis_capability_request') {
      // 能力请求转发给宿主
      for (const handler of this._messageHandlers) {
        handler({ type: 'capability-request', payload: msg.payload });
      }
    } else {
      // 其他消息
      for (const handler of this._messageHandlers) {
        handler(msg as WorkerMessage);
      }
    }

    // 更新资源使用
    this._resourceUsage.messageQueue = Math.max(0, this._resourceUsage.messageQueue - 1);
  }
}
