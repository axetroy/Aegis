/**
 * Aegis 性能基准测试
 *
 * 测试核心操作的性能指标
 */

import { describe, it, expect, vi } from 'vitest';
import {
  NodeType,
  UIMessageType,
  createMessage,
  generateId,
  type NodeProps,
} from '@aegis/protocol';

describe('Aegis Performance Benchmarks', () => {
  describe('Message Creation Performance', () => {
    it('should create 10,000 messages within 1 second', () => {
      const start = performance.now();

      for (let i = 0; i < 10000; i++) {
        createMessage<{
          type: string;
          id: string;
          timestamp: number;
          payload: NodeProps;
        }>(UIMessageType.CreateNode, {
          id: `node-${i}`,
          type: NodeType.View,
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              padding: 10,
              margin: 5,
            },
          },
          children: i > 0 ? [`child-${i - 1}`] : [],
        });
      }

      const end = performance.now();
      const duration = end - start;
      const opsPerSecond = 10000 / (duration / 1000);

      console.log(`Message Creation: ${duration.toFixed(2)}ms for 10,000 messages`);
      console.log(`Operations per second: ${opsPerSecond.toFixed(0)}`);

      expect(duration).toBeLessThan(1000);
      expect(opsPerSecond).toBeGreaterThan(10000);
    });

    it('should create 100,000 unique IDs within 1 second', () => {
      const start = performance.now();
      const ids = new Set<string>();

      for (let i = 0; i < 100000; i++) {
        ids.add(generateId());
      }

      const end = performance.now();
      const duration = end - start;
      const opsPerSecond = 100000 / (duration / 1000);

      console.log(`ID Generation: ${duration.toFixed(2)}ms for 100,000 IDs`);
      console.log(`Operations per second: ${opsPerSecond.toFixed(0)}`);

      expect(ids.size).toBe(100000);
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Tree Operations Performance', () => {
    it('should build a large tree within 1 second', () => {
      const start = performance.now();

      const nodes: Record<string, NodeProps> = {};
      const rootNodeId = 'root';

      nodes[rootNodeId] = {
        id: rootNodeId,
        type: NodeType.View,
        props: {},
        children: [],
      };

      for (let i = 1; i <= 1000; i++) {
        const nodeId = `node-${i}`;
        const parentId = i === 1 ? rootNodeId : `node-${Math.floor(i / 2)}`;

        nodes[nodeId] = {
          id: nodeId,
          type: i % 3 === 0 ? NodeType.Text : NodeType.View,
          props: { value: `Node ${i}` },
          children: [],
        };

        if (nodes[parentId]) {
          nodes[parentId].children!.push(nodeId);
        }
      }

      const end = performance.now();
      const duration = end - start;
      const opsPerSecond = 1000 / (duration / 1000);

      console.log(`Tree Build: ${duration.toFixed(2)}ms for 1,000 nodes`);
      console.log(`Operations per second: ${opsPerSecond.toFixed(0)}`);

      expect(Object.keys(nodes).length).toBe(1001);
      expect(duration).toBeLessThan(1000);
    });

    it('should sync tree message within 100ms', () => {
      const nodeCount = 5000;
      const nodes: Record<string, NodeProps> = {};

      for (let i = 0; i < nodeCount; i++) {
        nodes[`node-${i}`] = {
          id: `node-${i}`,
          type: i % 5 === 0 ? NodeType.Button : NodeType.View,
          props: { style: { padding: 10 } },
          children: i > 0 ? [`node-${i - 1}`] : [],
        };
      }

      const start = performance.now();

      const syncMsg = createMessage<{
        type: string;
        id: string;
        timestamp: number;
        payload: { root: NodeProps; nodes: Record<string, NodeProps> };
      }>(UIMessageType.SyncTree, {
        root: {
          id: 'root',
          type: NodeType.View,
          props: {},
          children: [`node-${nodeCount - 1}`],
        },
        nodes,
      });

      const end = performance.now();
      const duration = end - start;

      console.log(`Sync Tree Message: ${duration.toFixed(2)}ms for ${nodeCount} nodes`);

      expect(syncMsg.payload.root).toBeDefined();
      expect(Object.keys(syncMsg.payload.nodes).length).toBe(nodeCount);
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Memory Usage', () => {
    it('should create 1000 messages with less than 10MB memory', () => {
      const messages = [];

      for (let i = 0; i < 1000; i++) {
        messages.push(
          createMessage<{
            type: string;
            id: string;
            timestamp: number;
            payload: NodeProps;
          }>(UIMessageType.CreateNode, {
            id: `node-${i}`,
            type: NodeType.View,
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 20,
                margin: 10,
                backgroundColor: '#ffffff',
                borderRadius: 8,
              },
            },
            children: Array.from({ length: 5 }, (_, j) => `child-${i}-${j}`),
          }),
        );
      }

      const estimatedSize = JSON.stringify(messages).length;

      console.log(`Memory Usage: ${(estimatedSize / 1024 / 1024).toFixed(2)}MB for 1,000 messages`);

      expect(estimatedSize).toBeLessThan(10 * 1024 * 1024);
      expect(messages.length).toBe(1000);
    });
  });

  describe('Event Handling Performance', () => {
    it('should process 10,000 events within 1 second', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handlers = new Map<string, (...args: any[]) => any>();

      for (let i = 0; i < 100; i++) {
        handlers.set(`handler-${i}`, vi.fn());
      }

      const start = performance.now();

      for (let i = 0; i < 10000; i++) {
        const handlerId = `handler-${i % 100}`;
        const handler = handlers.get(handlerId);

        if (handler) {
          handler({
            type: 'click',
            nodeId: `node-${i}`,
            handlerId,
            timestamp: Date.now(),
            data: { x: i, y: i * 2 },
          });
        }
      }

      const end = performance.now();
      const duration = end - start;
      const opsPerSecond = 10000 / (duration / 1000);

      console.log(`Event Processing: ${duration.toFixed(2)}ms for 10,000 events`);
      console.log(`Operations per second: ${opsPerSecond.toFixed(0)}`);

      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Batch Operations', () => {
    it('should batch 1000 UI operations', () => {
      const start = performance.now();

      const operations = Array.from({ length: 1000 }, (_, i) =>
        createMessage<{
          type: string;
          id: string;
          timestamp: number;
          payload: { id: string; props: Record<string, any> };
        }>(UIMessageType.UpdateNode, {
          id: `node-${i}`,
          props: {
            style: {
              color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
            },
          },
        }),
      );

      const end = performance.now();
      const duration = end - start;
      const opsPerSecond = 1000 / (duration / 1000);

      console.log(`Batch Operations: ${duration.toFixed(2)}ms for 1,000 operations`);
      console.log(`Operations per second: ${opsPerSecond.toFixed(0)}`);

      expect(operations.length).toBe(1000);
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Stress Tests', () => {
    it('should handle concurrent message creation', async () => {
      const start = performance.now();

      const batches = Array.from({ length: 5 }, (_, batchIndex) => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            for (let i = 0; i < 1000; i++) {
              createMessage<{
                type: string;
                id: string;
                timestamp: number;
                payload: NodeProps;
              }>(UIMessageType.CreateNode, {
                id: `batch-${batchIndex}-node-${i}`,
                type: NodeType.View,
                props: {},
                children: [],
              });
            }
            resolve();
          }, 0);
        });
      });

      await Promise.all(batches);

      const end = performance.now();
      const duration = end - start;

      console.log(`Concurrent Operations: ${duration.toFixed(2)}ms for 5,000 messages`);

      expect(duration).toBeLessThan(2000);
    });

    it('should handle rapid state updates', () => {
      const state: { count: number; items: number[] } = { count: 0, items: [] };

      const start = performance.now();

      for (let i = 0; i < 10000; i++) {
        state.count++;
        state.items.push(i);
      }

      const end = performance.now();
      const duration = end - start;

      console.log(`State Updates: ${duration.toFixed(2)}ms for 10,000 updates`);

      expect(state.count).toBe(10000);
      expect(state.items.length).toBe(10000);
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Protocol Efficiency', () => {
    it('should have minimal message overhead', () => {
      const smallPayload = { id: 'test' };

      const msg = createMessage<{
        type: string;
        id: string;
        timestamp: number;
        payload: { id: string };
      }>(UIMessageType.UpdateNode, smallPayload);

      const msgSize = JSON.stringify(msg).length;

      console.log(`Message Overhead: ${msgSize} bytes`);

      expect(msgSize).toBeLessThan(200);
    });

    it('should compress well for repeated patterns', () => {
      const messages = Array.from({ length: 100 }, (_, i) =>
        createMessage<{
          type: string;
          id: string;
          timestamp: number;
          payload: { id: string; props: Record<string, any> };
        }>(UIMessageType.UpdateNode, {
          id: `node-${i}`,
          props: { style: { display: 'flex', padding: 10 } },
        }),
      );

      const totalSize = JSON.stringify(messages).length;
      const avgSize = totalSize / messages.length;

      console.log(`Average Message Size: ${avgSize.toFixed(0)} bytes`);

      // 平均每条消息应该小于 200 bytes（考虑到包含唯一 ID 和时间戳）
      expect(avgSize).toBeLessThan(200);
    });
  });
});
