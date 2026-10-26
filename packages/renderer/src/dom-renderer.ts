/**
 * Aegis DOM Renderer
 *
 * 在主线程中渲染 UI 的渲染器
 */

import {
  UIMessageType,
  EventMessageType,
  NodeType,
  type NodeProps,
  type NodeMethod,
  type NodeRect,
  generateId,
} from '@aegis/protocol';
import { isSafeCssValue, sanitizeStyleSheet } from './style-sheet-policy';

// 节点映射
interface NodeMap {
  [id: string]: {
    dom: HTMLElement;
    type: NodeType;
    props: Record<string, unknown>;
  };
}

function cssPropertyName(property: string): string {
  if (property.startsWith('--')) return property;
  const cssProperty = property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  return cssProperty.startsWith('ms-') ? `-${cssProperty}` : cssProperty;
}

function cssStyleValue(property: string, value: number | string): string {
  if (typeof value !== 'number' || value === 0 || property.startsWith('--')) return String(value);

  const css = globalThis.CSS;
  if (typeof css?.supports !== 'function') return String(value);

  const rawValue = String(value);
  if (css.supports(property, rawValue)) return rawValue;

  const pixelValue = `${rawValue}px`;
  return css.supports(property, pixelValue) ? pixelValue : rawValue;
}

function containsCssUrl(value: string): boolean {
  const normalized = value
    .replace(/\\([\da-f]{1,6}\s?|[^\r\n])/gi, (_match, escaped: string) => {
      const hex = escaped.trim();
      if (!/^[\da-f]{1,6}$/i.test(hex)) return escaped;
      const codePoint = Number.parseInt(hex, 16);
      return String.fromCodePoint(codePoint === 0 || codePoint > 0x10ffff ? 0xfffd : codePoint);
    })
    .replace(/\/\*[\s\S]*?\*\//g, '');

  return /(?:url|(?:-webkit-)?image-set)\s*\(/i.test(normalized);
}

// 渲染器配置
export interface RendererConfig {
  container: HTMLElement;
  appId: string;
  onEvent?: (message: { type: string; payload: unknown }) => void;
}

const MAX_STYLESHEETS = 32;
const MAX_STYLESHEET_LENGTH = 64 * 1024;
const MAX_THEME_VARIABLES = 128;
const MAX_THEME_VALUE_LENGTH = 4096;

// DOM 渲染器类
export class AegisDOMRenderer {
  private config: RendererConfig;
  public readonly shadowRoot: ShadowRoot;
  private nodes: NodeMap = {};
  private rootId: string;
  private eventHandlers: Map<string, (event: Event) => void> = new Map();
  private defaultStyles = new WeakMap<HTMLElement, Map<string, string>>();
  private styleSheets = new Map<string, HTMLStyleElement>();
  private themeVariables = new Map<string, string>();
  private rootElement!: HTMLElement;
  private messageHandler: (event: MessageEvent) => void;

  constructor(config: RendererConfig) {
    this.config = config;
    this.rootId = `aegis-root-${config.appId}`;
    this.shadowRoot =
      config.container.shadowRoot ?? config.container.attachShadow({ mode: 'open' });
    this.messageHandler = (event) => {
      if (event.data && event.data.type) this.handleMessage(event.data);
    };
    this.setupMessageHandler();
    this.createRoot();
  }

  // 创建根节点
  private createRoot(): void {
    const root = document.createElement('div');
    this.rootElement = root;
    root.id = this.rootId;
    root.setAttribute('data-aegis-app', this.config.appId);
    root.style.cssText =
      'display: flex; flex-direction: column; width: 100%; height: 100%; isolation: isolate; contain: layout paint;';
    this.applyThemeVariables(root);
    this.shadowRoot.appendChild(root);

    // 注册根节点
    this.nodes[this.rootId] = {
      dom: root,
      type: NodeType.View,
      props: {},
    };
  }

  // 设置消息处理
  private setupMessageHandler(): void {
    window.addEventListener('message', this.messageHandler);
  }

  // 处理消息（公开方法用于测试）
  public handleMessage(message: { type: string; payload: Record<string, unknown> }): void {
    switch (message.type) {
      case UIMessageType.CreateNode:
        this.createNode(message.payload as unknown as NodeProps & { parentId?: string });
        break;
      case UIMessageType.UpdateNode:
        this.updateNode(
          message.payload as unknown as { id: string; props: Record<string, unknown> },
        );
        break;
      case UIMessageType.DeleteNode:
        this.deleteNode(message.payload as unknown as { id: string });
        break;
      case UIMessageType.InsertNode:
        this.insertNode(
          message.payload as unknown as { parentId: string; node: NodeProps; index: number },
        );
        break;
      case UIMessageType.MoveNode:
        this.moveNode(
          message.payload as unknown as { nodeId: string; newParentId: string; index: number },
        );
        break;
      case UIMessageType.SyncTree:
        this.syncTree(
          message.payload as unknown as { root: NodeProps; nodes: Record<string, NodeProps> },
        );
        break;
      case UIMessageType.SetGlobalStyleSheet:
        this.setGlobalStyleSheet(message.payload as { styleSheetId: string; cssText: string });
        break;
      case UIMessageType.RemoveGlobalStyleSheet:
        this.removeGlobalStyleSheet(message.payload as { styleSheetId: string });
        break;
      case UIMessageType.SetThemeVariables:
        this.setThemeVariables(
          message.payload as { variables: Record<string, string | number | null> },
        );
        break;
      case UIMessageType.InvokeNodeMethod:
        this.invokeNodeMethod(
          message.payload as { requestId: string; nodeId: string; method: NodeMethod },
        );
        break;
    }
  }

  private setGlobalStyleSheet(payload: { styleSheetId: string; cssText: string }): void {
    const { styleSheetId, cssText } = payload;
    if (typeof styleSheetId !== 'string' || !styleSheetId || styleSheetId.length > 128) return;
    if (typeof cssText !== 'string' || cssText.length > MAX_STYLESHEET_LENGTH) return;

    let styleElement = this.styleSheets.get(styleSheetId);
    if (!styleElement && this.styleSheets.size >= MAX_STYLESHEETS) return;

    try {
      const safeCss = sanitizeStyleSheet(cssText);
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.dataset['aegisStylesheet'] = styleSheetId;
        this.styleSheets.set(styleSheetId, styleElement);
        this.shadowRoot.appendChild(styleElement);
      }
      styleElement.textContent = safeCss;
    } catch (error) {
      console.warn('[Aegis] Rejected global stylesheet:', error);
    }
  }

  private removeGlobalStyleSheet(payload: { styleSheetId: string }): void {
    if (typeof payload.styleSheetId !== 'string') return;
    this.styleSheets.get(payload.styleSheetId)?.remove();
    this.styleSheets.delete(payload.styleSheetId);
  }

  private setThemeVariables(payload: { variables: Record<string, string | number | null> }): void {
    if (
      !payload.variables ||
      typeof payload.variables !== 'object' ||
      Array.isArray(payload.variables)
    )
      return;

    for (const [name, value] of Object.entries(payload.variables)) {
      if (!name.startsWith('--')) continue;
      if (value === null) {
        this.themeVariables.delete(name);
        this.rootElement.style.removeProperty(name);
      } else if (isSafeCssValue(String(value))) {
        const cssValue = String(value);
        if (cssValue.length > MAX_THEME_VALUE_LENGTH) continue;
        if (!this.themeVariables.has(name) && this.themeVariables.size >= MAX_THEME_VARIABLES)
          continue;
        this.themeVariables.set(name, cssValue);
        this.rootElement.style.setProperty(name, cssValue);
      }
    }
  }

  private applyThemeVariables(element: HTMLElement): void {
    for (const [name, value] of this.themeVariables) element.style.setProperty(name, value);
  }

  private invokeNodeMethod(payload: {
    requestId: string;
    nodeId: string;
    method: NodeMethod;
  }): void {
    const { requestId, nodeId, method } = payload;
    if (typeof requestId !== 'string' || typeof nodeId !== 'string') return;

    const respond = (success: boolean, result?: NodeRect, error?: string): void => {
      const message = {
        type: UIMessageType.NodeMethodResult,
        id: generateId(),
        timestamp: Date.now(),
        payload: { requestId, success, result, error },
      };
      if (this.config.onEvent) this.config.onEvent(message);
      else window.postMessage(message);
    };

    const node = this.nodes[nodeId];
    if (!node) {
      respond(false, undefined, 'Aegis node is not mounted');
      return;
    }

    try {
      switch (method) {
        case 'measure': {
          const rect = node.dom.getBoundingClientRect();
          respond(true, {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            left: rect.left,
          });
          return;
        }
        case 'focus':
        case 'blur':
          if (node.type !== NodeType.Input && node.type !== NodeType.Button) {
            respond(false, undefined, `Aegis node does not support ${method}`);
            return;
          }
          node.dom[method]();
          respond(true);
          return;
        default:
          respond(false, undefined, 'Unsupported Aegis node method');
      }
    } catch (error) {
      respond(false, undefined, error instanceof Error ? error.message : String(error));
    }
  }

  // 创建节点
  private createNode(payload: NodeProps & { parentId?: string }): void {
    const { id, type, props, children, parentId } = payload;

    // 创建 DOM 元素
    const dom = this.createElement(type, props);

    // 设置 id 属性
    dom.id = id;
    this.applyElementProps(dom, props);

    // 注册节点
    this.nodes[id] = { dom, type, props };

    // 添加事件监听
    this.addEventListeners(id, dom, props);

    // 查找父节点
    const targetParentId = parentId || this.rootId;
    const parent = this.nodes[targetParentId];

    if (parent) {
      parent.dom.appendChild(dom);
    }

    // 处理子节点
    if (children && children.length > 0) {
      children.forEach((_childId) => {
        // 子节点会在后续消息中创建
      });
    }

    // 发送创建成功消息
    this.sendResponse(UIMessageType.NodeCreated, id, true);
  }

  // 创建 DOM 元素
  private createElement(type: NodeType, props: Record<string, unknown>): HTMLElement {
    let element: HTMLElement;

    switch (type) {
      case 'view':
        element = document.createElement('div');
        break;
      case 'text':
        element = document.createElement('span');
        element.textContent = (props['value'] as string) || '';
        break;
      case 'button':
        element = document.createElement('button');
        element.textContent = (props['children'] as string) || '';
        break;
      case NodeType.Form:
        element = document.createElement('form');
        if (typeof props['className'] === 'string') element.className = props['className'];
        break;
      case 'input':
        element = document.createElement('input');
        (element as HTMLInputElement).value = (props['value'] as string) || '';
        (element as HTMLInputElement).placeholder = (props['placeholder'] as string) || '';
        this.applyElementProps(element, props);
        break;
      case 'scroll-view':
        element = document.createElement('div');
        element.style.overflow = 'auto';
        break;
      default:
        element = document.createElement('div');
    }

    const defaults = new Map<string, string>();
    for (let index = 0; index < element.style.length; index += 1) {
      const property = element.style.item(index);
      defaults.set(property, element.style.getPropertyValue(property));
    }
    this.defaultStyles.set(element, defaults);

    // 应用样式
    this.applyStyles(element, props);

    return element;
  }

  // 应用样式
  private applyStyles(
    element: HTMLElement,
    props: Record<string, unknown>,
    previousStyle?: unknown,
  ): void {
    const style = this.asStyleRecord(props['style']);
    const oldStyle = this.asStyleRecord(previousStyle);
    const nextProperties = new Set(Object.keys(style).map(cssPropertyName));

    for (const property of Object.keys(oldStyle).map(cssPropertyName)) {
      if (nextProperties.has(property)) continue;
      const defaultValue = this.defaultStyles.get(element)?.get(property);
      if (defaultValue === undefined) element.style.removeProperty(property);
      else element.style.setProperty(property, defaultValue);
    }

    for (const [property, value] of Object.entries(style)) {
      const cssProperty = cssPropertyName(property);
      if (typeof value !== 'string' && typeof value !== 'number') {
        element.style.removeProperty(cssProperty);
        continue;
      }

      const cssValue = cssStyleValue(cssProperty, value);
      if (containsCssUrl(cssValue)) {
        element.style.removeProperty(cssProperty);
        continue;
      }

      element.style.setProperty(cssProperty, cssValue);
    }
  }

  private asStyleRecord(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private applyElementProps(element: HTMLElement, props: Record<string, unknown>): void {
    if (element instanceof HTMLButtonElement) {
      const type = props['type'];
      if (type === 'button' || type === 'reset' || type === 'submit') element.type = type;
      if (typeof props['disabled'] === 'boolean') element.disabled = props['disabled'];
    }

    if (element instanceof HTMLInputElement) {
      if (typeof props['type'] === 'string') element.type = props['type'];
      if (typeof props['value'] === 'string') element.value = props['value'];
      if (typeof props['placeholder'] === 'string') element.placeholder = props['placeholder'];
      if (typeof props['name'] === 'string') element.name = props['name'];
      if (typeof props['disabled'] === 'boolean') element.disabled = props['disabled'];
      if (typeof props['autoFocus'] === 'boolean') element.autofocus = props['autoFocus'];
    }
  }

  // 添加事件监听
  private addEventListeners(
    nodeId: string,
    element: HTMLElement,
    props: Record<string, unknown>,
  ): void {
    if (props['onClick']) {
      const handler = (event: Event) => {
        if (!(element instanceof HTMLButtonElement && element.type === 'submit')) {
          event.preventDefault();
        }
        this.sendEvent(nodeId, 'click', {
          x: (event as MouseEvent).clientX,
          y: (event as MouseEvent).clientY,
        });
      };
      element.addEventListener('click', handler);
      this.eventHandlers.set(`${nodeId}-click`, handler);
    }

    if (props['onChangeText']) {
      const handler = (event: Event) => {
        const value = (event.target as HTMLInputElement).value;
        this.sendEvent(nodeId, 'input', { value });
      };
      element.addEventListener('input', handler);
      this.eventHandlers.set(`${nodeId}-input`, handler);
    }

    for (const eventType of ['focus', 'blur'] as const) {
      const propName = eventType === 'focus' ? 'onFocus' : 'onBlur';
      if (!props[propName]) continue;
      const handler = () => this.sendEvent(nodeId, eventType, {});
      element.addEventListener(eventType, handler);
      this.eventHandlers.set(`${nodeId}-${eventType}`, handler);
    }

    if (props['onScroll']) {
      const handler = (event: Event) => {
        const target = event.currentTarget as HTMLElement;
        this.sendEvent(nodeId, 'scroll', {
          scrollTop: target.scrollTop,
          scrollLeft: target.scrollLeft,
          scrollHeight: target.scrollHeight,
          clientHeight: target.clientHeight,
          clientWidth: target.clientWidth,
        });
      };
      element.addEventListener('scroll', handler);
      this.eventHandlers.set(`${nodeId}-scroll`, handler);
    }

    if (props['onSubmit'] && element instanceof HTMLFormElement) {
      const handler = (event: Event) => {
        event.preventDefault();
        const formData = new FormData(element);
        const data: Record<string, string> = {};
        for (const [name, value] of formData.entries()) {
          if (typeof value === 'string') {
            Object.defineProperty(data, name, {
              value,
              enumerable: true,
              configurable: true,
              writable: true,
            });
          }
        }
        this.sendEvent(nodeId, 'submit', data);
      };
      element.addEventListener('submit', handler);
      this.eventHandlers.set(`${nodeId}-submit`, handler);
    }
  }

  // 发送事件到 Worker
  private sendEvent(nodeId: string, eventType: string, data: Record<string, unknown>): void {
    const message = {
      type: EventMessageType.Dispatch,
      id: generateId(),
      timestamp: Date.now(),
      payload: {
        type: eventType,
        nodeId,
        handlerId: `${nodeId}-${eventType}`,
        timestamp: Date.now(),
        data,
      },
    };

    if (this.config.onEvent) this.config.onEvent(message);
    else window.postMessage(message);
  }

  // 更新节点
  private updateNode(payload: { id: string; props: Record<string, unknown> }): void {
    const { id, props } = payload;
    const node = this.nodes[id];

    if (node) {
      const previousStyle = node.props['style'];
      Object.assign(node.props, props);
      this.applyElementProps(node.dom, props);

      // 更新样式
      this.applyStyles(node.dom, node.props, previousStyle);

      // 更新文本内容
      if (node.type === NodeType.Input && props['value'] !== undefined) {
        (node.dom as HTMLInputElement).value = String(props['value']);
      } else if (props['value'] !== undefined) {
        node.dom.textContent = String(props['value']);
      }

      this.sendResponse(UIMessageType.NodeUpdated, id, true);
    } else {
      this.sendResponse(UIMessageType.NodeUpdated, id, false, 'Node not found');
    }
  }

  // 删除节点
  private deleteNode(payload: { id: string }): void {
    const { id } = payload;
    const node = this.nodes[id];

    if (node) {
      this.removeEventListeners(id);
      node.dom.remove();
      delete this.nodes[id];

      this.sendResponse(UIMessageType.NodeDeleted, id, true);
    } else {
      this.sendResponse(UIMessageType.NodeDeleted, id, false, 'Node not found');
    }
  }

  // 移除事件监听
  private removeEventListeners(nodeId: string): void {
    const node = this.nodes[nodeId];
    if (!node) return;
    this.eventHandlers.forEach((handler, key) => {
      if (!key.startsWith(`${nodeId}-`)) return;
      const eventType = key.slice(nodeId.length + 1);
      const domEvent = eventType === 'input' ? 'input' : eventType;
      node.dom.removeEventListener(domEvent, handler);
      this.eventHandlers.delete(key);
    });
  }

  // 插入节点
  private insertNode(payload: { parentId: string; node: NodeProps; index: number }): void {
    const { parentId, node } = payload;
    const parent = this.nodes[parentId];

    if (parent) {
      // 创建新节点
      this.createNode({ ...node, parentId });
    }
  }

  // 移动节点
  private moveNode(payload: { nodeId: string; newParentId: string; index: number }): void {
    const { nodeId, newParentId } = payload;
    const node = this.nodes[nodeId];
    const newParent = this.nodes[newParentId];

    if (node && newParent) {
      newParent.dom.appendChild(node.dom);
    }
  }

  // 同步树
  private syncTree(payload: { root: NodeProps; nodes: Record<string, NodeProps> }): void {
    const { root, nodes } = payload;

    for (const [id, node] of Object.entries(this.nodes)) {
      const clickHandler = this.eventHandlers.get(`${id}-click`);
      const inputHandler = this.eventHandlers.get(`${id}-input`);
      if (clickHandler) node.dom.removeEventListener('click', clickHandler);
      if (inputHandler) node.dom.removeEventListener('input', inputHandler);
      this.removeEventListeners(id);
    }
    this.eventHandlers.clear();

    // 清空现有内容
    this.nodes = {};

    // 创建根容器
    const rootContainer = document.createElement('div');
    this.rootElement.replaceWith(rootContainer);
    this.rootElement = rootContainer;
    rootContainer.id = this.rootId;
    rootContainer.setAttribute('data-aegis-app', this.config.appId);
    rootContainer.style.cssText =
      'display: flex; flex-direction: column; width: 100%; height: 100%; isolation: isolate; contain: layout paint;';
    this.applyThemeVariables(rootContainer);

    // 注册根容器
    this.nodes[this.rootId] = {
      dom: rootContainer,
      type: NodeType.View,
      props: {},
    };

    const createTreeNode = (nodeProps: NodeProps): HTMLElement => {
      const dom = this.createElement(nodeProps.type, nodeProps.props);
      dom.id = nodeProps.id;
      this.nodes[nodeProps.id] = { dom, type: nodeProps.type, props: nodeProps.props };
      this.applyElementProps(dom, nodeProps.props);
      this.addEventListeners(nodeProps.id, dom, nodeProps.props);
      for (const childId of nodeProps.children ?? []) {
        const childProps = nodes[childId];
        if (childProps) dom.appendChild(createTreeNode(childProps));
      }
      return dom;
    };

    rootContainer.appendChild(createTreeNode(root));
  }

  // 从树创建节点
  private createNodeFromTree(nodeProps: NodeProps, allNodes: Record<string, NodeProps>): void {
    this.createNode(nodeProps);

    if (nodeProps.children) {
      nodeProps.children.forEach((childId) => {
        const childProps = allNodes[childId];
        if (childProps) {
          this.createNodeFromTree(childProps, allNodes);
        }
      });
    }
  }

  // 发送响应
  private sendResponse(
    type: UIMessageType,
    nodeId: string,
    success: boolean,
    error?: string,
  ): void {
    const responseType =
      type === UIMessageType.CreateNode
        ? UIMessageType.NodeCreated
        : type === UIMessageType.UpdateNode
          ? UIMessageType.NodeUpdated
          : UIMessageType.NodeDeleted;

    const message = {
      type: responseType,
      id: generateId(),
      timestamp: Date.now(),
      payload: {
        id: nodeId,
        success,
        error,
      },
    };

    window.postMessage(message);
  }

  // 销毁渲染器
  destroy(): void {
    window.removeEventListener('message', this.messageHandler);
    for (const id of Object.keys(this.nodes)) this.removeEventListeners(id);
    for (const styleElement of this.styleSheets.values()) styleElement.remove();
    this.styleSheets.clear();
    this.rootElement.remove();
    this.nodes = {};
    this.eventHandlers.clear();
  }
}

// 创建渲染器
export function createRenderer(config: RendererConfig): AegisDOMRenderer {
  return new AegisDOMRenderer(config);
}
