/**
 * Aegis App Worker
 *
 * 在 Worker 中运行的应用代码
 */

// 应用状态
let state: Record<string, any> = {};

// 事件处理器
const eventHandlers: Map<string, Function> = new Map();

// 消息处理
self.onmessage = (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'init':
      console.log('[App Worker] 初始化应用:', payload.appId);
      initApp(payload.appId);
      break;

    case 'event:dispatch':
      handleEvent(payload);
      break;

    default:
      console.log('[App Worker] 未知消息类型:', type);
  }
};

// 初始化应用
function initApp(appId: string) {
  console.log(`[App Worker] 加载应用: ${appId}`);

  // 这里可以加载应用代码
  // 目前使用内置的计数器应用
  renderCounterApp();
}

// 渲染计数器应用
function renderCounterApp() {
  state = { count: 0 };

  // 发送初始 UI 树
  const uiTree = {
    type: 'ui:sync-tree',
    id: generateId(),
    timestamp: Date.now(),
    payload: {
      root: {
        id: 'root',
        type: 'view',
        props: {
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 20,
          },
        },
        children: ['count-display', 'button-group', 'status-text'],
      },
      nodes: {
        'count-display': {
          id: 'count-display',
          type: 'text',
          props: {
            value: '0',
            style: {
              fontSize: 48,
              fontWeight: 'bold',
              color: '#333',
              marginBottom: 20,
            },
          },
          children: [],
        },
        'button-group': {
          id: 'button-group',
          type: 'view',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'row',
              gap: 10,
            },
          },
          children: ['btn-decrement', 'btn-reset', 'btn-increment'],
        },
        'btn-decrement': {
          id: 'btn-decrement',
          type: 'button',
          props: {
            children: '-',
            onClick: 'handle-decrement',
            style: {
              backgroundColor: '#FF3B30',
              width: 60,
              height: 60,
              borderRadius: 30,
            },
          },
          children: [],
        },
        'btn-reset': {
          id: 'btn-reset',
          type: 'button',
          props: {
            children: '重置',
            onClick: 'handle-reset',
            style: {
              backgroundColor: '#8E8E93',
              width: 60,
              height: 60,
              borderRadius: 30,
            },
          },
          children: [],
        },
        'btn-increment': {
          id: 'btn-increment',
          type: 'button',
          props: {
            children: '+',
            onClick: 'handle-increment',
            style: {
              backgroundColor: '#34C759',
              width: 60,
              height: 60,
              borderRadius: 30,
            },
          },
          children: [],
        },
        'status-text': {
          id: 'status-text',
          type: 'text',
          props: {
            value: '当前计数: 0',
            style: {
              fontSize: 14,
              color: '#666',
              marginTop: 20,
            },
          },
          children: [],
        },
      },
    },
  };

  self.postMessage(uiTree);

  // 注册事件处理器
  eventHandlers.set('handle-decrement', () => {
    state.count--;
    updateCountDisplay();
  });

  eventHandlers.set('handle-reset', () => {
    state.count = 0;
    updateCountDisplay();
  });

  eventHandlers.set('handle-increment', () => {
    state.count++;
    updateCountDisplay();
  });
}

// 更新计数显示
function updateCountDisplay() {
  const updateMessage = {
    type: 'ui:update-node',
    id: generateId(),
    timestamp: Date.now(),
    payload: {
      id: 'count-display',
      props: {
        value: state.count.toString(),
      },
    },
  };

  self.postMessage(updateMessage);

  const statusMessage = {
    type: 'ui:update-node',
    id: generateId(),
    timestamp: Date.now(),
    payload: {
      id: 'status-text',
      props: {
        value: `当前计数: ${state.count}`,
      },
    },
  };

  self.postMessage(statusMessage);
}

// 处理事件
function handleEvent(eventData: any) {
  const { handlerId } = eventData;
  const handler = eventHandlers.get(handlerId);

  if (handler) {
    handler();
  }
}

// 生成唯一 ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
