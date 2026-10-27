# Aegis 实现路线图

## 项目概述

Aegis 是一个安全的应用运行时，允许不受信任的代码构建 UI，但永远不能拥有宿主。它基于 React + JSX 开发体验，同时提供隔离、权限、资源控制和可验证的安全边界。

核心价值：

> **Aegis —— 让不受信任的代码构建 UI，但永远不能拥有宿主。**

---

## 阶段规划

### 阶段一：MVP（最小可行产品）

**目标：** 验证核心架构链路：Container → `.aegis` package → Worker → trusted SDK → React → private MessagePort → Host Renderer → DOM

**验证范围：**

- JSX 支持
- React 运行时
- Worker 执行隔离
- Container 容器隔离
- Adapter 代码加载
- Context 注入（Worker bootstrap 与模块私有协议通道）
- useState Hook
- UI Protocol 通信
- Main Renderer 渲染
- Event Protocol 事件处理
- Node Isolation 节点隔离
- SDK-only 通信（应用只能导入宿主提供的公开 SDK；协议通道不暴露为 Worker 全局对象）

**实现步骤：**

#### 1.1 项目初始化

- [x] 创建 monorepo 项目结构
- [x] 配置 pnpm workspace
- [x] 设置 TypeScript 配置
- [x] 配置 ESLint + Prettier

#### 1.2 核心包实现

- [x] `packages/protocol` - UI/事件协议定义
- [x] `packages/runtime` - Worker 运行时基础
- [x] `packages/container` - Worker 容器、私有消息通道和上下文注入
- [x] `packages/adapter` - 应用包提取与代码加载
- [x] `packages/react` - React Reconciler 集成
- [x] `packages/renderer` - DOM 渲染器
- [x] `packages/ui` - 基础 UI 原语（View, Text, Button）

模块加载器属于阶段三；阶段一 Playground 从 `.aegis` 包读取入口并在 Worker 模块中运行。

#### 1.3 演示应用

- [x] `apps/playground` - `.aegis` React 计数器与容器宿主
- [x] `apps/host` - 宿主环境演示

#### 1.4 测试验证

- [x] 单元测试覆盖核心模块
- [x] 集成测试验证 React UI 协议与事件闭环
- [x] 性能基准测试

Playground 的真实 Worker 包加载路径另以浏览器烟测验证；`tests/integration.test.ts` 是协议级测试，不单独代表浏览器 Worker 的端到端覆盖。

**交付物：**

```jsx
// 开发者可以编写这样的代码
function App() {
  const [count, setCount] = useState(0);

  return (
    <View>
      <Text>{count}</Text>
      <Button onClick={() => setCount((c) => c + 1)}>+</Button>
    </View>
  );
}
```

**验收标准：**

- ✓ JSX 语法支持
- ✓ React 组件渲染
- ✓ Worker 中执行应用代码
- ✓ Container 隔离执行环境
- ✓ Adapter 加载应用代码
- ✓ Context 注入 Worker bootstrap 与私有 MessagePort
- ✓ useState 状态管理
- ✓ UI Protocol 消息传递（宿主提供的 ESM SDK 通过私有 `MessagePort` 桥接）
- ✓ 主线程 DOM 渲染
- ✓ 事件处理闭环
- ✓ 节点隔离验证
- ✓ 应用 Worker 全局对象不暴露协议通道；SDK bootstrap 在应用模块加载前初始化私有通道

---

### 阶段二：能力与权限

**目标：** 增加完整的 React Hooks 支持、表单处理、存储和网络能力，并验证能力系统

**增加功能：**

- useEffect Hook
- useRef Hook
- Context API
- Input 组件
- Form 组件
- Storage 能力
- Network 能力

**验证范围：**

- Capability 能力系统
- Permission 权限控制
- Resource Limits 资源限制

**实现步骤：**

#### 2.1 React Hooks 扩展

- [x] 实现 useEffect Hook
- [x] 实现 useRef Hook
- [x] 实现 Context Provider/Consumer

#### 2.2 UI 组件扩展

- [x] Input 组件（受控/非受控）
- [x] Form 组件与表单状态管理
- [x] ScrollView 组件
- [x] List/FlatList 组件

#### 2.3 能力系统实现

- [x] `packages/capabilities` - 能力实现
  - [x] Storage 能力（localStorage/sessionStorage）
  - [ ] Host 代理网络 transport（策略与请求 API 已有，实际传输未接入）
  - [ ] Camera 能力实现（当前仅为接口占位）
  - [ ] Location 能力实现（当前仅为接口占位）

#### 2.4 安全策略

- [x] `packages/security` - 安全策略
  - [x] 能力清单定义
  - [x] 权限验证逻辑
  - [x] 资源限制配置
  - [x] 请求拦截与过滤

#### 2.5 能力 UI

- [x] 权限请求弹窗
- [x] 能力状态展示
- [x] 用户授权流程

**验收标准：**

- ✓ useEffect 正确执行副作用
- ✓ useRef 引用管理
- ✓ Context 跨组件状态共享
- ✓ Input 输入处理
- ✓ Form 表单提交
- ✓ Storage 读写操作
- ✓ Network 请求发送
- ✓ 能力权限控制生效
- ✓ 资源限制生效

---

### 阶段三：应用包与签名

**目标：** 形成真正的 .aegis 应用格式，支持应用身份、签名和模块加载

**增加功能：**

- Package 应用包格式
- Manifest 应用清单
- App Identity 应用身份
- Signature 代码签名
- Module Loader 模块加载器

**实现步骤：**

#### 3.1 应用包格式

- [x] 定义 .aegis 包格式规范
- [x] 实现包打包工具
- [x] 实现包解析器
- [x] 包完整性校验

#### 3.2 应用清单

- [x] Manifest schema 定义
- [x] 必需字段（id, name, version, permissions）
- [x] 可选字段（icons, description, dependencies）
- [x] 清单验证逻辑

#### 3.3 应用身份

- [x] 应用 ID 生成与管理
- [x] 命名空间隔离
- [x] 身份证书体系

#### 3.4 代码签名

- [x] 密钥对生成
- [x] 签名算法实现
- [x] 签名验证流程
- [x] 证书链管理

#### 3.5 模块加载器

- [ ] 动态模块加载（当前已有基础 `AegisModuleLoader`，尚未接入 Worker 应用启动路径）
- [ ] 依赖解析
- [ ] Worker 沙箱执行
- [ ] 模块缓存

**交付物：**

```bash
# 应用打包
aegis build ./my-app

# 应用安装
aegis install my-app.aegis

# 应用运行
aegis run my-app
```

**验收标准：**

- ✓ .aegis 包格式正确
- ✓ Manifest 解析成功
- ✓ 应用身份唯一
- ✓ 签名验证通过
- ✓ 模块加载正确
- ✓ 沙箱隔离生效

---

### 阶段四：平台与生态

**目标：** 构建完整的多应用平台，支持应用生命周期、应用商店和开发者工具

**增加功能：**

- Multi-App 多应用管理
- App Lifecycle 应用生命周期
- App Store 应用商店
- Capability UI 能力管理界面
- DevTools 开发者工具
- Crash Recovery 崩溃恢复

**实现步骤：**

#### 4.1 多应用管理

- [ ] 应用实例管理
- [ ] 应用间通信机制
- [ ] 资源共享与隔离
- [ ] 应用切换

#### 4.2 应用生命周期

- [ ] 安装 → 启用 → 运行 → 暂停 → 卸载
- [ ] 生命周期钩子
- [ ] 状态持久化
- [ ] 后台运行支持

#### 4.3 应用商店

- [ ] 应用发布流程
- [ ] 应用搜索与发现
- [ ] 应用评价系统
- [ ] 版本管理

#### 4.4 能力管理 UI

- [ ] 已授权能力展示
- [ ] 权限修改界面
- [ ] 能力使用统计
- [ ] 安全审计日志

#### 4.5 开发者工具

- [ ] 组件树检查
- [ ] 状态调试
- [ ] 协议消息查看
- [ ] 性能分析
- [ ] 安全事件监控

#### 4.6 崩溃恢复

- [ ] 错误边界实现
- [ ] 状态快照
- [ ] 自动恢复机制
- [ ] 崩溃报告

**最终架构：**

```
Aegis Host
│
├── App A
├── App B
├── App C
└── App D
```

**验收标准：**

- ✓ 多应用同时运行
- ✓ 应用生命周期管理
- ✓ 应用商店功能完整
- ✓ 能力管理界面可用
- ✓ 开发者工具正常
- ✓ 崩溃恢复机制生效

---

## 技术栈

- **语言：** TypeScript
- **包管理：** pnpm (monorepo)
- **构建工具：** Vite + Rollup
- **测试框架：** Vitest + Testing Library
- **代码规范：** ESLint + Prettier
- **React 版本：** React 18+
- **目标环境：** Browser (Web)

---

## 项目结构

```
aegis/
│
├── packages/
│   ├── runtime/          # Worker 运行时、调度、生命周期
│   ├── container/        # 容器核心、上下文注入、沙箱化
│   ├── adapter/          # Adapter 接口、本地/远程/文件系统适配器
│   ├── loader/           # 模块加载器
│   ├── react/            # Reconciler、host-config
│   ├── protocol/         # UI / 事件 / 能力协议（内部 __aegis_*，用户不可见）
│   ├── security/         # Policy、permission、validation
│   ├── capabilities/     # 网络、存储等能力实现
│   ├── renderer/         # DOM 渲染器
│   ├── ui/               # 基础 UI 原语
│   ├── devtools/         # 开发者工具
│   └── packager/         # 打包工具
│
├── apps/
│   ├── host/             # 宿主环境
│   └── playground/       # 开发调试
│
├── scripts/
│   └── aegis-build.ts    # 构建脚本
│
└── tests/
    ├── integration.test.ts  # 集成测试
    └── benchmark.test.ts    # 性能测试
```

---

## 安全原则

1. Application code is untrusted.（应用代码不可信）
2. Worker provides execution isolation.（Worker 提供执行隔离）
3. Worker is not the sole security boundary.（Worker 不是唯一安全边界）
4. Application never receives real DOM or Native objects.（应用永远不接触真实 DOM）
5. All Host interaction happens through SDK (hooks / components), never through raw Protocol API.（所有交互通过 SDK，不通过原始 Protocol API）
6. Users cannot forge Protocol messages — they have no access to the internal Protocol channel.（用户无法伪造 Protocol 消息）
7. Capabilities are explicit and deny-by-default.（能力默认拒绝）
8. Every Application has isolated UI and storage namespaces.（每个应用有独立的 UI 和存储命名空间）
9. Host validates every message from Worker.（宿主验证所有消息）
10. Resource usage is bounded.（资源使用有界）
11. Capability lifetime follows Application lifetime.（能力生命周期跟随应用生命周期）
12. React is an implementation detail, not a guarantee.（React 是实现细节，不是保证）

---

## 当前状态

**阶段一** - ✅ MVP 原型链路已贯通
**阶段二至阶段三** - 🟡 部分完成

Playground 已通过 `.aegis` 包启动 React Worker 计数器；Host 与 Worker 通过转移的 `MessagePort` 通信，React 协议客户端保存在独立 SDK ESM 模块作用域内。阶段二仍缺 Host 网络 transport、Camera/Location 实现；阶段三的基础 loader 尚未集成到应用启动及完整依赖解析流程。阶段四暂不属于当前实现范围。

阶段一勾选项表示原型链路和目标测试已实现；这不代表完整生产级安全边界已经审计或所有资源限制都已强制执行。

### 进度更新

#### 1.1 项目初始化 ✅

- [x] 创建 monorepo 项目结构
- [x] 配置 pnpm workspace
- [x] 设置 TypeScript 配置
- [x] 配置 ESLint + Prettier

#### 1.2 核心包实现 ✅

- [x] `packages/protocol` - UI/事件协议定义
- [x] `packages/runtime` - Worker 运行时基础
- [x] `packages/container` - Worker 容器与上下文注入
- [x] `packages/adapter` - 应用包加载
- [x] `packages/react` - React Reconciler 集成
- [x] `packages/renderer` - DOM 渲染器
- [x] `packages/ui` - 基础 UI 原语（View, Text, Button）

#### 1.3 演示应用 ✅

- [x] `apps/playground` - 计数器演示应用
- [x] `apps/host` - 宿主环境

#### 1.4 测试验证 ✅

- [x] 单元测试覆盖核心模块
  - `packages/protocol/src/ui.test.ts` - UI 协议测试
  - `packages/protocol/src/event.test.ts` - 事件协议测试
  - `packages/ui/src/components/components.test.tsx` - UI 组件测试
  - `packages/renderer/src/dom-renderer.test.ts` - 渲染器测试
  - `packages/runtime/src/worker-runtime.test.ts` - 运行时测试
  - `packages/react/src/host-config.test.ts` - React Host Config 测试
- [x] 集成测试验证完整链路
  - `tests/integration.test.ts` - 完整数据流测试
- [x] 性能基准测试
  - `tests/benchmark.test.ts` - 性能基准测试

---

_最后更新：2026年_
