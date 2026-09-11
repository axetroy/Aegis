// JSZip 依赖 setimmediate 库，在 Node 环境中需要 polyfill
// 并 mock attachEvent 以避免浏览器专属 API 错误
if (typeof (globalThis as Record<string, unknown>).attachEvent === 'undefined') {
  (globalThis as Record<string, unknown>).attachEvent = () => null;
}
if (typeof globalThis.setImmediate === 'undefined') {
  (globalThis as Record<string, unknown>).setImmediate = setImmediate as never;
  (globalThis as Record<string, unknown>).clearImmediate = clearImmediate as never;
}
