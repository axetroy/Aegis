/**
 * Aegis Worker Runtime
 *
 * 在 Worker 中运行的应用运行时
 */

import { UIMessageType, EventMessageType, generateId, type EventData } from '@aegis/protocol';

// 运行时配置
export interface RuntimeConfig {
  appId: string;
  sandbox?: boolean;
}

// 应用状态
export interface AppState {
  [key: string]: unknown;
}

// 事件处理器函数类型
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventHandler = (...args: any[]) => any;

// 运行时类
export class AegisWorkerRuntime {
  private config: RuntimeConfig;
  private state: AppState = {};
  private listeners: Map<string, EventHandler> = new Map();

  constructor(config: RuntimeConfig) {
    this.config = config;
    this.setupMessageHandler();
  }

  // 设置消息处理
  private setupMessageHandler(): void {
    self.onmessage = (event: MessageEvent) => {
      this.handleMessage(event.data);
    };
  }

  // 处理消息
  private handleMessage(message: { type: string; payload?: unknown }): void {
    switch (message.type) {
      case UIMessageType.NodeCreated:
      case UIMessageType.NodeUpdated:
      case UIMessageType.NodeDeleted:
        // 处理 UI 响应
        break;

      case EventMessageType.Dispatch:
        // 处理事件
        if (message.payload) {
          this.handleEvent(message.payload as EventData);
        }
        break;

      case UIMessageType.Error:
        console.error('UI Error:', message);
        break;
    }
  }

  // 处理事件
  private async handleEvent(eventData: EventData): Promise<void> {
    const { handlerId } = eventData;

    // 查找并执行处理器
    const handler = this.listeners.get(handlerId);
    if (handler) {
      try {
        await handler(eventData['data']);
        this.sendEventResult(handlerId, true);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.sendEventResult(handlerId, false, errorMessage);
      }
    }
  }

  // 发送事件结果
  private sendEventResult(handlerId: string, success: boolean, error?: string): void {
    const message = {
      type: EventMessageType.Result,
      id: generateId(),
      timestamp: Date.now(),
      payload: {
        handlerId,
        success,
        error,
      },
    };
    self.postMessage(message);
  }

  // 注册事件处理器
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(eventType: string, handler: (...args: any[]) => any): void {
    const handlerId = `${eventType}-${Date.now()}`;
    this.listeners.set(handlerId, handler);

    // 通知 Host 注册
    const message = {
      type: EventMessageType.Register,
      id: generateId(),
      timestamp: Date.now(),
      payload: {
        nodeId: '', // 会在组件挂载时设置
        eventType,
        handlerId,
      },
    };
    self.postMessage(message);
  }

  // 注销事件处理器
  off(handlerId: string): void {
    this.listeners.delete(handlerId);
  }

  // 发送 UI 更新
  sendUIUpdate(type: UIMessageType, payload: unknown): void {
    const message = {
      type,
      id: generateId(),
      timestamp: Date.now(),
      payload,
    };
    self.postMessage(message);
  }

  // 初始化应用
  init(app: () => Promise<void>): void {
    app().catch(console.error);
  }

  // 获取状态
  getState(): AppState {
    return { ...this.state };
  }

  // 设置状态
  setState(updater: Partial<AppState> | ((state: AppState) => Partial<AppState>)): void {
    const newState = typeof updater === 'function' ? updater(this.state) : updater;
    this.state = { ...this.state, ...newState };
  }
}

// 创建运行时
export function createRuntime(config: RuntimeConfig): AegisWorkerRuntime {
  return new AegisWorkerRuntime(config);
}
