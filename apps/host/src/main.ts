/**
 * Aegis Host
 *
 * 安全运行时环境
 */

// 渲染器配置
interface RendererConfig {
  container: HTMLElement;
  appId: string;
}

interface RenderNode {
  dom: HTMLElement;
  props: Record<string, unknown>;
}

const allowedNodeTypes = new Set(['view', 'text', 'button', 'input']);
const allowedStyles = new Set([
  'alignItems',
  'backgroundColor',
  'borderRadius',
  'color',
  'display',
  'flexDirection',
  'fontSize',
  'fontWeight',
  'gap',
  'height',
  'margin',
  'marginBottom',
  'marginTop',
  'opacity',
  'padding',
  'textAlign',
  'width',
]);

// 渲染器创建函数
function createRenderer(config: RendererConfig, dispatchEvent: (message: unknown) => void) {
  const { container, appId } = config;

  // 创建根元素
  const root = document.createElement('div');
  root.id = `aegis-root-${appId}`;
  root.setAttribute('data-aegis-app', appId);
  root.style.cssText = 'display: flex; flex-direction: column; width: 100%; height: 100%;';
  container.appendChild(root);

  const nodes = new Map<string, RenderNode>();
  const eventListeners = new Map<string, Array<[string, EventListener]>>();

  const handleMessage = (message: { type?: string; payload?: unknown }) => {
    if (!message || typeof message !== 'object' || typeof message.type !== 'string') return;
    const { type, payload } = message || {};
    switch (type) {
      case 'ui:sync-tree':
        if (isRecord(payload)) {
          syncTree(payload as { root: HostNode; nodes: Record<string, HostNode> });
        }
        break;
      case 'ui:update-node':
        if (isRecord(payload) && typeof payload.id === 'string' && isRecord(payload.props)) {
          updateNode(payload as unknown as { id: string; props: Record<string, unknown> });
        }
        break;
      case 'ui:create-node':
        if (isHostNode(payload)) createNode(payload);
        break;
      case 'ui:delete-node':
        if (isRecord(payload) && typeof payload.id === 'string') deleteNode({ id: payload.id });
        break;
    }
  };

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

  // 同步树
  interface HostNode {
    id: string;
    type: string;
    parentId?: string;
    props?: Record<string, unknown>;
    children?: string[];
  }

  const isHostNode = (value: unknown): value is HostNode =>
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.type === 'string' &&
    (value.parentId === undefined || typeof value.parentId === 'string');

  const syncTree = (payload: { root: HostNode; nodes: Record<string, HostNode> }) => {
    if (!isRecord(payload.root) || !isRecord(payload.nodes)) return;
    clearNodes();
    root.replaceChildren();
    nodes.clear();

    const { root: rootNode, nodes: nodeMap } = payload;
    const visited = new Set<string>();
    const appendTree = (node: HostNode, parent: HTMLElement, depth: number) => {
      if (
        !node ||
        typeof node.id !== 'string' ||
        node.id.length === 0 ||
        node.id.length > 128 ||
        !allowedNodeTypes.has(node.type) ||
        visited.has(node.id) ||
        visited.size >= 5000 ||
        depth > 100
      )
        return;
      visited.add(node.id);
      const child = createDOMElement(node);
      parent.appendChild(child.dom);
      nodes.set(node.id, child);
      registerEvents(node.id, child);
      if (!Array.isArray(node.children)) return;
      for (const childId of node.children) {
        if (visited.size >= 5000) break;
        if (typeof childId !== 'string') continue;
        const childNode = nodeMap[childId];
        if (childNode) appendTree(childNode, child.dom, depth + 1);
      }
    };
    appendTree(rootNode, root, 0);
  };

  // 创建 DOM 元素
  const createDOMElement = (node: HostNode): RenderNode => {
    const props = node.props ?? {};
    let element: HTMLElement;

    switch (node.type) {
      case 'view':
        element = document.createElement('div');
        break;
      case 'text':
        element = document.createElement('span');
        element.textContent = String(props['value'] ?? '');
        break;
      case 'button':
        element = document.createElement('button');
        element.textContent = String(props['children'] ?? '');
        break;
      case 'input':
        element = document.createElement('input');
        (element as HTMLInputElement).value = String(props['value'] ?? '');
        break;
      default:
        element = document.createElement('div');
    }

    applyProps(element, props);
    return { dom: element, props: { ...props } };
  };

  const createNode = (node: HostNode) => {
    if (
      typeof node.id !== 'string' ||
      node.id.length === 0 ||
      node.id.length > 128 ||
      !allowedNodeTypes.has(node.type) ||
      nodes.has(node.id) ||
      nodes.size >= 5000
    )
      return;
    const parent = node.parentId ? nodes.get(node.parentId)?.dom : root;
    if (!parent) return;
    let depth = 0;
    for (
      let ancestor: HTMLElement | null = parent;
      ancestor && ancestor !== root;
      ancestor = ancestor.parentElement
    ) {
      depth += 1;
    }
    if (depth >= 100) return;
    const child = createDOMElement(node);
    parent.appendChild(child.dom);
    nodes.set(node.id, child);
    registerEvents(node.id, child);
  };

  const applyProps = (element: HTMLElement, props: Record<string, unknown>) => {
    const style = props['style'];
    if (style && typeof style === 'object') {
      for (const [key, value] of Object.entries(style)) {
        if (!allowedStyles.has(key)) continue;
        if (typeof value !== 'string' && typeof value !== 'number') continue;
        if (typeof value === 'string' && /url\s*\(|expression\s*\(|@import/i.test(value)) continue;
        const cssValue =
          typeof value === 'number' &&
          !['opacity', 'fontWeight', 'lineHeight', 'zIndex', 'flex', 'order'].includes(key)
            ? `${value}px`
            : String(value);
        element.style.setProperty(
          key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`),
          cssValue,
        );
      }
    }
    if (element instanceof HTMLInputElement) {
      if (props['value'] !== undefined) element.value = String(props['value']);
      if (props['placeholder'] !== undefined) element.placeholder = String(props['placeholder']);
    }
    if (element instanceof HTMLButtonElement && props['children'] !== undefined) {
      element.textContent = String(props['children']);
    } else if (element instanceof HTMLSpanElement && props['value'] !== undefined) {
      element.textContent = String(props['value']);
    }
  };

  const registerEvents = (id: string, node: RenderNode) => {
    const listeners: Array<[string, EventListener]> = [];
    if (typeof node.props['onClick'] === 'string') {
      const listener: EventListener = (event) => {
        event.preventDefault();
        dispatchEvent({
          type: 'event:dispatch',
          payload: {
            handlerId: node.props['onClick'],
            data: { x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY },
          },
        });
      };
      node.dom.addEventListener('click', listener);
      listeners.push(['click', listener]);
    }
    if (typeof node.props['onChangeText'] === 'string' && node.dom instanceof HTMLInputElement) {
      const listener: EventListener = () => {
        dispatchEvent({
          type: 'event:dispatch',
          payload: {
            handlerId: node.props['onChangeText'],
            data: { value: node.dom instanceof HTMLInputElement ? node.dom.value : '' },
          },
        });
      };
      node.dom.addEventListener('input', listener);
      listeners.push(['input', listener]);
    }
    if (listeners.length) eventListeners.set(id, listeners);
  };

  const clearNodes = () => {
    for (const [id, listeners] of eventListeners) {
      const node = nodes.get(id);
      if (node)
        for (const [type, listener] of listeners) node.dom.removeEventListener(type, listener);
    }
    eventListeners.clear();
  };

  // 更新节点
  const updateNode = (payload: { id: string; props: Record<string, unknown> }) => {
    const node = nodes.get(payload.id);
    if (node) {
      Object.assign(node.props, payload.props);
      applyProps(node.dom, node.props);
      clearEventListeners(payload.id, node);
      registerEvents(payload.id, node);
    }
  };

  // 删除节点
  const deleteNode = (payload: { id: string }) => {
    const node = nodes.get(payload.id);
    if (node) {
      for (const [id, childNode] of nodes) {
        if (node.dom === childNode.dom || node.dom.contains(childNode.dom)) {
          clearEventListeners(id, childNode);
          nodes.delete(id);
        }
      }
      node.dom.remove();
    }
  };

  const clearEventListeners = (id: string, node: RenderNode) => {
    for (const [type, listener] of eventListeners.get(id) ?? []) {
      node.dom.removeEventListener(type, listener);
    }
    eventListeners.delete(id);
  };

  return {
    handleMessage,
    destroy: () => {
      clearNodes();
      root.remove();
      nodes.clear();
    },
  };
}

// 初始化宿主环境
function initHost() {
  console.log('[Aegis Host] 初始化宿主环境...');

  // 获取渲染容器
  const container = document.getElementById('app-renderer');
  if (!container) {
    console.error('[Aegis Host] 找不到渲染容器');
    return;
  }

  // 创建渲染器
  const rendererConfig: RendererConfig = {
    container,
    appId: 'playground',
  };

  // 创建 Worker
  const worker = new Worker(new URL('./app-worker.ts', import.meta.url), { type: 'module' });
  const renderer = createRenderer(rendererConfig, (message) => worker.postMessage(message));
  console.log('[Aegis Host] 渲染器已创建');

  worker.onmessage = (event) => {
    renderer.handleMessage(event.data);
  };

  // 初始化 Worker
  worker.postMessage({
    type: 'init',
    payload: {
      appId: 'playground',
    },
  });

  console.log('[Aegis Host] 宿主环境初始化完成');

  // 返回清理函数
  return () => {
    worker.terminate();
    renderer.destroy();
  };
}

// 启动宿主
const cleanup = initHost();

// 热更新支持
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cleanup?.();
  });
}
