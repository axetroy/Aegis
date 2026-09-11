/**
 * Aegis Worker Runtime
 *
 * 在 Worker 中运行的应用运行时
 */

import { UIMessage, UIMessageType, EventMessage, EventMessageType, createMessage } from '@aegis/protocol';

// 运行时配置
export interface RuntimeConfig {
  appId: string;
  sandbox?: boolean;
}

// 应用状态
export interface AppState {
  [key: string]: any;
}

// 运行时类
export class AegisWorkerRuntime {
  private config: RuntimeConfig;
  private state: AppState = {};
  private listeners: Map<string, Function> = new Map();
  private reconciler: any = null;

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
  private handleMessage(message: UIMessage | EventMessage): void {
    switch (message.type) {
      case UIMessageType.NodeCreated:
      case UIMessageType.NodeUpdated:
      case UIMessageType.NodeDeleted:
        // 处理 UI 响应
        break;

      case EventMessageType.Dispatch:
      case EventMessageType.BatchDispatch:
        // 处理事件
        this.handleEvent(message as EventMessage);
        break;

      case UIMessageType.Error:
        console.error('UI Error:', message);
        break;
    }
  }

  // 处理事件
  private async handleEvent(message: EventMessage): Promise<void> {
    if (message.type === EventMessageType.Dispatch) {
      const { data } = message.payload;
      const handlerId = data.handlerId;

      // 查找并执行处理器
      const handler = this.listeners.get(handlerId);
      if (handler) {
        try {
          await handler(data);
          this.sendEventResult(handlerId, true);
        } catch (error) {
          this.sendEventResult(handlerId, false, error.message);
        }
      }
    }
  }

  // 发送事件结果
  private sendEventResult(handlerId: string, success: boolean, error?: string): void {
    const message = createMessage(EventMessageType.Result, {
      handlerId,
      success,
      error,
    });
    self.postMessage(message);
  }

  // 注册事件处理器
  on(eventType: string, handler: Function): void {
    const handlerId = `${eventType}-${Date.now()}`;
    this.listeners.set(handlerId, handler);

    // 通知 Host 注册
    const message = createMessage(EventMessageType.Register, {
      nodeId: '', // 会在组件挂载时设置
      eventType: eventType as any,
      handlerId,
    });
    self.postMessage(message);
  }

  // 注销事件处理器
  off(handlerId: string): void {
    this.listeners.delete(handlerId);
  }

  // 发送 UI 更新
  sendUIUpdate(type: UIMessageType, payload: any): void {
    const message = createMessage(type, payload);
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
