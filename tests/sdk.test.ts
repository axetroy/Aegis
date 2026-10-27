import { describe, expect, it, vi } from 'vitest';
import * as sdk from '../apps/playground/src/sdk';

describe('host SDK module boundary', () => {
  it('does not export the private protocol channel accessor', () => {
    expect(sdk).not.toHaveProperty('getAegisProtocolChannel');
    expect(sdk).not.toHaveProperty('setAegisProtocolChannel');
    expect(sdk).not.toHaveProperty('createInstance');
    expect(sdk).not.toHaveProperty('dispatchAegisEvent');
  });

  it('allows the host to initialize the protocol channel only once', () => {
    const channel = {
      sendMessage: vi.fn(),
      onMessage: vi.fn(() => () => undefined),
    };

    sdk.initializeAegisProtocol(channel);

    expect(() => sdk.initializeAegisProtocol(channel)).toThrow(
      'Aegis protocol channel is already initialized',
    );
  });
});
