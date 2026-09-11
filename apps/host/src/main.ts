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

// 简化的渲染器创建函数
function createRenderer(config: RendererConfig) {
  const { container, appId } = config;

  // 创建根元素
  const root = document.createElement('div');
  root.id = `aegis-root-${appId}`;
  root.setAttribute('data-aegis-app', appId);
  root.style.cssText = 'display: flex; flex-direction: column; width: 100%; height: 100%;';
  container.appendChild(root);

  // 消息处理器
  const handleMessage = (event: MessageEvent) => {
    const { type, payload } = event.data || {};

    switch (type) {
      case 'ui:sync-tree':
        syncTree(payload);
        break;
      case 'ui:update-node':
        updateNode(payload);
        break;
      case 'ui:create-node':
        createNode(payload);
        break;
      case 'ui:delete-node':
        deleteNode(payload);
        break;
    }
  };

  // 节点存储
  const nodes = new Map<string, HTMLElement>();

  // 同步树
  interface HostNode {
    id: string;
    type: string;
    props?: Record<string, unknown>;
    children?: string[];
  }

  const syncTree = (payload: { root: HostNode; nodes: Record<string, HostNode> }) => {
    root.innerHTML = '';
    nodes.clear();

    const { root: rootNode, nodes: nodeMap } = payload;

    // 创建根节点
    const rootElement = createDOMElement(rootNode);
    root.appendChild(rootElement);
    nodes.set(rootNode.id, rootElement);

    // 创建子节点
    if (rootNode.children) {
      rootNode.children.forEach((childId: string) => {
        const childProps = nodeMap[childId];
        if (childProps) {
          const childElement = createDOMElement(childProps);
          rootElement.appendChild(childElement);
          nodes.set(childId, childElement);
        }
      });
    }
  };

  // 创建 DOM 元素
  const createDOMElement = (props: HostNode): HTMLElement => {
    let element: HTMLElement;

    switch (props.type) {
      case 'view':
        element = document.createElement('div');
        break;
      case 'text':
        element = document.createElement('span');
        element.textContent = String(props.props?.['value'] ?? '');
        break;
      case 'button':
        element = document.createElement('button');
        element.textContent = String(props.props?.['children'] ?? '');
        break;
      case 'input':
        element = document.createElement('input');
        (element as HTMLInputElement).value = String(props.props?.['value'] ?? '');
        break;
      default:
        element = document.createElement('div');
    }

    // 应用样式
    const style = props.props?.style || {};
    Object.entries(style).forEach(([key, value]) => {
      if (key === 'gap') {
        element.style.gap = `${value}px`;
      } else {
        (element.style as unknown as Record<string, string>)[key] = typeof value === 'number' ? `${value}px` : String(value);
      }
    });

    return element;
  };

  // 更新节点
  const updateNode = (payload: { id: string; props: Record<string, unknown> }) => {
    const element = nodes.get(payload.id);
    if (element) {
      if (payload.props?.value !== undefined) {
        element.textContent = String(payload.props.value);
      }
    }
  };

  // 创建节点
  const createNode = (payload: unknown) => {
    console.log('[Host] Create node:', payload);
  };

  // 删除节点
  const deleteNode = (payload: { id: string }) => {
    const element = nodes.get(payload.id);
    if (element) {
      element.remove();
      nodes.delete(payload.id);
    }
  };

  // 监听消息
  window.addEventListener('message', handleMessage);

  return {
    destroy: () => {
      window.removeEventListener('message', handleMessage);
      container.innerHTML = '';
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

  const renderer = createRenderer(rendererConfig);
  console.log('[Aegis Host] 渲染器已创建');

  // 创建 Worker
  const worker = new Worker(new URL('./app-worker.ts', import.meta.url), { type: 'module' });

  // 设置消息转发
  worker.onmessage = (event) => {
    console.log('[Aegis Host] 收到 Worker 消息:', event.data);
    // 转发消息到渲染器
    window.postMessage(event.data);
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
