# Aegis

![CI](https://github.com/axetroy/Aegis/actions/workflows/ci.yml/badge.svg)

**让不受信任的代码构建 UI，但永远不能拥有宿主。**

Aegis 是一个面向安全 UI 运行时的实现原型，包含 Worker、React、协议、能力和应用包等模块；完整的安全应用执行链路仍在开发中。

## 核心特性

- 🔒 **Worker 原型** - 宿主演示在 Worker 中运行手写 UI 树；尚未接入 React 应用运行时或完整能力沙箱
- ⚛️ **React 模块** - 提供 JSX、Hooks 与 reconciler 相关模块，尚未贯通 Worker 到 Host 的 React 渲染链路
- 🎯 **UI Protocol** - 定义清晰的 UI 通信协议
- 📦 **能力系统** - 显式的权限控制和资源限制
- 🛡️ **事件隔离** - 事件处理在安全边界内进行

## 当前进度

| 阶段 | 状态 | 说明 |
|------|------|------|
| 阶段一：MVP | 🟡 部分完成 | Worker UI demo 与独立 React 模块存在，但 React → Worker → Host 尚未端到端连通 |
| 阶段二：能力与权限 | 🟡 部分完成 | 权限与 Storage 已实现；网络 transport 尚未接入 Host，Camera/Location 为接口占位 |
| 阶段三：应用包与签名 | 🟡 部分完成 | .aegis、Manifest 与签名工具已实现；模块加载、依赖解析及沙箱执行尚未实现 |
| 阶段四：平台与生态 | 📋 规划 | 多应用管理、应用商店、DevTools |

## 架构

```
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

## 项目结构

```
aegis/
├── packages/
│   ├── protocol/       # UI/事件/能力协议定义
│   ├── runtime/        # Worker 运行时基础
│   ├── react/          # React Reconciler 集成 + Hooks
│   ├── renderer/       # DOM 渲染器
│   ├── ui/             # UI 原语（View/Text/Button/Input/Form/ScrollView/List）
│   ├── security/       # 权限策略与资源限制
│   └── capabilities/   # 能力实现（Storage/Network/Camera/Location）
│
├── apps/
│   ├── host/           # 宿主环境
│   ├── playground/     # 演示宿主与容器
│   └── counter-app/    # 容器内运行的计数器示例
│
├── tests/              # 集成测试与基准测试
└── .github/workflows/  # CI 配置
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动开发环境

```bash
# 启动宿主环境
pnpm --filter @aegis/host dev

# 启动容器示例（自动构建 .aegis 包）
pnpm --filter @aegis/playground dev
```

### 构建

```bash
pnpm build
```

## 开发者示例

```jsx
import { View, Text, Button } from '@aegis/ui'

function App() {
  const [count, setCount] = useState(0)

  return (
    <View>
      <Text>{count}</Text>
      <Button onClick={() => setCount(c => c + 1)}>
        +
      </Button>
    </View>
  )
}
```

## 安全原则

以下是架构目标，不代表当前版本已完整实现或可作为生产安全边界：

1. **应用代码不可信** - 所有第三方代码都被视为不受信任
2. **Worker 提供执行隔离** - 应用在 Worker 中运行，无法访问主线程
3. **应用永远不接触真实 DOM** - 通过 UI Protocol 通信
4. **能力默认拒绝** - 所有权限都需要显式授权
5. **资源使用有界** - CPU、内存等资源受到限制

## 路线图

- [ ] **阶段一：MVP** - Worker UI 演示已存在，React Worker 闭环待完成
- [ ] **阶段二：能力与权限** - 权限与 Storage 基础已存在，Host 网络 transport 及 Camera/Location 待完成
- [ ] **阶段三：应用包与签名** - 打包签名已存在，模块加载与沙箱执行待完成
- [ ] **阶段四：平台与生态** - 构建完整的多应用平台

详见 [ROADMAP.md](./ROADMAP.md)

## 文档

- [设计文档](./.agents/skills/aegis-design-index/SKILL.md)
- [路线图与愿景](./.agents/skills/aegis-design-index/references/roadmap-vision.md)
- [本地开发指南](./.agents/skills/aegis-design-index/references/local-development.md)

## 许可证

MIT
