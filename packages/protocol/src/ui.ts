/**
 * Aegis UI Protocol
 *
 * 定义 Worker 和 Host 之间的 UI 通信协议
 */

// 节点类型枚举
export enum NodeType {
  View = 'view',
  Text = 'text',
  Button = 'button',
  Input = 'input',
  ScrollView = 'scroll-view',
  // 可扩展更多节点类型
}

// UI 节点属性
export interface NodeProps {
  id: string;
  type: NodeType;
  props: Record<string, any>;
  children?: string[]; // 子节点 ID 列表
}

// UI 操作类型
export enum UIOperationType {
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
  Insert = 'insert',
  Move = 'move',
}

// UI 操作
export interface UIOperation {
  type: UIOperationType;
  nodeId: string;
  parentId?: string;
  index?: number;
  props?: Record<string, any>;
}

// UI 协议消息
export enum UIMessageType {
  // Worker -> Host
  CreateNode = 'ui:create-node',
  UpdateNode = 'ui:update-node',
  DeleteNode = 'ui:delete-node',
  InsertNode = 'ui:insert-node',
  MoveNode = 'ui:move-node',
  SyncTree = 'ui:sync-tree',

  // Host -> Worker
  NodeCreated = 'ui:node-created',
  NodeUpdated = 'ui:node-updated',
  NodeDeleted = 'ui:node-deleted',
  Error = 'ui:error',
}

// 基础消息
export interface BaseMessage {
  type: UIMessageType | string;
  id: string;
  timestamp: number;
}

// Worker -> Host 消息
export interface CreateNodeMessage extends BaseMessage {
  type: UIMessageType.CreateNode;
  payload: NodeProps;
}

export interface UpdateNodeMessage extends BaseMessage {
  type: UIMessageType.UpdateNode;
  payload: {
    id: string;
    props: Record<string, any>;
  };
}

export interface DeleteNodeMessage extends BaseMessage {
  type: UIMessageType.DeleteNode;
  payload: {
    id: string;
  };
}

export interface InsertNodeMessage extends BaseMessage {
  type: UIMessageType.InsertNode;
  payload: {
    parentId: string;
    node: NodeProps;
    index: number;
  };
}

export interface MoveNodeMessage extends BaseMessage {
  type: UIMessageType.MoveNode;
  payload: {
    nodeId: string;
    newParentId: string;
    index: number;
  };
}

export interface SyncTreeMessage extends BaseMessage {
  type: UIMessageType.SyncTree;
  payload: {
    root: NodeProps;
    nodes: Record<string, NodeProps>;
  };
}

// Host -> Worker 消息
export interface NodeCreatedMessage extends BaseMessage {
  type: UIMessageType.NodeCreated;
  payload: {
    id: string;
    success: boolean;
    error?: string;
  };
}

export interface NodeUpdatedMessage extends BaseMessage {
  type: UIMessageType.NodeUpdated;
  payload: {
    id: string;
    success: boolean;
    error?: string;
  };
}

export interface NodeDeletedMessage extends BaseMessage {
  type: UIMessageType.NodeDeleted;
  payload: {
    id: string;
    success: boolean;
    error?: string;
  };
}

export interface ErrorMessage extends BaseMessage {
  type: UIMessageType.Error;
  payload: {
    error: string;
    code?: string;
  };
}

// 消息联合类型
export type UIMessage =
  | CreateNodeMessage
  | UpdateNodeMessage
  | DeleteNodeMessage
  | InsertNodeMessage
  | MoveNodeMessage
  | SyncTreeMessage
  | NodeCreatedMessage
  | NodeUpdatedMessage
  | NodeDeletedMessage
  | ErrorMessage;

// 消息创建辅助函数
export function createMessage<T extends UIMessage>(
  type: T['type'],
  payload: T['payload']
): T {
  return {
    type,
    id: generateId(),
    timestamp: Date.now(),
    payload,
  } as T;
}

// 生成唯一 ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
