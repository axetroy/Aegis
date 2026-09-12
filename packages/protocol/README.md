# @aegis/protocol

Aegis UI、Event、Capability 通信协议定义，以及 `.aegis` 包格式类型。Worker 与 Host 之间的所有消息格式均定义于此。

## 导出

- **UI 协议** — `NodeType`、`NodeProps`、`UIOperation`、`UIMessageType`、`AppManifest`、`AegisPackageSpec`、`AegisSignature` 等
- **事件协议** — `EventType`、`EventData`、`EventMessageType` 等
- **能力协议** — `CapabilityName`、`PermissionDecision`、`CapabilityMessageType`、`CapabilityPolicy` 等

## 依赖

无外部 `@aegis/*` 依赖，是整个框架的最底层包。

## 用法

```ts
import { NodeType, UIMessageType, CapabilityName } from '@aegis/protocol';
```
