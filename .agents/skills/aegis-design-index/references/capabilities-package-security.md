# 能力与包安全

[↑ 返回 Aegis 设计索引](../SKILL.md) · [← 上一篇](./runtime-architecture-protocol.md) · [下一篇 →](./renderer-react-lifecycle.md)

包含 Capability 安全、清单、权限策略、网络 / 存储、隔离、资源限制、Worker 拒绝服务与包安全。

---

# 16. Capability 安全

Aegis 的第二个核心系统是：

# Capability 管理器

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

# 17. 清单

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

# 18. Capability 策略

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

# 20. 网络

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

# 21. 存储

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

# 22. UI 隔离

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

# 23. 资源管理

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

# 24. Worker 拒绝服务

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

# 25. 包安全

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

---

[↑ 返回 Aegis 设计索引](../SKILL.md) · [← 上一篇](./runtime-architecture-protocol.md) · [下一篇 →](./renderer-react-lifecycle.md)
