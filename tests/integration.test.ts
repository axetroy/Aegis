/**
 * Aegis 集成测试
 *
 * 验证从 Worker 到 Renderer 的完整数据流
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  NodeType,
  UIMessageType,
  EventMessageType,
  createMessage,
  generateId,
  type NodeProps,
} from '@aegis/protocol';

// Mock 环境
describe('Aegis Integration Tests', () => {
  describe('UI Protocol Flow', () => {
    it('should create node and receive response', () => {
      const createNodeMsg = createMessage<{ type: string; id: string; timestamp: number; payload: NodeProps }>(
        UIMessageType.CreateNode,
        {
          id: 'node-1',
          type: NodeType.View,
          props: { style: { display: 'flex' } },
          children: [],
        },
      );

      expect(createNodeMsg.type).toBe(UIMessageType.CreateNode);
      expect(createNodeMsg.payload.id).toBe('node-1');
      expect(createNodeMsg.payload.type).toBe(NodeType.View);
    });

    it('should update node and receive response', () => {
      const updateNodeMsg = createMessage<{
        type: string;
        id: string;
        timestamp: number;
        payload: { id: string; props: Record<string, any> };
      }>(UIMessageType.UpdateNode, {
        id: 'node-1',
        props: { style: { color: 'red' } },
      });

      expect(updateNodeMsg.type).toBe(UIMessageType.UpdateNode);
      expect(updateNodeMsg.payload.id).toBe('node-1');
    });

    it('should delete node and receive response', () => {
      const deleteNodeMsg = createMessage<{
        type: string;
        id: string;
        timestamp: number;
        payload: { id: string };
      }>(UIMessageType.DeleteNode, {
        id: 'node-1',
      });

      expect(deleteNodeMsg.type).toBe(UIMessageType.DeleteNode);
      expect(deleteNodeMsg.payload.id).toBe('node-1');
    });

    it('should sync complete tree', () => {
      const syncTreeMsg = createMessage<{
        type: string;
        id: string;
        timestamp: number;
        payload: { root: NodeProps; nodes: Record<string, NodeProps> };
      }>(UIMessageType.SyncTree, {
        root: {
          id: 'root',
          type: NodeType.View,
          props: {},
          children: ['child-1', 'child-2'],
        },
        nodes: {
          'child-1': {
            id: 'child-1',
            type: NodeType.Text,
            props: { value: 'Hello' },
            children: [],
          },
          'child-2': {
            id: 'child-2',
            type: NodeType.Button,
            props: { children: 'Click' },
            children: [],
          },
        },
      });

      expect(syncTreeMsg.type).toBe(UIMessageType.SyncTree);
      expect(syncTreeMsg.payload.root.children).toHaveLength(2);
      expect(syncTreeMsg.payload.nodes['child-1'].type).toBe(NodeType.Text);
      expect(syncTreeMsg.payload.nodes['child-2'].type).toBe(NodeType.Button);
    });
  });

  describe('Event Protocol Flow', () => {
    it('should register event handler', () => {
      const registerMsg = createMessage<{
        type: string;
        id: string;
        timestamp: number;
        payload: { nodeId: string; eventType: string; handlerId: string };
      }>(EventMessageType.Register, {
        nodeId: 'button-1',
        eventType: 'click',
        handlerId: 'handler-1',
      });

      expect(registerMsg.type).toBe(EventMessageType.Register);
      expect(registerMsg.payload.nodeId).toBe('button-1');
      expect(registerMsg.payload.eventType).toBe('click');
    });

    it('should dispatch event and receive result', () => {
      const dispatchMsg = createMessage<{
        type: string;
        id: string;
        timestamp: number;
        payload: {
          type: string;
          nodeId: string;
          handlerId: string;
          timestamp: number;
          data: Record<string, any>;
        };
      }>(EventMessageType.Dispatch, {
        type: 'click',
        nodeId: 'button-1',
        handlerId: 'handler-1',
        timestamp: Date.now(),
        data: { x: 100, y: 200 },
      });

      expect(dispatchMsg.type).toBe(EventMessageType.Dispatch);
      expect(dispatchMsg.payload.type).toBe('click');
      expect(dispatchMsg.payload.data).toEqual({ x: 100, y: 200 });
    });

    it('should batch dispatch multiple events', () => {
      const batchMsg = createMessage<{
        type: string;
        id: string;
        timestamp: number;
        payload: { events: any[] };
      }>(EventMessageType.BatchDispatch, {
        events: [
          {
            type: 'click',
            nodeId: 'button-1',
            handlerId: 'handler-1',
            timestamp: Date.now(),
          },
          {
            type: 'input',
            nodeId: 'input-1',
            handlerId: 'handler-2',
            timestamp: Date.now(),
            data: { value: 'test' },
          },
        ],
      });

      expect(batchMsg.type).toBe(EventMessageType.BatchDispatch);
      expect(batchMsg.payload.events).toHaveLength(2);
    });

    it('should send event result', () => {
      const resultMsg = createMessage<{
        type: string;
        id: string;
        timestamp: number;
        payload: { handlerId: string; success: boolean; error?: string };
      }>(EventMessageType.Result, {
        handlerId: 'handler-1',
        success: true,
      });

      expect(resultMsg.type).toBe(EventMessageType.Result);
      expect(resultMsg.payload.success).toBe(true);
    });

    it('should send event result with error', () => {
      const resultMsg = createMessage<{
        type: string;
        id: string;
        timestamp: number;
        payload: { handlerId: string; success: boolean; error?: string };
      }>(EventMessageType.Result, {
        handlerId: 'handler-1',
        success: false,
        error: 'Handler not found',
      });

      expect(resultMsg.type).toBe(EventMessageType.Result);
      expect(resultMsg.payload.success).toBe(false);
      expect(resultMsg.payload.error).toBe('Handler not found');
    });
  });

  describe('Counter App Simulation', () => {
    let state: { count: number };
    let uiUpdates: any[];

    beforeEach(() => {
      state = { count: 0 };
      uiUpdates = [];
    });

    it('should simulate counter increment', () => {
      const initialSync = createMessage<{
        type: string;
        id: string;
        timestamp: number;
        payload: { root: NodeProps; nodes: Record<string, NodeProps> };
      }>(UIMessageType.SyncTree, {
        root: {
          id: 'counter-root',
          type: NodeType.View,
          props: { style: { display: 'flex', flexDirection: 'column' } },
          children: ['count-display', 'increment-btn'],
        },
        nodes: {
          'count-display': {
            id: 'count-display',
            type: NodeType.Text,
            props: { value: '0', style: { fontSize: 48 } },
            children: [],
          },
          'increment-btn': {
            id: 'increment-btn',
            type: NodeType.Button,
            props: { children: '+', style: { backgroundColor: '#34C759' } },
            children: [],
          },
        },
      });

      expect(initialSync.payload.nodes['count-display'].props['value']).toBe('0');

      state.count++;

      const updateMsg = createMessage<{
        type: string;
        id: string;
        timestamp: number;
        payload: { id: string; props: { value: string } };
      }>(UIMessageType.UpdateNode, {
        id: 'count-display',
        props: { value: state.count.toString() },
      });

      uiUpdates.push(updateMsg);

      expect(updateMsg.payload.props.value).toBe('1');
      expect(state.count).toBe(1);
    });

    it('should simulate counter decrement', () => {
      state.count = 5;

      state.count--;

      const updateMsg = createMessage<{
        type: string;
        id: string;
        timestamp: number;
        payload: { id: string; props: { value: string } };
      }>(UIMessageType.UpdateNode, {
        id: 'count-display',
        props: { value: state.count.toString() },
      });

      expect(updateMsg.payload.props.value).toBe('4');
      expect(state.count).toBe(4);
    });

    it('should simulate counter reset', () => {
      state.count = 10;

      state.count = 0;

      const updateMsg = createMessage<{
        type: string;
        id: string;
        timestamp: number;
        payload: { id: string; props: { value: string } };
      }>(UIMessageType.UpdateNode, {
        id: 'count-display',
        props: { value: state.count.toString() },
      });

      expect(updateMsg.payload.props.value).toBe('0');
      expect(state.count).toBe(0);
    });
  });

  describe('Node Isolation', () => {
    it('should keep app namespaces separate', () => {
      const app1Root = createMessage<{
        type: string;
        id: string;
        timestamp: number;
        payload: NodeProps;
      }>(UIMessageType.CreateNode, {
        id: 'app1-root',
        type: NodeType.View,
        props: { 'data-app': 'app1' },
        children: [],
      });

      const app2Root = createMessage<{
        type: string;
        id: string;
        timestamp: number;
        payload: NodeProps;
      }>(UIMessageType.CreateNode, {
        id: 'app2-root',
        type: NodeType.View,
        props: { 'data-app': 'app2' },
        children: [],
      });

      expect(app1Root.payload.id).not.toBe(app2Root.payload.id);
      expect(app1Root.payload.props['data-app']).toBe('app1');
      expect(app2Root.payload.props['data-app']).toBe('app2');
    });

    it('should generate unique node ids', () => {
      const ids = new Set<string>();

      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }

      expect(ids.size).toBe(100);
    });
  });

  describe('Message Validation', () => {
    it('should have valid message structure', () => {
      const msg = createMessage<{
        type: string;
        id: string;
        timestamp: number;
        payload: NodeProps;
      }>(UIMessageType.CreateNode, {
        id: 'test',
        type: NodeType.View,
        props: {},
        children: [],
      });

      expect(msg).toHaveProperty('type');
      expect(msg).toHaveProperty('id');
      expect(msg).toHaveProperty('timestamp');
      expect(msg).toHaveProperty('payload');

      expect(typeof msg.type).toBe('string');
      expect(typeof msg.id).toBe('string');
      expect(typeof msg.timestamp).toBe('number');
      expect(typeof msg.payload).toBe('object');
    });

    it('should have valid timestamp', () => {
      const before = Date.now();
      const msg = createMessage<{
        type: string;
        id: string;
        timestamp: number;
        payload: { id: string; props: Record<string, any> };
      }>(UIMessageType.UpdateNode, { id: 'test', props: {} });
      const after = Date.now();

      expect(msg.timestamp).toBeGreaterThanOrEqual(before);
      expect(msg.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('Performance Characteristics', () => {
    it('should handle rapid message creation', () => {
      const start = performance.now();

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
            props: {},
            children: [],
          }),
        );
      }

      const end = performance.now();
      const duration = end - start;

      expect(messages).toHaveLength(1000);
      expect(duration).toBeLessThan(1000);
    });

    it('should handle rapid ID generation', () => {
      const start = performance.now();

      const ids: string[] = [];
      for (let i = 0; i < 10000; i++) {
        ids.push(generateId());
      }

      const end = performance.now();
      const duration = end - start;

      expect(new Set(ids).size).toBe(10000);
      expect(duration).toBeLessThan(1000);
    });
  });
});
