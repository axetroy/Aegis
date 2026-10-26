import { Button, Text, View } from '@aegis/ui';
import { render } from '@aegis/react';
import { useState } from 'react';

function CounterApp() {
  const [count, setCount] = useState(0);

  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#ffffff',
        borderRadius: 8,
      }}
    >
      <Text style={{ fontSize: 14, color: '#64716e' }}>AEGIS / COUNTER APP</Text>
      <Text style={{ fontSize: 56, fontWeight: 700, color: '#167c68' }}>{count}</Text>
      <Text style={{ fontSize: 14, color: '#64716e' }}>当前计数</Text>
      <View style={{ display: 'flex', flexDirection: 'row', gap: 10, marginTop: 20 }}>
        <Button
          onClick={() => setCount((value) => value - 1)}
          style={{ width: 64, height: 48, backgroundColor: '#b84c42' }}
        >
          −
        </Button>
        <Button
          onClick={() => setCount(0)}
          style={{ width: 80, height: 48, backgroundColor: '#64716e' }}
        >
          重置
        </Button>
        <Button
          onClick={() => setCount((value) => value + 1)}
          style={{ width: 64, height: 48, backgroundColor: '#167c68' }}
        >
          +
        </Button>
      </View>
    </View>
  );
}

render(<CounterApp />);