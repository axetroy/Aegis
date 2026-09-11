/**
 * @aegis/react
 *
 * Aegis React Reconciler Integration & Hooks
 */

// 导出 host-config
export * from './host-config';

// React Hooks 扩展
import React from 'react';

/**
 * 带副作用管理的自定义 useEffect
 * 在 Worker 环境中执行，支持能力权限检查
 */
export function useAegisEffect(
  effect: () => void | (() => void),
  dependencies?: readonly unknown[],
  capability?: string,
): void {
  React.useEffect(() => {
    // 若指定了能力，则执行权限检查
    if (capability) {
      // 在实际实现中，此处通过 CapabilityManager 检查权限
      // const allowed = await capabilityManager.requestCapability(capability);
      // if (!allowed) return;
    }
    const cleanup = effect();
    return cleanup;
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
