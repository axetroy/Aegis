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

// ============ 应用包格式（Phase 3）============

// 应用图标
export interface AppIcon {
  /** 图标名称，用于多尺寸分辨率 */
  name: string;
  /** 图标尺寸（px） */
  size: number;
  /** 图标路径（相对于包根目录） */
  path: string;
}

// 包依赖描述
export interface PackageDependency {
  /** 依赖包名称 */
  name: string;
  /** 语义化版本约束 */
  version: string;
  /** 依赖来源（URL 或本地路径） */
  source?: string;
}
// 应用清单（Phase 3 扩展）
export interface AppManifest {
  /** 应用 ID（由 packager 基于 name+version 自动生成） */
  id?: string;
  /** 应用显示名称 */
  name: string;
  /** 版本号（语义化版本） */
  version: string;
  /** 应用描述 */
  description?: string;
  /** 应用图标列表 */
  icons?: AppIcon[];
  /** 声明需要的能力 */
  permissions: CapabilityName[];
  /** 各能力的策略配置 */
  policies?: CapabilityPolicy;
  /** 包依赖声明 */
  dependencies?: PackageDependency[];
  /** 作者信息 */
  author?: string;
  /** 许可证 */
  license?: string;
  /** 构建时间戳 */
  builtAt?: string;
}

// ============ 应用包格式（Phase 3）============

// 应用图标
export interface AppIcon {
  /** 图标名称，用于多尺寸分辨率 */
  name: string;
  /** 图标尺寸（px） */
  size: number;
  /** 图标路径（相对于包根目录） */
  path: string;
}

// 包依赖描述
export interface PackageDependency {
  /** 依赖包名称 */
  name: string;
  /** 语义化版本约束 */
  version: string;
  /** 依赖来源（URL 或本地路径） */
  source?: string;
}

// Aegis 包结构（ZIP 内文件描述）
export interface AegisPackageSpec {
  /** 包格式版本（当前为 '1.0.0'） */
  formatVersion: string;
  /** 应用清单 */
  manifest: AppManifest;
  /** 主 bundle 路径（相对于包根） */
  main: string;
  /** 签名信息 */
  signature: AegisSignature;
}

// 签名算法枚举
export enum SignatureAlgorithm {
  /** Ed25519 签名算法 */
  Ed25519 = 'ed25519',
  /** RSA-PSS with SHA-256 */
  RSASSA_PSS_SHA256 = 'rsa-pss-sha256',
}

// 应用签名
export interface AegisSignature {
  /** 使用的签名算法 */
  algorithm: SignatureAlgorithm;
  /** 公钥（PEM 格式或 base64） */
  publicKey: string;
  /** 签名值（base64） */
  signature: string;
  /** 签名时的包数据 hash（SHA-256，base64） */
  dataHash: string;
  /** 签名时间戳（ISO 8601） */
  signedAt: string;
  /** 证书链 */
  certificateChain?: AegisCertificate[];
}

// 证书条目
export interface AegisCertificate {
  /** 公钥（base64 编码） */
  publicKey: string;
  /** 颁发者公钥指纹（SHA-256 of issuer's publicKey，base64） */
  issuerFingerprint: string;
  /** 证书有效期起始（ISO 8601） */
  notBefore?: string;
  /** 证书有效期截止（ISO 8601） */
  notAfter?: string;
}

// 包完整性校验结果
export interface IntegrityCheckResult {
  /** 是否通过完整性校验 */
  valid: boolean;
  /** 校验失败原因（valid 为 false 时非空） */
  error?: string;
  /** 包 hash（SHA-256，base64） */
  hash?: string;
}

// 包解析结果
export interface AegisPackage {
  /** 包规格（从 manifest.json 读取） */
  spec: AegisPackageSpec;
  /** 包内文件内容（key=文件名, value=Uint8Array） */
  files: Map<string, Uint8Array>;
  /** 包原始数据路径或 buffer */
  source: string | Uint8Array;
}
