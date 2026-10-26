/**
 * Aegis React Host Config
 *
 * React Reconciler 的 host config 实现
 */

import { NodeType, generateId, createMessage, UIMessageType } from '@aegis/protocol';

interface RootContainerInfo {
  appId: string;
  children: string[];
}

interface AegisProtocol {
  sendMessage(type: string, payload?: unknown): void;
}

const instances = new Map<string, AegisInstance>();
const eventHandlers = new Map<string, (data?: unknown) => void>();

function sendMessage(type: string, payload: Record<string, unknown>): void {
  const protocol = (self as unknown as { __aegis_protocol?: AegisProtocol }).__aegis_protocol;
  if (protocol) {
    protocol.sendMessage(type, payload);
  } else {
    self.postMessage(createMessage(type, payload));
  }
}

export function setGlobalStyleSheet(styleSheetId: string, cssText: string): void {
  if (!styleSheetId || styleSheetId.length > 128) {
    throw new Error('Global stylesheet id must contain 1 to 128 characters');
  }
  if (cssText.length > 64 * 1024) {
    throw new Error('Global stylesheet exceeds the 64 KB limit');
  }

  sendMessage(UIMessageType.SetGlobalStyleSheet, { styleSheetId, cssText });
}

export function removeGlobalStyleSheet(styleSheetId: string): void {
  sendMessage(UIMessageType.RemoveGlobalStyleSheet, { styleSheetId });
}

export function setThemeVariables(variables: Record<string, string | number | null>): void {
  for (const [name, value] of Object.entries(variables)) {
    if (!name.startsWith('--')) throw new Error(`Theme variable must start with --: ${name}`);
    if (typeof value === 'string' && !isSafeThemeValue(value)) {
      throw new Error(`Theme variable contains a forbidden CSS resource: ${name}`);
    }
  }

  sendMessage(UIMessageType.SetThemeVariables, { variables });
}

function isSafeThemeValue(value: string): boolean {
  return !/(?:url|(?:-webkit-)?image-set|paint)\s*\(/i.test(value);
}

function toProtocolValue(value: unknown): unknown {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) return value.map(toProtocolValue).filter((item) => item !== undefined);
  if (typeof value !== 'object' || '$$typeof' in value) return undefined;

  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    const safeValue = toProtocolValue(item);
    if (safeValue !== undefined) result[key] = safeValue;
  }
  return result;
}

function serializableProps(instance: AegisInstance): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(instance.props)) {
    if (key === 'children') continue;
    if (key === 'onClick' && typeof value === 'function') {
      const handlerId = `${instance.id}-click`;
      eventHandlers.set(handlerId, value as (data?: unknown) => void);
      props[key] = handlerId;
    } else if (key === 'onChangeText' && typeof value === 'function') {
      const handlerId = `${instance.id}-input`;
      eventHandlers.set(handlerId, value as (data?: unknown) => void);
      props[key] = handlerId;
    } else {
      const safeValue = toProtocolValue(value);
      if (safeValue !== undefined) props[key] = safeValue;
    }
  }
  return props;
}

export function dispatchAegisEvent(payload: unknown): void {
  if (typeof payload !== 'object' || payload === null || !('handlerId' in payload)) return;
  const handlerId = String(payload.handlerId);
  const handler = eventHandlers.get(handlerId);
  if (handler) handler('data' in payload ? payload.data : undefined);
}

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
  div: NodeType.View,
  span: NodeType.Text,
  button: NodeType.Button,
  input: NodeType.Input,
  p: NodeType.Text,
  h1: NodeType.Text,
  h2: NodeType.Text,
  h3: NodeType.Text,
};

// 创建实例
export function createInstance(type: string, props: Record<string, unknown>): AegisInstance {
  const nodeType = NODE_TYPE_MAP[type] || NodeType.View;
  const instance: AegisInstance = {
    id: generateId(),
    type: nodeType,
    props: {
      ...props,
      children: undefined, // children 由 reconciler 管理
    },
    children: [],
  };
  instances.set(instance.id, instance);
  return instance;
}

// 创建文本实例
export function createTextInstance(text: string): AegisInstance {
  const instance: AegisInstance = {
    id: generateId(),
    type: NodeType.Text,
    props: {
      value: text,
    },
    children: [],
  };
  instances.set(instance.id, instance);
  return instance;
}

// 追加子节点
export function appendInitialChild(parent: AegisInstance, child: AegisInstance): void {
  parent.children.push(child.id);
  child.parent = parent;
}

// 插入子节点
export function insertBefore(parent: AegisInstance, child: AegisInstance, beforeChild: AegisInstance): void {
  if (child.parent) removeChild(child.parent, child);
  const index = parent.children.indexOf(beforeChild.id);
  if (index !== -1) {
    parent.children.splice(index, 0, child.id);
  } else {
    parent.children.push(child.id);
  }
  child.parent = parent;
}

// 移除子节点
export function removeChild(parent: AegisInstance, child: AegisInstance): void {
  const index = parent.children.indexOf(child.id);
  if (index !== -1) {
    parent.children.splice(index, 1);
  }
  child.parent = null;
}

export function appendChild(parent: AegisInstance, child: AegisInstance): void {
  if (child.parent) removeChild(child.parent, child);
  parent.children.push(child.id);
  child.parent = parent;
}

export function appendChildToContainer(container: RootContainerInfo, child: AegisInstance): void {
  if (child.parent) removeChild(child.parent, child);
  container.children.push(child.id);
  child.parent = null;
}

export function insertInContainerBefore(
  container: RootContainerInfo,
  child: AegisInstance,
  beforeChild: AegisInstance,
): void {
  const index = container.children.indexOf(beforeChild.id);
  if (index === -1) container.children.push(child.id);
  else container.children.splice(index, 0, child.id);
  child.parent = null;
}

export function removeChildFromContainer(container: RootContainerInfo, child: AegisInstance): void {
  const index = container.children.indexOf(child.id);
  if (index !== -1) container.children.splice(index, 1);
  child.parent = null;
}

export function resetAfterCommit(container: RootContainerInfo): void {
  const nodes: Record<string, { id: string; type: NodeType; props: Record<string, unknown>; children: string[] }> = {};
  eventHandlers.clear();

  const collect = (id: string): void => {
    const instance = instances.get(id);
    if (!instance) return;
    nodes[id] = {
      id,
      type: instance.type,
      props: serializableProps(instance),
      children: instance.children,
    };
    for (const childId of instance.children) collect(childId);
  };

  for (const id of container.children) collect(id);
  sendMessage(UIMessageType.SyncTree, {
    root: { id: 'root', type: NodeType.View, props: {}, children: container.children },
    nodes,
  });
}

export function clearContainer(container: RootContainerInfo): void {
  container.children = [];
}

export const supportsMutation = true;

// 最终化属性
export function finalizeInitialChildren(
  _instance: AegisInstance,
  _type: string,
  _props: Record<string, unknown>
): boolean {
  return false;
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
  typeOrPayload: string | Record<string, unknown>,
  _oldProps?: Record<string, unknown>,
  newProps?: Record<string, unknown>,
): void {
  const updatePayload = newProps ?? (typeof typeOrPayload === 'string' ? {} : typeOrPayload);
  // 合并更新到 instance
  Object.assign(instance.props, updatePayload);

  // 发送更新消息
  sendMessage(UIMessageType.UpdateNode, {
    id: instance.id,
    props: serializableProps(instance),
  });
}

// 提交文本更新
export function commitTextUpdate(instance: AegisInstance, _oldText: string, text: string): void {
  instance.props['value'] = text;

  sendMessage(UIMessageType.UpdateNode, {
    id: instance.id,
    props: { value: text },
  });
}

// 提交挂载
export function commitMount(instance: AegisInstance): void {
  sendMessage(UIMessageType.CreateNode, {
    id: instance.id,
    type: instance.type,
    props: serializableProps(instance),
    children: instance.children,
    parentId: instance.parent?.id,
  });
}

// 提交卸载
export function commitUnmount(instance: AegisInstance): void {
  sendMessage(UIMessageType.DeleteNode, {
    id: instance.id,
  });
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

export function resolveUpdatePriority(): number {
  return 2;
}

export function getCurrentUpdatePriority(): number {
  return 2;
}

export function setCurrentUpdatePriority(_priority: number): void {}

export function shouldSetTextContent(_type: string, _props: Record<string, unknown>): boolean {
  return false;
}

export function getRootHostContext(): null {
  return null;
}

export function getChildHostContext(): null {
  return null;
}

export function getPublicInstance(instance: unknown): unknown {
  return instance;
}

export function prepareForCommit(): null {
  return null;
}

export function getInstanceFromNode(): null {
  return null;
}

export function getInstanceFromScope(): null {
  return null;
}

export function detachDeletedInstance(): void {}

export function maySuspendCommit(): boolean {
  return false;
}

export function preloadInstance(): boolean {
  return true;
}

export function startSuspendingCommit(): void {}

export function suspendInstance(): void {}

export function waitForCommitToBeReady(): null {
  return null;
}

export const DefaultEventPriority = 2;
export const DiscreteEventPriority = 1;
export const ContinuousEventPriority = 4;
export const bindToConsole = undefined;
export const extraDevToolsConfig = undefined;
