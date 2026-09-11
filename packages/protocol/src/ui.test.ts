/**
 * @aegis/protocol UI Protocol 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  NodeType,
  UIOperationType,
  UIMessageType,
  generateId,
  createMessage,
  type NodeProps,
  type UIOperation,
  type UIMessage,
} from './ui';

describe('@aegis/protocol/ui', () => {
  describe('NodeType', () => {
    it('should define all node types', () => {
      expect(NodeType.View).toBe('view');
      expect(NodeType.Text).toBe('text');
      expect(NodeType.Button).toBe('button');
      expect(NodeType.Input).toBe('input');
      expect(NodeType.ScrollView).toBe('scroll-view');
    });
  });

  describe('UIOperationType', () => {
    it('should define all operation types', () => {
      expect(UIOperationType.Create).toBe('create');
      expect(UIOperationType.Update).toBe('update');
      expect(UIOperationType.Delete).toBe('delete');
      expect(UIOperationType.Insert).toBe('insert');
      expect(UIOperationType.Move).toBe('move');
    });
  });

  describe('UIMessageType', () => {
    it('should define all message types', () => {
      // Worker -> Host
      expect(UIMessageType.CreateNode).toBe('ui:create-node');
      expect(UIMessageType.UpdateNode).toBe('ui:update-node');
      expect(UIMessageType.DeleteNode).toBe('ui:delete-node');
      expect(UIMessageType.InsertNode).toBe('ui:insert-node');
      expect(UIMessageType.MoveNode).toBe('ui:move-node');
      expect(UIMessageType.SyncTree).toBe('ui:sync-tree');

      // Host -> Worker
      expect(UIMessageType.NodeCreated).toBe('ui:node-created');
      expect(UIMessageType.NodeUpdated).toBe('ui:node-updated');
      expect(UIMessageType.NodeDeleted).toBe('ui:node-deleted');
      expect(UIMessageType.Error).toBe('ui:error');
    });
  });

  describe('generateId', () => {
    it('should generate unique ids', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it('should generate string ids', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
    });

    it('should contain timestamp', () => {
      const id = generateId();
      const parts = id.split('-');
      expect(parts.length).toBeGreaterThanOrEqual(2);
      // 第一部分应该是时间戳（数字）
      expect(Number(parts[0])).not.toBeNaN();
    });
  });

  describe('createMessage', () => {
    it('should create a message with correct structure', () => {
      const payload = {
        id: 'test-id',
        type: NodeType.View,
        props: { style: { display: 'flex' } },
        children: [],
      };

      const message = createMessage(UIMessageType.CreateNode, payload);

      expect(message).toHaveProperty('type', UIMessageType.CreateNode);
      expect(message).toHaveProperty('id');
      expect(message).toHaveProperty('timestamp');
      expect(message).toHaveProperty('payload', payload);
    });

    it('should generate unique message id', () => {
      const payload = { id: 'test', value: 'hello' };

      const msg1 = createMessage(UIMessageType.UpdateNode, payload);
      const msg2 = createMessage(UIMessageType.UpdateNode, payload);

      expect(msg1.id).not.toBe(msg2.id);
    });

    it('should set timestamp to current time', () => {
      const before = Date.now();
      const payload = { id: 'test', value: 'hello' };
      const message = createMessage(UIMessageType.UpdateNode, payload);
      const after = Date.now();

      expect(message.timestamp).toBeGreaterThanOrEqual(before);
      expect(message.timestamp).toBeLessThanOrEqual(after);
    });

    it('should create CreateNode message', () => {
      const payload: NodeProps = {
        id: 'node-1',
        type: NodeType.View,
        props: {},
        children: [],
      };

      const message = createMessage(UIMessageType.CreateNode, payload);

      expect(message.type).toBe(UIMessageType.CreateNode);
      expect(message.payload).toEqual(payload);
    });

    it('should create UpdateNode message', () => {
      const payload = {
        id: 'node-1',
        props: { style: { color: 'red' } },
      };

      const message = createMessage(UIMessageType.UpdateNode, payload);

      expect(message.type).toBe(UIMessageType.UpdateNode);
      expect(message.payload).toEqual(payload);
    });

    it('should create DeleteNode message', () => {
      const payload = { id: 'node-1' };

      const message = createMessage(UIMessageType.DeleteNode, payload);

      expect(message.type).toBe(UIMessageType.DeleteNode);
      expect(message.payload).toEqual(payload);
    });

    it('should create SyncTree message', () => {
      const payload = {
        root: {
          id: 'root',
          type: NodeType.View,
          props: {},
          children: ['child-1'],
        },
        nodes: {
          'child-1': {
            id: 'child-1',
            type: NodeType.Text,
            props: { value: 'Hello' },
            children: [],
          },
        },
      };

      const message = createMessage(UIMessageType.SyncTree, payload);

      expect(message.type).toBe(UIMessageType.SyncTree);
      expect(message.payload).toEqual(payload);
    });
  });

  describe('NodeProps', () => {
    it('should create valid node props', () => {
      const node: NodeProps = {
        id: 'test-node',
        type: NodeType.View,
        props: {
          style: {
            display: 'flex',
            flexDirection: 'column',
          },
        },
        children: ['child-1', 'child-2'],
      };

      expect(node.id).toBe('test-node');
      expect(node.type).toBe(NodeType.View);
      expect(node.props.style.display).toBe('flex');
      expect(node.children).toHaveLength(2);
    });

    it('should allow nodes without children', () => {
      const node: NodeProps = {
        id: 'leaf-node',
        type: NodeType.Text,
        props: { value: 'Hello' },
      };

      expect(node.children).toBeUndefined();
    });
  });

  describe('UIOperation', () => {
    it('should create valid create operation', () => {
      const op: UIOperation = {
        type: UIOperationType.Create,
        nodeId: 'new-node',
        parentId: 'parent-node',
        index: 0,
        props: { style: {} },
      };

      expect(op.type).toBe(UIOperationType.Create);
      expect(op.nodeId).toBe('new-node');
    });

    it('should create valid delete operation', () => {
      const op: UIOperation = {
        type: UIOperationType.Delete,
        nodeId: 'delete-node',
      };

      expect(op.type).toBe(UIOperationType.Delete);
      expect(op.nodeId).toBe('delete-node');
    });
  });
});
