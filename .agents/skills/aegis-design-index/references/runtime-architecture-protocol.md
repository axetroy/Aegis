# 运行时架构与协议

[↑ 返回 Aegis 设计索引](../SKILL.md) · [← 上一篇](./foundation-security-model.md) · [下一篇 →](./capabilities-package-security.md)

包含总体架构、React 兼容层级、JSX、UI 协议、协议校验、节点命名空间与事件协议。

---

# 8. Aegis 总体架构

```text
                         AEGIS HOST
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌──────────────┐      ┌────────────────┐                   │
│  │ App Manager  │      │ Permission     │                   │
│  │              │      │ Manager        │                   │
│  └──────┬───────┘      └───────┬────────┘                   │
│         │                       │                            │
│         └───────────┬───────────┘                            │
│                     │                                        │
│              ┌──────▼───────┐                                │
│              │ Policy Engine│                                │
│              └──────┬───────┘                                │
│                     │                                        │
│              ┌──────▼───────┐                                │
│              │ Main Renderer│                                │
│              └──────┬───────┘                                │
│                     │                                        │
└─────────────────────┼────────────────────────────────────────┘
                      │
                SECURITY BOUNDARY
                      │
══════════════════════╪════════════════════════════════════════
                      │
                      ▼
┌──────────────────────────────────────────────────────────────┐
│                    AEGIS WORKER                              │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                  Application                           │  │
│  │                                                        │  │
│  │ React / JSX / Components / State / Libraries           │  │
│  └────────────────────────┬───────────────────────────────┘  │
│                           │                                  │
│                  ┌────────▼────────┐                         │
│                  │ Aegis Runtime   │                         │
│                  └────────┬────────┘                         │
│                           │                                  │
│                ┌──────────▼──────────┐                       │
│                │ React Reconciler    │                       │
│                └──────────┬──────────┘                       │
│                           │                                  │
│                ┌──────────▼──────────┐                       │
│                │ Aegis Renderer      │                       │
│                └──────────┬──────────┘                       │
│                           │                                  │
│                ┌──────────▼──────────┐                       │
│                │ Protocol Layer      │                       │
│                └─────────────────────┘                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

# 8.1 应用加载架构（Container + Adapter）

Host 不直接加载应用代码。它通过 **Container** 和 **Adapter** 两层抽象完成加载。

### 加载流程

```text
业务程序
  │
  ▼
Host.createContainer(config)
  │
  ▼
Container
  │
  ├── 1. Adapter.load()          获取应用代码
  │     ├── LocalPackageAdapter   本地 .aegis 包
  │     ├── RemoteURLAdapter     远程 URL（HTTPS）
  │     └── FileSystemAdapter    文件系统路径
  │
  ├── 2. Worker 创建              隔离执行环境
  │
  ├── 3. Context 注入             沙箱化全局对象
  │     ├── 替换 self.postMessage  → 拦截
  │     ├── 替换 self.close       → 拦截
  │     ├── 注入 __aegis_protocol  → 内部通信通道（用户不可见）
  │     ├── 注入 __aegis_capability → 内部能力通道（用户不可见）
  │     └── 注入 __aegis_resource   → 内部资源追踪（用户不可见）
  │
  └── 4. 加载用户代码              执行应用入口（通过 SDK hooks 交互）
```

### Container 生命周期

```text
Host.createContainer()
  → Container 初始化
    → Adapter.load() 获取代码
    → Worker 创建
    → Context 注入
    → 用户代码加载
  → Container 运行中
    → Protocol 消息交换
    → 能力请求/授权
    → 资源监控
  → Container.destroy()
    → 终止 Worker
    → 撤销所有能力
    → 清理资源
```

### Adapter 接口

```typescript
interface AegisAdapter {
  /** 加载应用代码 */
  load(config: LoadConfig): Promise<PackageCode>;
  /** 检查是否支持该来源 */
  supports(source: AppSource): boolean;
  /** 卸载/清理 */
  unload(): Promise<void>;
}

interface PackageCode {
  /** 应用入口代码 */
  entryCode: string;
  /** 清单 */
  manifest: AppManifest;
  /** 依赖代码（如有） */
  modules?: Map<string, string>;
  /** 签名信息 */
  signature?: SignatureInfo;
}
```

### 三种 Adapter

```text
┌─────────────────────────────────────────────┐
│ LocalPackageAdapter                          │
│                                              │
│  source: "./my-app.aegis"                   │
│  流程: 读取包 → 验证签名 → 解压 → 返回代码   │
│                                              │
├─────────────────────────────────────────────┤
│ RemoteURLAdapter                             │
│                                              │
│  source: "https://cdn.example.com/app.aegis"│
│  流程: HTTPS 获取 → 验证签名 → 缓存 → 返回  │
│                                              │
├─────────────────────────────────────────────┤
│ FileSystemAdapter                            │
│                                              │
│  source: "/path/to/app/"                    │
│  流程: 读取目录 → 加载入口文件 → 返回代码     │
│  用途: 本地开发调试                          │
│                                              │
└─────────────────────────────────────────────┘
```

### Context 注入机制

Worker 创建后，Host 在执行用户代码之前注入受限上下文。这是安全的关键环节：

```text
Worker 全局作用域
  │
  ├── 原生 API        ← 被替换或移除
  │   self.postMessage  → 拦截（通过内部 Protocol 通道）
  │   self.close        → 拦截
  │   importScripts     → 拦截
  │   fetch             → 拦截（通过 Capability）
  │   XMLHttpRequest    → 移除
  │
  ├── 注入的内部通道   ← 框架 SDK 内部使用，用户不可见
  │   __aegis_protocol  → Protocol Client（仅 Reconciler / SDK 内部调用）
  │   __aegis_capability → Capability Client（仅 SDK hooks 内部调用）
  │   __aegis_resource   → Resource Tracker（仅 SDK 内部调用）
  │
  └── 用户代码         ← 通过框架 SDK（hooks / components）与外界交互
```

关键设计原则：

> **用户永远不直接调用 Protocol API。**
> **用户通过 React Hooks 和 SDK 组件间接通信。**
> **用户无法伪造 Protocol 消息。**

用户只看到框架 SDK：

```jsx
// 用户代码 — 使用 React Hooks
const [count, setCount] = useState(0)
const { data } = useAegisStorage('my-key')
const camera = useAegisCapability('camera')
```

SDK 内部（用户不可见）：

```text
useAegisStorage('my-key')
  → 内部调用 __aegis_protocol.sendMessage('storage:get', { key })
  → Host 验证 → 执行 → 返回结果

useAegisCapability('camera')
  → 内部调用 __aegis_capability.request('camera')
  → Host 决定 ALLOW / DENY / PROMPT
```

用户无法绕过：

```text
// 用户代码
self.postMessage({ type: 'capability:grant', ... })
// ↑ TypeError: self.postMessage is not a function

__aegis_protocol.sendMessage('capability:grant', ...)
// ↑ TypeError: __aegis_protocol is not defined（用户作用域中不存在）
```

---

# 9. React 兼容性

Aegis 不重新实现 React。

目标架构：

```text
React
 │
 ├── Fiber
 ├── Hooks
 ├── Context
 ├── Scheduler
 └── Reconciler
          │
          ▼
   Aegis Host Config
          │
          ▼
   Aegis Renderer
```

Aegis 负责：

```text
Worker Runtime
Renderer
Protocol
Capabilities
Security
```

React 负责：

```text
Component
Hooks
State
Context
Fiber
Reconciliation
```

这使 Aegis 可以最大程度复用 React 生态。

---

# 10. React 生态兼容等级

### Level 1：直接兼容

目标：

```text
React
React Hooks
Context
Redux
Zustand
Jotai
TanStack Query
```

它们主要运行在 Worker 中。

---

### Level 2：Adapter 兼容

例如：

```text
React Router
React Hook Form
Animation libraries
```

提供：

```text
@aegis/adapter-*
```

---

### Level 3：Aegis Native UI

对于强依赖 DOM 的 UI 库：

```text
Ant Design
MUI
Chakra
```

不追求直接兼容。

而是提供：

```text
@aegis/ui
```

例如：

```jsx
import {
  View,
  Text,
  Button,
  Input
} from "@aegis/ui"
```

---

# 11. JSX

JSX 是 Aegis 的推荐 UI 描述语言。

例如：

```jsx
function App() {
  const [count, setCount] = useState(0)

  return (
    <View>
      <Text>
        Count: {count}
      </Text>

      <Button
        onClick={() => setCount(c => c + 1)}
      >
        +
      </Button>
    </View>
  )
}
```

JSX 完全运行在 Worker。

JSX 本身并不意味着：

```text
DOM
```

而是：

```text
JSX
 ↓
React Element
 ↓
React Fiber
 ↓
Aegis Renderer
```

---

# 12. UI 协议

UI 协议是 Aegis 的核心安全边界之一。

Worker 不允许直接调用：

```js
document.createElement()
```

而是产生：

```text
CREATE_NODE
SET_PROPERTY
SET_TEXT
APPEND_CHILD
REMOVE_CHILD
```

例如：

```json
{
  "version": 1,
  "type": "commit",
  "mutations": [
    {
      "op": "create",
      "nodeId": 1,
      "kind": "view"
    },
    {
      "op": "create",
      "nodeId": 2,
      "kind": "text"
    },
    {
      "op": "setText",
      "nodeId": 2,
      "value": "Hello"
    },
    {
      "op": "append",
      "parent": 1,
      "child": 2
    }
  ]
}
```

---

# 13. 协议校验

Main Thread **永远不信任 Worker 消息**。

每一条 Mutation 必须经过：

```text
Decode
 ↓
Schema Validation
 ↓
App Ownership Validation
 ↓
Node Validation
 ↓
Property Validation
 ↓
Resource Validation
 ↓
Apply
```

例如：

```text
SET_PROPERTY
```

Host 检查：

```text
node 是否存在？
node 是否属于当前 App？
property 是否允许？
value 类型是否正确？
value 大小是否超限？
```

---

# 14. 节点命名空间

所有 UI Node 都属于某个 Application。

逻辑上：

```text
App A
 ├── Node 1
 ├── Node 2
 └── Node 3

App B
 ├── Node 1
 ├── Node 2
 └── Node 3
```

内部使用：

```text
A:1
A:2
A:3

B:1
B:2
B:3
```

因此：

> **UI Node 永远不能跨 Application 使用。**

---

# 15. 事件协议

事件方向：

```text
Main
 ↓
DOM / Native Event
 ↓
Event Dispatcher
 ↓
Worker
```

Worker 不直接获得真实 Event Object。

例如：

```json
{
  "type": "event",
  "nodeId": 20,
  "event": "click",
  "handlerId": 100
}
```

事件 Payload：

```ts
interface AegisEvent {
  type: string
  target: NodeId
  currentTarget: NodeId

  value?: string
  checked?: boolean

  clientX?: number
  clientY?: number

  key?: string
}
```

---

---

[↑ 返回 Aegis 设计索引](../SKILL.md) · [← 上一篇](./foundation-security-model.md) · [下一篇 →](./capabilities-package-security.md)
