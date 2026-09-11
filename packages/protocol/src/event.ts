/**
 * Aegis Event Protocol
 *
 * 定义 Host 和 Worker 之间的事件通信协议
 */

// 事件类型
export enum EventType {
  // 触摸事件
  Touch = 'touch',
  TouchStart = 'touchstart',
  TouchMove = 'touchmove',
  TouchEnd = 'touchend',

  // 点击事件
  Click = 'click',

  // 输入事件
  Input = 'input',
  Change = 'change',
  Focus = 'focus',
  Blur = 'blur',

  // 生命周期事件
  Load = 'load',
  Unload = 'unload',
  Show = 'show',
  Hide = 'hide',
}

// 事件数据
export interface EventData {
  type: EventType;
  nodeId: string;
  handlerId: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

// 事件协议消息
export enum EventMessageType {
  // Host -> Worker
  Dispatch = 'event:dispatch',
  BatchDispatch = 'event:batch-dispatch',

  // Worker -> Host
  Register = 'event:register',
  Unregister = 'event:unregister',
  Result = 'event:result',
}

// 注册事件处理器
export interface RegisterEventMessage {
  type: EventMessageType.Register;
  payload: {
    nodeId: string;
    eventType: EventType;
    handlerId: string;
  };
}

// 注销事件处理器
export interface UnregisterEventMessage {
  type: EventMessageType.Unregister;
  payload: {
    nodeId: string;
    eventType: EventType;
    handlerId: string;
  };
}

// 派发事件
export interface DispatchEventMessage {
  type: EventMessageType.Dispatch;
  payload: EventData;
}

// 批量派发事件
export interface BatchDispatchEventMessage {
  type: EventMessageType.BatchDispatch;
  payload: {
    events: EventData[];
  };
}

// 事件处理结果
export interface EventResultMessage {
  type: EventMessageType.Result;
  payload: {
    handlerId: string;
    success: boolean;
    error?: string;
  };
}

// 事件消息联合类型
export type EventMessage =
  | RegisterEventMessage
  | UnregisterEventMessage
  | DispatchEventMessage
  | BatchDispatchEventMessage
  | EventResultMessage;

// 事件处理器类型
export type EventHandler = (data: EventData) => void | Promise<void>;

// 事件处理器映射
export interface EventHandlers {
  [nodeId: string]: {
    [eventType: string]: string; // handlerId
  };
}
