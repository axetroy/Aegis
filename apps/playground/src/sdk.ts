import {
  setAegisProtocolChannel,
  type AegisProtocolChannel,
} from '../../../packages/react/src/protocol-bridge';

let protocolInitialized = false;

export function initializeAegisProtocol(channel: AegisProtocolChannel): void {
  if (protocolInitialized) {
    throw new Error('Aegis protocol channel is already initialized');
  }
  protocolInitialized = true;
  setAegisProtocolChannel(channel);
}

export {
  AegisProvider,
  GlobalStyleSheet,
  render,
  useAegisContext,
  useAegisEffect,
  useAegisRef,
} from '@aegis/react';
export { Button, Text, View } from '@aegis/ui';
export {
  Children,
  Component,
  Profiler,
  PureComponent,
  StrictMode,
  Suspense,
  cloneElement,
  createContext,
  createElement,
  forwardRef,
  isValidElement,
  lazy,
  memo,
  startTransition,
  useCallback,
  useContext,
  useDebugValue,
  useDeferredValue,
  useEffect,
  useId,
  useImperativeHandle,
  useInsertionEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  version,
} from 'react';
export { jsx, jsxs } from 'react/jsx-runtime';
export { Fragment } from 'react/jsx-runtime';
export { default } from 'react';
