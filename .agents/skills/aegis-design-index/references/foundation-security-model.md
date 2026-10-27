# 基础与安全模型

[↑ 返回 Aegis 设计索引](../SKILL.md) · [下一篇 →](./runtime-architecture-protocol.md)

包含摘要、项目定位、核心问题、威胁模型、安全模型、可信边界，以及为什么 UI 保持在主线程。

---

# Aegis 架构白皮书

### 基于 Capability 的 Worker 隔离安全 UI 运行时

**项目：**Aegis
**版本：**1.0
**状态：**架构提案

# 1. 摘要

Aegis 是一个面向**不受信任应用**的安全 UI 运行时。

Aegis 允许第三方开发者使用熟悉的：

- React
- JSX
- Hooks
- Component
- State Management

开发应用，同时将应用代码运行在隔离的 Worker 环境中。

应用无法直接访问宿主环境的：

- DOM
- Native UI
- 文件系统
- 摄像头
- 麦克风
- 网络
- Storage
- Clipboard
- 系统能力

所有与宿主的交互必须通过 Aegis 定义的：

1. **UI 协议**
2. **能力协议**
3. **资源策略**

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

# 1.1 应用加载流程

应用从外部世界进入 Aegis 运行时，需要经过一条明确的加载路径：

```text
业务程序
  │
  ▼
Host 创建 Container（容器）
  │
  ▼
Container 通过 Adapter 加载应用
  │  ├─ LocalPackageAdapter   本地 .aegis 包
  │  ├─ RemoteURLAdapter     远程 URL
  │  └─ FileSystemAdapter    文件系统
  │
  ▼
Host 创建 Worker module
  │
  ▼
转移私有 MessagePort 给 bootstrap
  │
  ▼
导入 Host 提供的可信 SDK ESM
  │  └─ 在模块闭包中初始化 Protocol Client
  │
  ▼
作为独立 ESM 加载用户入口
  │
  ▼
应用运行
```

### Container（容器）

Container 是 Host 为每个应用创建的隔离执行环境。一个 Container 管理一个应用的完整生命周期：

```text
Container
  ├── Worker 进程        隔离执行
  ├── PermissionManager  权限管理
  ├── ResourceTracker    资源追踪
  ├── ProtocolBridge     协议桥接
  └── Adapter            应用来源
```

### Adapter（适配器）

Adapter 负责从不同来源获取应用代码。Host 不直接加载代码，而是委托给 Adapter：

```text
┌──────────────────────────────────────┐
│              Adapter 接口             │
│                                      │
│  load(config): Promise<PackageCode>  │
│                                      │
├──────────────┬──────────────┬────────┤
│ LocalPackage │  RemoteURL   │  FS    │
│ Adapter      │  Adapter     │Adapter │
├──────────────┼──────────────┼────────┤
│ .aegis 包    │  远程 URL    │ 文件系统│
│ 签名验证     │  HTTPS       │ 本地路径│
│ 哈希校验     │  缓存        │  监听   │
└──────────────┴──────────────┴────────┘
```

### Context 注入（上下文沙箱）

Worker 创建后，Host 不直接运行用户代码。而是先注入受限上下文：

```text
Worker bootstrap 接收的上下文：
  ├── 转移的 MessagePort  Host / Worker 私有桥接通道
  ├── 宿主可信 SDK ESM    模块闭包持有协议客户端
  └── 独立应用 ESM        只能访问 SDK 导出的公开 API
```

用户通过框架 SDK（React Hooks / 组件）间接交互，无法直接访问 Protocol：

```text
用户看到的（SDK 提供）：
  useState / useEffect / useCallback
  useAegisStorage(key)
  useAegisCapability(name)
  useAegisNetwork(config)
  <AegisView> / <AegisText> / <AegisButton>

用户看不到的（框架内部）：
  Protocol Client                     ← SDK 模块闭包状态，不是 Worker 全局属性
  self.postMessage(...)               ← 不会被 Host 的协议处理器接收
  window / document                   ← Worker 中不存在
```

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
fetch('https://attacker.example');
```

### 非授权数据访问

```js
readOtherAppStorage();
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

# 6. 可信 / 不可信边界

Aegis 将整个系统分成两个区域。

## 可信区域

```text
Host
Main Renderer
Capability Manager
Permission Manager
Resource Manager
Native APIs
```

## 不可信区域

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

# 7. 为什么 UI 在主线程？

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

---

[↑ 返回 Aegis 设计索引](../SKILL.md) · [下一篇 →](./runtime-architecture-protocol.md)
