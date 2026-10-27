/**
 * @aegis/container
 *
 * Aegis 容器：执行隔离、上下文注入、沙箱化
 */

export { Container } from './container.js';
export { createSandbox } from './sandbox.js';
export { createContextInjector } from './context-injector.js';
export { ContainerState } from './types.js';
export type {
  ContainerConfig,
  ContainerEvent,
  ContainerEventHandler,
  WorkerMessage,
  WorkerResponse,
  ResourceUsage,
  AegisContainer,
  ContextInjection,
} from './types.js';
export type { SandboxConfig } from './sandbox.js';
export type { InternalMessage, AegisProtocolChannel } from './context-injector.js';
