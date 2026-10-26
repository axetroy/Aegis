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
  Form = 'form',
  // 可扩展更多节点类型
}

// UI 节点属性
export interface NodeProps {
  id: string;
  type: NodeType;
  props: Record<string, unknown>;
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
  props?: Record<string, unknown>;
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
  SetGlobalStyleSheet = 'ui:set-global-stylesheet',
  RemoveGlobalStyleSheet = 'ui:remove-global-stylesheet',
  SetThemeVariables = 'ui:set-theme-variables',
  InvokeNodeMethod = 'ui:invoke-node-method',

  // Host -> Worker
  NodeCreated = 'ui:node-created',
  NodeUpdated = 'ui:node-updated',
  NodeDeleted = 'ui:node-deleted',
  NodeMethodResult = 'ui:node-method-result',
  Error = 'ui:error',
}

export type NodeMethod = 'measure' | 'focus' | 'blur';

export interface NodeRect {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface AegisNodeRef<T extends NodeType = NodeType> {
  readonly nodeId: string;
  readonly type: T;
  measure(): Promise<NodeRect>;
}

export interface AegisFocusableRef<
  T extends NodeType = NodeType.Input | NodeType.Button,
> extends AegisNodeRef<T> {
  focus(): Promise<void>;
  blur(): Promise<void>;
}

export type AegisViewRef = AegisNodeRef<NodeType.View>;
export type AegisTextRef = AegisNodeRef<NodeType.Text>;
export type AegisButtonRef = AegisFocusableRef<NodeType.Button>;
export type AegisInputRef = AegisFocusableRef<NodeType.Input>;
export type AegisScrollViewRef = AegisNodeRef<NodeType.ScrollView>;

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
    props: Record<string, unknown>;
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

export interface SetGlobalStyleSheetMessage extends BaseMessage {
  type: UIMessageType.SetGlobalStyleSheet;
  payload: {
    styleSheetId: string;
    cssText: string;
  };
}

export interface RemoveGlobalStyleSheetMessage extends BaseMessage {
  type: UIMessageType.RemoveGlobalStyleSheet;
  payload: {
    styleSheetId: string;
  };
}

export interface SetThemeVariablesMessage extends BaseMessage {
  type: UIMessageType.SetThemeVariables;
  payload: {
    variables: Record<string, string | number | null>;
  };
}

export interface InvokeNodeMethodMessage extends BaseMessage {
  type: UIMessageType.InvokeNodeMethod;
  payload: {
    requestId: string;
    nodeId: string;
    method: NodeMethod;
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

export interface NodeMethodResultMessage extends BaseMessage {
  type: UIMessageType.NodeMethodResult;
  payload: {
    requestId: string;
    success: boolean;
    result?: NodeRect;
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
  | SetGlobalStyleSheetMessage
  | RemoveGlobalStyleSheetMessage
  | SetThemeVariablesMessage
  | InvokeNodeMethodMessage
  | NodeCreatedMessage
  | NodeUpdatedMessage
  | NodeDeletedMessage
  | NodeMethodResultMessage
  | ErrorMessage;

// 消息创建辅助函数
export interface BaseMessagePayload {
  type: string;
  id: string;
  timestamp: number;
  payload: unknown;
}

export function createMessage<T extends BaseMessagePayload>(
  type: T['type'],
  payload: T['payload'],
): T {
  return {
    type,
    id: generateId(),
    timestamp: Date.now(),
    payload,
  } as unknown as T;
}

// 生成唯一 ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
