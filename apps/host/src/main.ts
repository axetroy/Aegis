/**
 * Aegis Host
 *
 * 安全运行时环境
 */

import { createRenderer, RendererConfig } from '@aegis/renderer';
import { UIMessageType, createMessage } from '@aegis/protocol';

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
  const worker = new Worker('/src/app-worker.ts', { type: 'module' });

  // 设置消息转发
  worker.onmessage = (event) => {
    console.log('[Aegis Host] 收到 Worker 消息:', event.data);
    // 转发消息到渲染器
    window.postMessage(event.data);
  };

  // 监听来自渲染器的消息
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type) {
      // 转发消息到 Worker
      worker.postMessage(event.data);
    }
  });

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
