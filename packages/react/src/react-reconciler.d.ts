declare module 'react-reconciler' {
  import { ReactNode } from 'react';

  interface HostConfig<T, P, I, C, O> {
    createInstance(type: T, props: P, rootContainer: C, hostContext: O, internalHandle: unknown): I;
    createTextInstance(text: string, rootContainer: C, hostContext: O, internalHandle: unknown): I;
    appendInitialChild(parent: I, child: I): void;
    finalizeInitialChildren(...args: unknown[]): boolean;
    prepareUpdate(...args: unknown[]): unknown;
    shouldSetTextContent(type: T, props: P): boolean;
    getRootHostContext(rootContainer: C): O;
    getChildHostContext(parentHostContext: O, type: T): O;
    getPublicInstance(instance: I): unknown;
    prepareForCommit(containerInfo: C): unknown;
    resetAfterCommit(containerInfo: C): void;
    commitMount(...args: unknown[]): void;
    commitUpdate(...args: unknown[]): void;
    appendChild(parent: I, child: I): void;
    appendChildToContainer(containerInfo: C, child: I): void;
    removeChild(parent: I, child: I): void;
    clearContainer(containerInfo: C): void;
    insertBefore(parent: I, child: I, beforeChild: I): void;
    insertInContainerBefore(containerInfo: C, child: I, beforeChild: I): void;
    removeChildFromContainer(containerInfo: C, child: I): void;
    scheduleMicrotask(callback: () => void): void;
    trackSchedulerEvent(): void;
    resolveEventTimeStamp(): number;
    resolveEventType(): string | null;
    supportsMutation: boolean;
    supportsHydration: boolean;
  }
  function ReactReconciler(hostConfig: HostConfig<unknown, unknown, unknown, unknown, unknown>): {
    createContainer(
      containerInfo: unknown,
      tag: number,
      hydrationCallbacks: unknown,
      isStrictMode: boolean,
      concurrentUpdatesByDefaultOverride: boolean | null,
      identifierPrefix: string,
      onUncaughtError: (error: unknown) => void,
      onCaughtError: (error: unknown) => void,
      onRecoverableError: (error: unknown) => void,
      onDefaultTransitionIndicator: unknown,
    ): unknown;
    updateContainer(
      element: ReactNode | null,
      container: unknown,
      parentComponent: unknown,
      callback: () => void,
    ): unknown;
  };

  export type Instance = HostConfig<unknown, unknown, unknown, unknown, unknown>;
  export default ReactReconciler;
}
