/**
 * @aegis/protocol Event Protocol 单元测试
 */

import { describe, it, expect } from 'vitest';
import {
  EventType,
  EventMessageType,
  type EventData,
  type EventHandlers,
} from './event';

describe('@aegis/protocol/event', () => {
  describe('EventType', () => {
    it('should define touch events', () => {
      expect(EventType.Touch).toBe('touch');
      expect(EventType.TouchStart).toBe('touchstart');
      expect(EventType.TouchMove).toBe('touchmove');
      expect(EventType.TouchEnd).toBe('touchend');
    });

    it('should define click events', () => {
      expect(EventType.Click).toBe('click');
    });

    it('should define input events', () => {
      expect(EventType.Input).toBe('input');
      expect(EventType.Change).toBe('change');
      expect(EventType.Focus).toBe('focus');
      expect(EventType.Blur).toBe('blur');
    });

    it('should define lifecycle events', () => {
      expect(EventType.Load).toBe('load');
      expect(EventType.Unload).toBe('unload');
      expect(EventType.Show).toBe('show');
      expect(EventType.Hide).toBe('hide');
    });
  });

  describe('EventMessageType', () => {
    it('should define all message types', () => {
      // Host -> Worker
      expect(EventMessageType.Dispatch).toBe('event:dispatch');
      expect(EventMessageType.BatchDispatch).toBe('event:batch-dispatch');

      // Worker -> Host
      expect(EventMessageType.Register).toBe('event:register');
      expect(EventMessageType.Unregister).toBe('event:unregister');
      expect(EventMessageType.Result).toBe('event:result');
    });
  });

  describe('EventData', () => {
    it('should create valid event data', () => {
      const eventData: EventData = {
        type: EventType.Click,
        nodeId: 'button-1',
        handlerId: 'handler-1',
        timestamp: Date.now(),
        data: { x: 100, y: 200 },
      };

      expect(eventData.type).toBe(EventType.Click);
      expect(eventData.nodeId).toBe('button-1');
      expect(eventData.handlerId).toBe('handler-1');
      expect(eventData.timestamp).toBeGreaterThan(0);
      expect(eventData.data).toEqual({ x: 100, y: 200 });
    });

    it('should allow event data without extra data', () => {
      const eventData: EventData = {
        type: EventType.Load,
        nodeId: 'root',
        handlerId: 'load-handler',
        timestamp: Date.now(),
      };

      expect(eventData.data).toBeUndefined();
    });
  });

  describe('EventHandlers', () => {
    it('should create valid event handlers map', () => {
      const handlers: EventHandlers = {
        'button-1': {
          click: 'handler-click-1',
          focus: 'handler-focus-1',
        },
        'input-1': {
          input: 'handler-input-1',
          blur: 'handler-blur-1',
        },
      };

      expect(handlers['button-1'].click).toBe('handler-click-1');
      expect(handlers['input-1'].input).toBe('handler-input-1');
    });

    it('should allow empty handlers', () => {
      const handlers: EventHandlers = {};

      expect(Object.keys(handlers)).toHaveLength(0);
    });
  });

  describe('Event Messages', () => {
    it('should create valid register message', () => {
      const message = {
        type: EventMessageType.Register,
        payload: {
          nodeId: 'button-1',
          eventType: EventType.Click,
          handlerId: 'handler-1',
        },
      };

      expect(message.type).toBe(EventMessageType.Register);
      expect(message.payload.nodeId).toBe('button-1');
      expect(message.payload.eventType).toBe(EventType.Click);
    });

    it('should create valid unregister message', () => {
      const message = {
        type: EventMessageType.Unregister,
        payload: {
          nodeId: 'button-1',
          eventType: EventType.Click,
          handlerId: 'handler-1',
        },
      };

      expect(message.type).toBe(EventMessageType.Unregister);
      expect(message.payload.handlerId).toBe('handler-1');
    });

    it('should create valid dispatch message', () => {
      const message = {
        type: EventMessageType.Dispatch,
        payload: {
          type: EventType.Click,
          nodeId: 'button-1',
          handlerId: 'handler-1',
          timestamp: Date.now(),
          data: { x: 100, y: 200 },
        },
      };

      expect(message.type).toBe(EventMessageType.Dispatch);
      expect(message.payload.type).toBe(EventType.Click);
    });

    it('should create valid batch dispatch message', () => {
      const message = {
        type: EventMessageType.BatchDispatch,
        payload: {
          events: [
            {
              type: EventType.Click,
              nodeId: 'button-1',
              handlerId: 'handler-1',
              timestamp: Date.now(),
            },
            {
              type: EventType.Input,
              nodeId: 'input-1',
              handlerId: 'handler-2',
              timestamp: Date.now(),
              data: { value: 'hello' },
            },
          ],
        },
      };

      expect(message.type).toBe(EventMessageType.BatchDispatch);
      expect(message.payload.events).toHaveLength(2);
    });

    it('should create valid result message', () => {
      const message = {
        type: EventMessageType.Result,
        payload: {
          handlerId: 'handler-1',
          success: true,
        },
      };

      expect(message.type).toBe(EventMessageType.Result);
      expect(message.payload.success).toBe(true);
    });

    it('should create valid result message with error', () => {
      const message = {
        type: EventMessageType.Result,
        payload: {
          handlerId: 'handler-1',
          success: false,
          error: 'Handler not found',
        },
      };

      expect(message.type).toBe(EventMessageType.Result);
      expect(message.payload.success).toBe(false);
      expect(message.payload.error).toBe('Handler not found');
    });
  });
});
