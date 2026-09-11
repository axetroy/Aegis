/**
 * Aegis Playground
 *
 * 计数器演示应用
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
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

// 主应用
function App() {
  const [currentApp, setCurrentApp] = React.useState<'counter' | 'theme'>('counter');

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
      </View>

      {/* 当前应用 */}
      {currentApp === 'counter' ? <CounterApp /> : <ThemeApp />}
    </View>
  );
}

// 挂载应用
const root = ReactDOM.createRoot(document.getElementById('app')!);
root.render(<App />);
