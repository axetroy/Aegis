/**
 * Aegis Capability Protocol
 *
 * 定义能力请求与响应的通信协议
 */

// 能力名称
export enum CapabilityName {
  Storage = 'storage',
  Network = 'network',
  Camera = 'camera',
  Location = 'location',
  Clipboard = 'clipboard',
  Notifications = 'notifications',
}

// 权限决策
export enum PermissionDecision {
  Allow = 'allow',
  Deny = 'deny',
  Prompt = 'prompt',
}

// 能力请求消息类型
export enum CapabilityMessageType {
  Request = 'capability:request',
  Grant = 'capability:grant',
  Deny = 'capability:deny',
  Revoke = 'capability:revoke',
  Status = 'capability:status',
  RequestUI = 'capability:request-ui',
  ResponseUI = 'capability:response-ui',
}

// 能力请求
export interface CapabilityRequest {
  type: CapabilityMessageType.Request;
  payload: {
    appId: string;
    capability: CapabilityName;
    options?: Record<string, unknown>;
  };
}

// 能力授权
export interface CapabilityGrant {
  type: CapabilityMessageType.Grant;
  payload: {
    appId: string;
    capability: CapabilityName;
    policy?: Record<string, unknown>;
  };
}

// 能力拒绝
export interface CapabilityDeny {
  type: CapabilityMessageType.Deny;
  payload: {
    appId: string;
    capability: CapabilityName;
    reason: string;
  };
}

// 能力撤销
export interface CapabilityRevoke {
  type: CapabilityMessageType.Revoke;
  payload: {
    appId: string;
    capability: CapabilityName;
  };
}

// 能力状态查询
export interface CapabilityStatusRequest {
  type: CapabilityMessageType.Status;
  payload: {
    appId: string;
    capability: CapabilityName;
  };
}

// 能力状态响应
export interface CapabilityStatusResponse {
  type: CapabilityMessageType.Status;
  payload: {
    appId: string;
    capability: CapabilityName;
    decision: PermissionDecision;
    policy?: Record<string, unknown>;
  };
}

// 能力 UI 请求（弹出授权对话框）
export interface CapabilityRequestUI {
  type: CapabilityMessageType.RequestUI;
  payload: {
    requestId: string;
    appId: string;
    capability: CapabilityName;
    description: string;
    policy?: Record<string, unknown>;
  };
}

// 用户授权响应
export interface CapabilityResponseUI {
  type: CapabilityMessageType.ResponseUI;
  payload: {
    requestId: string;
    decision: PermissionDecision;
  };
}

// 能力消息联合类型
export type CapabilityMessage =
  | CapabilityRequest
  | CapabilityGrant
  | CapabilityDeny
  | CapabilityRevoke
  | CapabilityStatusRequest
  | CapabilityStatusResponse
  | CapabilityRequestUI
  | CapabilityResponseUI;

// 能力策略配置
export interface CapabilityPolicy {
  storage?: {
    quota?: string;
    namespace?: string;
  };
  network?: {
    allow?: string[];
    deny?: string[];
  };
  camera?: {
    mode?: 'user' | 'environment';
  };
  location?: {
    accuracy?: 'high' | 'low';
  };
}

// 应用清单
export interface AppManifest {
  name: string;
  version: string;
  permissions: CapabilityName[];
  policies?: CapabilityPolicy;
}
