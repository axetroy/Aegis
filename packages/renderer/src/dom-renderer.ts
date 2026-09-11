/**
 * Aegis DOM Renderer
 *
 * 在主线程中渲染 UI 的渲染器
 */

import {
  UIMessageType,
  EventMessageType,
  type NodeProps,
  type NodeType,
  generateId,
} from '@aegis/protocol';

// 节点映射
interface NodeMap {
  [id: string]: {
    dom: HTMLElement;
    props: Record<string, any>;
  };
}

// 渲染器配置
export interface RendererConfig {
  container: HTMLElement;
  appId: string;
}

// DOM 渲染器类
export class AegisDOMRenderer {
  private config: RendererConfig;
  private nodes: NodeMap = {};
  private rootId: string;
  private eventHandlers: Map<string, (event: Event) => void> = new Map();

  constructor(config: RendererConfig) {
    this.config = config;
    this.rootId = `aegis-root-${config.appId}`;
    this.setupMessageHandler();
    this.createRoot();
  }

  // 创建根节点
  private createRoot(): void {
    const root = document.createElement('div');
    root.id = this.rootId;
    root.setAttribute('data-aegis-app', this.config.appId);
    root.style.cssText = 'display: flex; flex-direction: column; width: 100%; height: 100%;';
    this.config.container.appendChild(root);

    // 注册根节点
    this.nodes[this.rootId] = {
      dom: root,
      props: {},
    };
  }

  // 设置消息处理
  private setupMessageHandler(): void {
    // 监听来自 Worker 的消息
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type) {
        this.handleMessage(event.data);
      }
    });
  }

  // 处理消息（公开方法用于测试）
  public handleMessage(message: { type: string; payload: any }): void {
    switch (message.type) {
      case UIMessageType.CreateNode:
        this.createNode(message.payload);
        break;
      case UIMessageType.UpdateNode:
        this.updateNode(message.payload);
        break;
      case UIMessageType.DeleteNode:
        this.deleteNode(message.payload);
        break;
      case UIMessageType.InsertNode:
        this.insertNode(message.payload);
        break;
      case UIMessageType.MoveNode:
        this.moveNode(message.payload);
        break;
      case UIMessageType.SyncTree:
        this.syncTree(message.payload);
        break;
    }
  }

  // 创建节点
  private createNode(payload: NodeProps & { parentId?: string }): void {
    const { id, type, props, children, parentId } = payload;

    // 创建 DOM 元素
    const dom = this.createElement(type, props);

    // 设置 id 属性
    dom.id = id;

    // 注册节点
    this.nodes[id] = { dom, props };

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
  private createElement(type: NodeType, props: Record<string, any>): HTMLElement {
    let element: HTMLElement;

    switch (type) {
      case 'view':
        element = document.createElement('div');
        break;
      case 'text':
        element = document.createElement('span');
        element.textContent = props['value'] || '';
        break;
      case 'button':
        element = document.createElement('button');
        element.textContent = props['children'] || '';
        break;
      case 'input':
        element = document.createElement('input');
        (element as HTMLInputElement).value = props['value'] || '';
        (element as HTMLInputElement).placeholder = props['placeholder'] || '';
        break;
      case 'scroll-view':
        element = document.createElement('div');
        element.style.overflow = 'auto';
        break;
      default:
        element = document.createElement('div');
    }

    // 应用样式
    this.applyStyles(element, props);

    return element;
  }

  // 应用样式
  private applyStyles(element: HTMLElement, props: Record<string, any>): void {
    const style = (props['style'] as Record<string, any>) || {};

    if (style['display']) element.style.display = style['display'];
    if (style['flexDirection']) element.style.flexDirection = style['flexDirection'];
    if (style['justifyContent']) element.style.justifyContent = style['justifyContent'];
    if (style['alignItems']) element.style.alignItems = style['alignItems'];
    if (style['width'])
      element.style.width = typeof style['width'] === 'number' ? `${style['width']}px` : style['width'];
    if (style['height'])
      element.style.height = typeof style['height'] === 'number' ? `${style['height']}px` : style['height'];
    if (style['padding']) element.style.padding = `${style['padding']}px`;
    if (style['margin']) element.style.margin = `${style['margin']}px`;
    if (style['backgroundColor']) element.style.backgroundColor = style['backgroundColor'];
    if (style['borderRadius']) element.style.borderRadius = `${style['borderRadius']}px`;
    if (style['opacity']) element.style.opacity = style['opacity'].toString();
    if (style['fontSize']) element.style.fontSize = `${style['fontSize']}px`;
    if (style['color']) element.style.color = style['color'];
    if (style['textAlign']) element.style.textAlign = style['textAlign'];
  }

  // 添加事件监听
  private addEventListeners(nodeId: string, element: HTMLElement, props: Record<string, any>): void {
    // 点击事件
    if (props['onClick']) {
      const handler = (event: Event) => {
        event.preventDefault();
        this.sendEvent(nodeId, 'click', { x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY });
      };
      element.addEventListener('click', handler);
      this.eventHandlers.set(`${nodeId}-click`, handler);
    }

    // 输入事件
    if (props['onChangeText']) {
      const handler = (event: Event) => {
        const value = (event.target as HTMLInputElement).value;
        this.sendEvent(nodeId, 'input', { value });
      };
      element.addEventListener('input', handler);
      this.eventHandlers.set(`${nodeId}-input`, handler);
    }
  }

  // 发送事件到 Worker
  private sendEvent(nodeId: string, eventType: string, data: Record<string, any>): void {
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

    // 发送到 Worker
    window.postMessage(message);
  }

  // 更新节点
  private updateNode(payload: { id: string; props: Record<string, any> }): void {
    const { id, props } = payload;
    const node = this.nodes[id];

    if (node) {
      Object.assign(node.props, props);

      // 更新样式
      this.applyStyles(node.dom, node.props);

      // 更新文本内容
      if (props['value'] !== undefined) {
        node.dom.textContent = props['value'];
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
      node.dom.remove();
      delete this.nodes[id];

      // 清理事件监听
      this.removeEventListeners(id);

      this.sendResponse(UIMessageType.NodeDeleted, id, true);
    } else {
      this.sendResponse(UIMessageType.NodeDeleted, id, false, 'Node not found');
    }
  }

  // 移除事件监听
  private removeEventListeners(nodeId: string): void {
    this.eventHandlers.forEach((_handler, key) => {
      if (key.startsWith(nodeId)) {
        this.eventHandlers.delete(key);
      }
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

    // 清空现有内容
    this.config.container.innerHTML = '';
    this.nodes = {};

    // 创建根容器
    const rootContainer = document.createElement('div');
    rootContainer.id = this.rootId;
    rootContainer.setAttribute('data-aegis-app', this.config.appId);
    rootContainer.style.cssText = 'display: flex; flex-direction: column; width: 100%; height: 100%;';
    this.config.container.appendChild(rootContainer);

    // 注册根容器
    this.nodes[this.rootId] = {
      dom: rootContainer,
      props: {},
    };

    // 创建根节点并直接添加到容器
    const rootDom = this.createElement(root.type, root.props);
    rootDom.id = root.id;
    this.nodes[root.id] = { dom: rootDom, props: root.props };
    rootContainer.appendChild(rootDom);

    // 递归创建子节点并添加到根节点
    if (root.children) {
      root.children.forEach((childId) => {
        const childProps = nodes[childId];
        if (childProps) {
          const childDom = this.createElement(childProps.type, childProps.props);
          childDom.id = childId;
          this.nodes[childId] = { dom: childDom, props: childProps.props };
          rootDom.appendChild(childDom);
        }
      });
    }
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
  private sendResponse(type: UIMessageType, nodeId: string, success: boolean, error?: string): void {
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
    this.config.container.innerHTML = '';
    this.nodes = {};
    this.eventHandlers.clear();
  }
}

// 创建渲染器
export function createRenderer(config: RendererConfig): AegisDOMRenderer {
  return new AegisDOMRenderer(config);
}
