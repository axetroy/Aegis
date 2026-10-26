/**
 * @aegis/react
 *
 * Aegis React Reconciler Integration & Hooks
 */
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./react-reconciler.d.ts" />

// 导出 host-config
export * from './host-config';

// React Hooks 扩展
import React from 'react';
import { UIMessageType } from '@aegis/protocol';
import ReactReconciler, { type Instance as HostConfig } from 'react-reconciler';
import * as AegisHostConfig from './host-config';
import {
  dispatchAegisEvent,
  handleNodeMethodResult,
  removeGlobalStyleSheet,
  setGlobalStyleSheet,
} from './host-config';

const reconciler = ReactReconciler(AegisHostConfig as unknown as HostConfig);

interface ProtocolMessage {
  type: string;
  payload?: unknown;
}

interface ProtocolChannel {
  onMessage(handler: (message: ProtocolMessage) => void): () => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function render(element: React.ReactElement): () => void {
  const containerInfo = { appId: 'app', children: [] as string[] };
  const container = reconciler.createContainer(
    containerInfo,
    0,
    null,
    false,
    null,
    '',
    (error: unknown) => console.error('[Aegis] Uncaught error:', error),
    (error: unknown) => console.error('[Aegis] Caught error:', error),
    (error: unknown) => console.warn('[Aegis] Recoverable error:', error),
    null,
  );
  const protocol = (self as unknown as { __aegis_protocol?: ProtocolChannel }).__aegis_protocol;
  const unsubscribe = protocol?.onMessage((message) => {
    if (message.type !== 'protocol' || !isRecord(message.payload)) return;
    if (message.payload['type'] === 'event:dispatch') {
      dispatchAegisEvent(message.payload['payload']);
    } else if (message.payload['type'] === UIMessageType.NodeMethodResult) {
      handleNodeMethodResult(message.payload['payload']);
    }
  });

  reconciler.updateContainer(element, container, null, () => undefined);

  return () => {
    unsubscribe?.();
    reconciler.updateContainer(null, container, null, () => undefined);
  };
}

export interface GlobalStyleSheetProps {
  id: string;
  children: string;
}

export function GlobalStyleSheet({ id, children }: GlobalStyleSheetProps): null {
  React.useInsertionEffect(() => {
    setGlobalStyleSheet(id, children);
    return () => removeGlobalStyleSheet(id);
  }, [id, children]);

  return null;
}

/**
 * 带副作用管理的自定义 useEffect
 * 在 Worker 环境中执行，支持能力权限检查
 */
export function useAegisEffect(
  effect: () => void | (() => void),
  dependencies?: readonly unknown[],
  capability?: string,
): void {
  // 保持最新的 effect 与 capability 引用，避免重复订阅
  const effectRef = React.useRef(effect);
  effectRef.current = effect;
  const capabilityRef = React.useRef(capability);
  capabilityRef.current = capability;

  React.useEffect(() => {
    // 若指定了能力，则执行权限检查
    if (capabilityRef.current) {
      // 在实际实现中，此处通过 CapabilityManager 检查权限
      // const allowed = await capabilityManager.requestCapability(capabilityRef.current);
      // if (!allowed) return;
    }
    const cleanup = effectRef.current();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}

/**
 * 引用管理 Hook
 * 返回逻辑节点引用而非 DOM 元素引用
 */
export function useAegisRef<T>(initialValue: T): React.RefObject<T> {
  const ref = React.useRef<T>(initialValue);
  return ref;
}

/**
 * 应用级上下文
 * 用于在组件树中共享能力状态与配置
 */
interface AegisContextType {
  appId: string;
  capabilities: Record<string, boolean>;
  permissions: Record<string, 'allow' | 'deny' | 'pending'>;
}

const AegisContext = React.createContext<AegisContextType | null>(null);

export function AegisProvider({
  appId,
  capabilities,
  permissions,
  children,
}: {
  appId: string;
  capabilities: Record<string, boolean>;
  permissions: Record<string, 'allow' | 'deny' | 'pending'>;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <AegisContext.Provider value={{ appId, capabilities, permissions }}>
      {children}
    </AegisContext.Provider>
  );
}

export function useAegisContext(): AegisContextType {
  const context = React.useContext(AegisContext);
  if (!context) {
    throw new Error('useAegisContext must be used within an AegisProvider');
  }
  return context;
}
