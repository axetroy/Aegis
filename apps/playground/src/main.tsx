/**
 * Aegis Playground
 *
 * 计数器演示应用
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Container } from '@aegis/container';
import { AegisDOMRenderer } from '@aegis/renderer';
import { View, Text, Button } from '@aegis/ui';

// 计数器应用
function CounterApp() {
  const [count, setCount] = React.useState(0);

  return (
    <View
      style={{
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 48,
          fontWeight: 'bold',
          color: '#333',
          marginBottom: 20,
        }}
      >
        {count}
      </Text>

      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 10,
        }}
      >
        <Button
          onClick={() => setCount(c => c - 1)}
          style={{
            backgroundColor: '#FF3B30',
            width: 60,
            height: 60,
            borderRadius: 30,
          }}
        >
          -
        </Button>

        <Button
          onClick={() => setCount(0)}
          style={{
            backgroundColor: '#8E8E93',
            width: 60,
            height: 60,
            borderRadius: 30,
          }}
        >
          重置
        </Button>

        <Button
          onClick={() => setCount(c => c + 1)}
          style={{
            backgroundColor: '#34C759',
            width: 60,
            height: 60,
            borderRadius: 30,
          }}
        >
          +
        </Button>
      </View>

      <Text
        style={{
          fontSize: 14,
          color: '#666',
          marginTop: 20,
        }}
      >
        当前计数: {count}
      </Text>
    </View>
  );
}

// 主题应用
function ThemeApp() {
  const [darkMode, setDarkMode] = React.useState(false);

  const theme = {
    backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
    color: darkMode ? '#ffffff' : '#000000',
  };

  return (
    <View
      style={{
        padding: 20,
        backgroundColor: theme.backgroundColor,
        color: theme.color,
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          marginBottom: 20,
        }}
      >
        主题切换
      </Text>

      <Button
        onClick={() => setDarkMode(!darkMode)}
        style={{
          backgroundColor: darkMode ? '#FFD60A' : '#007AFF',
        }}
      >
        切换到{darkMode ? '浅色' : '深色'}模式
      </Button>
    </View>
  );
}

function ContainerCounterApp() {
  const renderTarget = React.useRef<HTMLDivElement>(null);
  const [status, setStatus] = React.useState('正在加载应用包...');

  React.useEffect(() => {
    let disposed = false;
    let appContainer: Container | undefined;
    let renderer: AegisDOMRenderer | undefined;
    let unsubscribe: (() => void) | undefined;

    const start = async () => {
      try {
        const response = await fetch('/counter-app.aegis');
        if (!response.ok) throw new Error(`加载应用包失败 (${response.status})`);

        const nextContainer = await Container.fromPackage(await response.blob());
        if (disposed) {
          await nextContainer.destroy();
          return;
        }
        appContainer = nextContainer;
        const target = renderTarget.current;
        if (!target) throw new Error('找不到应用渲染容器');

        renderer = new AegisDOMRenderer({
          container: target,
          appId: appContainer.appId,
          onEvent: (message) => {
            appContainer?.postMessage({ type: 'protocol', payload: message });
          },
        });

        unsubscribe = appContainer.onMessage((message) => {
          if (message.type === 'protocol' && typeof message.payload === 'object' && message.payload !== null) {
            const inner = message.payload as { type?: unknown; payload?: unknown };
            if (typeof inner.type === 'string') {
              renderer?.handleMessage({
                type: inner.type,
                payload: (inner.payload ?? {}) as Record<string, unknown>,
              });
            }
          } else if (message.type === '__aegis_error') {
            setStatus(`应用运行失败: ${String((message.payload as { message?: unknown })?.message ?? '未知错误')}`);
          }
        });

        await appContainer.initialize();
        if (!disposed) setStatus(`运行中 · ${appContainer.manifest.name}`);
      } catch (error) {
        if (!disposed) setStatus(`加载失败: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    void start();

    return () => {
      disposed = true;
      unsubscribe?.();
      renderer?.destroy();
      void appContainer?.destroy();
    };
  }, []);

  return (
    <View style={{ padding: 16, backgroundColor: '#f3f6f4', borderRadius: 8 }}>
      <Text style={{ fontSize: 13, color: '#64716e', marginBottom: 12 }}>{status}</Text>
      <div ref={renderTarget} style={{ minHeight: 240, display: 'flex', justifyContent: 'center' }} />
    </View>
  );
}

// 主应用
function App() {
  const [currentApp, setCurrentApp] = React.useState<'counter' | 'theme' | 'container'>('container');

  return (
    <View
      style={{
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      {/* 应用切换 */}
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 10,
          marginBottom: 20,
        }}
      >
        <Button
          onClick={() => setCurrentApp('counter')}
          style={{
            backgroundColor: currentApp === 'counter' ? '#007AFF' : '#E5E5EA',
            color: currentApp === 'counter' ? '#ffffff' : '#000000',
          }}
        >
          计数器
        </Button>

        <Button
          onClick={() => setCurrentApp('theme')}
          style={{
            backgroundColor: currentApp === 'theme' ? '#007AFF' : '#E5E5EA',
            color: currentApp === 'theme' ? '#ffffff' : '#000000',
          }}
        >
          主题
        </Button>

        <Button
          onClick={() => setCurrentApp('container')}
          style={{
            backgroundColor: currentApp === 'container' ? '#167c68' : '#e5e5ea',
            color: currentApp === 'container' ? '#ffffff' : '#000000',
          }}
        >
          容器运行
        </Button>
      </View>

      {/* 当前应用 */}
      {currentApp === 'counter' ? (
        <CounterApp />
      ) : currentApp === 'theme' ? (
        <ThemeApp />
      ) : (
        <ContainerCounterApp />
      )}
    </View>
  );
}

// 挂载应用
const appElement = document.getElementById('app');
if (!appElement) {
  throw new Error('App mount point #app not found');
}
const root = ReactDOM.createRoot(appElement);
root.render(<App />);
