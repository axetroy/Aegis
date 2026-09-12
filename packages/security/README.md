# @aegis/security

安全策略与权限管理器。为每个应用维护 `PermissionManager` 实例，负责能力授权、资源限制和策略校验。

## 导出

- **`PermissionManager`** — 权限管理核心类（`canAccess()`、`requestCapability()`、`checkResourceLimits()`、`trackResourceUsage()`、`revokeCapability()`）
- **策略校验器** — `validateNetworkPolicy()`、`validateStoragePolicy()`、`validateCameraPolicy()`、`validateLocationPolicy()` 等
- **类型** — `ResourceLimits`、`ResourceUsage`、`PermissionState`、`PermissionManagerConfig`

## 依赖

`@aegis/protocol`

## 用法

```ts
import { PermissionManager } from '@aegis/security';

const pm = new PermissionManager({ manifest, config: { resourceLimits: { ... } } });
if (pm.canAccess('storage')) {
  pm.requestCapability('storage');
}
```
