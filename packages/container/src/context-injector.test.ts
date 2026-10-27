import { describe, expect, it } from 'vitest';
import { createContextInjector } from './context-injector.js';
import type { ContainerConfig } from './types.js';

const config: ContainerConfig = {
  appId: 'private-channel-test',
  manifest: { name: 'private-channel-test', version: '1.0.0', permissions: [] },
  entryCode: '',
};

describe('Worker context injection', () => {
  it('keeps internal channels off the Worker global and bootstraps through a transferred port', () => {
    const source = createContextInjector(config).generateInjectionCode();

    expect(source).toContain("event.data?.type !== '__aegis_initialize'");
    expect(source).toContain('event.ports.length !== 1');
    expect(source).toContain('sdk.initializeAegisProtocol(channel)');
    expect(source).not.toContain('self.__aegis_protocol');
    expect(source).not.toContain('self.__aegis_capability');
    expect(source).not.toContain('self.__aegis_resource');
  });
});
