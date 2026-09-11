/**
 * Aegis React Host Config
 *
 * React Reconciler 的 host config 实现
 */

import { NodeType, generateId, createMessage, UIMessageType } from '@aegis/protocol';


// Aegis 实例类型
export interface AegisInstance {
  id: string;
  type: NodeType;
  props: Record<string, unknown>;
  children: string[];
  parent?: AegisInstance | null;
}

// 节点类型映射

const NODE_TYPE_MAP: Record<string, NodeType> = {
  View: NodeType.View,
  Text: NodeType.Text,
  Button: NodeType.Button,
  Input: NodeType.Input,
  'scroll-view': NodeType.ScrollView,
};

// 创建实例
export function createInstance(type: string, props: Record<string, unknown>): AegisInstance {
  const nodeType = NODE_TYPE_MAP[type] || NodeType.View;

  return {
    id: generateId(),
    type: nodeType,
    props: {
      ...props,
      children: undefined, // children 由 reconciler 管理
    },
    children: [],
  };
}

// 创建文本实例
export function createTextInstance(text: string): AegisInstance {
  return {
    id: generateId(),
    type: NodeType.Text,
    props: {
      value: text,
    },
    children: [],
  };
}

// 追加子节点
export function appendInitialChild(parent: AegisInstance, child: AegisInstance): void {
  parent.children.push(child.id);
}

// 插入子节点
export function insertBefore(parent: AegisInstance, child: AegisInstance, beforeChild: AegisInstance): void {
  const index = parent.children.indexOf(beforeChild.id);
  if (index !== -1) {
    parent.children.splice(index, 0, child.id);
  } else {
    parent.children.push(child.id);
  }
}

// 移除子节点
export function removeChild(parent: AegisInstance, child: AegisInstance): void {
  const index = parent.children.indexOf(child.id);
  if (index !== -1) {
    parent.children.splice(index, 1);
  }
}

// 最终化属性
export function finalizeInitialChildren(
  _instance: AegisInstance,
  _type: string,
  _props: Record<string, unknown>
): boolean {
  // 返回 true 表示需要提交更新
  return true;
}

// 深度比较两个值
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return a === b;

  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }
  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const keysA = Object.keys(aObj);
  const keysB = Object.keys(bObj);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(aObj[key], bObj[key])) return false;
  }

  return true;
}

// 准备更新
export function prepareUpdate(
  instance: AegisInstance,
  type: string,
  oldProps: Record<string, unknown>,
  newProps: Record<string, unknown>,
): null | Record<string, unknown> {
  const updatePayload: Record<string, unknown> = {};

  // 比较 props 变化
  for (const key in newProps) {
    if (!deepEqual(oldProps[key], newProps[key])) {
      updatePayload[key] = newProps[key];
    }
  }

  // 检查删除的 props
  for (const key in oldProps) {
    if (!(key in newProps)) {
      updatePayload[key] = undefined;
    }
  }

  return Object.keys(updatePayload).length > 0 ? updatePayload : null;
}

// 提交更新
export function commitUpdate(
  instance: AegisInstance,
  updatePayload: Record<string, unknown>
): void {
  // 合并更新到 instance
  Object.assign(instance.props, updatePayload);

  // 发送更新消息
  const message = createMessage(UIMessageType.UpdateNode, {
    id: instance.id,
    props: updatePayload,
  });

  // 通过 postMessage 发送到 Host
  self.postMessage(message);
}

// 提交文本更新
export function commitTextUpdate(instance: AegisInstance, text: string): void {
  instance.props['value'] = text;

  const message = createMessage(UIMessageType.UpdateNode, {
    id: instance.id,
    props: { value: text },
  });

  self.postMessage(message);
}

// 提交挂载
export function commitMount(instance: AegisInstance): void {
  const message = createMessage(UIMessageType.CreateNode, {
    id: instance.id,
    type: instance.type,
    props: instance.props,
    children: instance.children,
  });

  self.postMessage(message);
}

// 提交卸载
export function commitUnmount(instance: AegisInstance): void {
  const message = createMessage(UIMessageType.DeleteNode, {
    id: instance.id,
  });

  self.postMessage(message);
}

// 获取父节点
export function getParentInstance(instance: AegisInstance): AegisInstance | null {
  return instance.parent || null;
}

// 获取子节点
export function getChildInstances(instance: AegisInstance): string[] {
  return instance.children;
}

// 获取文本内容
export function getTextContent(instance: AegisInstance): string {
  if (instance.type === NodeType.Text) {
    return (instance.props['value'] as string) || '';
  }
  return '';
}

// 检查是否是文本节点
export function isTextInstance(instance: AegisInstance): boolean {
  return instance.type === NodeType.Text;
}

// 调度处理
export function scheduleTimeout(callback: () => void, timeout: number): void {
  setTimeout(callback, timeout);
}

// 取消调度
export function cancelTimeout(timeoutId: number): void {
  clearTimeout(timeoutId);
}

// 获取当前时间
export function now(): number {
  return performance.now();
}

// 是否支持微任务
export const supportsMicrotasks = true;

// 调度微任务
export const scheduleMicrotask =
  typeof queueMicrotask === 'function'
    ? queueMicrotask
    : (callback: () => void) => {
        Promise.resolve().then(callback);
      };

// 是否在主线程
export const isPrimaryRenderer = true;

// 是否支持持久化
export const supportsPersistence = false;

// 是否支持作用域协调
export const supportsHydration = false;
