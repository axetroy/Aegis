/**
 * @aegis/container - 容器类型定义
 */

import type { AppManifest } from '@aegis/protocol';

// ============ Container 配置 ============

export interface ContainerConfig {
  /** 应用 ID */
  appId: string;
  /** 应用清单 */
  manifest: AppManifest;
  /** 应用入口代码 */
  entryCode: string;
  /** 依赖模块代码 */
  modules?: Map<string, string>;
  /** 由宿主提供的可信 SDK ESM 入口 */
  sdkModules?: {
    publicUrl: string;
    bootstrapUrl: string;
  };
  /** 资源限制 */
  resourceLimits?: {
    maxMemory?: number;
    maxStorage?: number;
    maxUINodes?: number;
    maxMessageSize?: number;
    maxMessagesPerSecond?: number;
  };
  /** 签名信息 */
  signature?: {
    algorithm: string;
    value: string;
    certificate?: string;
  };
}

// ============ Container 状态 ============

export enum ContainerState {
  /** 已创建，尚未初始化 */
  Created = 'created',
  /** 初始化中（加载代码、注入上下文） */
  Initializing = 'initializing',
  /** 运行中 */
  Running = 'running',
  /** 已暂停 */
  Paused = 'paused',
  /** 已销毁 */
  Destroyed = 'destroyed',
  /** 错误状态 */
  Error = 'error',
}

// ============ Worker 消息 ============

export interface WorkerMessage {
  type: string;
  payload?: unknown;
  id?: string;
}

export interface WorkerResponse {
  type: string;
  payload?: unknown;
  id?: string;
  success?: boolean;
  error?: string;
}

// ============ Context 注入 ============

export interface ContextInjection {
  /** 沙箱化 postMessage */
  interceptPostMessage: boolean;
  /** 沙箱化 close */
  interceptClose: boolean;
  /** 通过私有 MessagePort 连接协议通道 */
  protocolChannel: boolean;
  /** 通过私有 MessagePort 连接能力通道 */
  capabilityChannel: boolean;
  /** 通过私有 MessagePort 连接资源追踪 */
  resourceTracking: boolean;
}

// ============ Container 事件 ============

export interface ContainerEvent {
  type: 'state-change' | 'message' | 'error' | 'resource-warning';
  appId: string;
  data?: unknown;
  timestamp: number;
}

export type ContainerEventHandler = (event: ContainerEvent) => void;

// ============ 资源使用 ============

export interface ResourceUsage {
  /** 当前内存使用（字节） */
  memory: number;
  /** 当前 UI 节点数 */
  uiNodes: number;
  /** 当前消息队列长度 */
  messageQueue: number;
  /** 当前存储使用（字节） */
  storage: number;
}

// ============ Container 接口 ============

export interface AegisContainer {
  /** 应用 ID */
  readonly appId: string;
  /** 当前状态 */
  readonly state: ContainerState;
  /** 当前资源使用 */
  readonly resourceUsage: ResourceUsage;
  /** 应用清单 */
  readonly manifest: AppManifest;

  /** 初始化容器（加载代码、注入上下文） */
  initialize(): Promise<void>;
  /** 发送消息到 Worker */
  postMessage(message: WorkerMessage): void;
  /** 注册消息监听 */
  onMessage(handler: (message: WorkerMessage) => void): () => void;
  /** 注册状态变化监听 */
  onStateChange(handler: ContainerEventHandler): () => void;
  /** 暂停容器 */
  pause(): Promise<void>;
  /** 恢复容器 */
  resume(): Promise<void>;
  /** 销毁容器 */
  destroy(): Promise<void>;
}
