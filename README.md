# Aegis

![CI](https://github.com/axetroy/Aegis/actions/workflows/ci.yml/badge.svg)

**让不受信任的代码构建 UI，但永远不能拥有宿主。**

Aegis 是一个安全的应用运行时，允许第三方代码在隔离的环境中运行，同时提供完整的 React 开发体验。

## 核心特性

- 🔒 **安全隔离** - Worker 执行隔离，应用代码无法访问宿主 API
- ⚛️ **React 兼容** - 完整支持 JSX、Hooks、组件生命周期
- 🎯 **UI Protocol** - 定义清晰的 UI 通信协议
- 📦 **能力系统** - 显式的权限控制和资源限制
- 🛡️ **事件隔离** - 事件处理在安全边界内进行

## 当前进度

| 阶段 | 状态 | 说明 |
|------|------|------|
| 阶段一：MVP | ✅ 完成 | React → Worker → Renderer → DOM 完整链路，8 个核心包 |
| 阶段二：能力与权限 | ✅ 完成 | PermissionManager、Storage/Network 能力、Input/Form/ScrollView/List、hooks |
| 阶段三：应用包与签名 | ✅ 完成 | .aegis 格式、Manifest、签名、模块加载器 |
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
│   └── playground/     # 演示应用
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

# 启动演示应用
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

1. **应用代码不可信** - 所有第三方代码都被视为不受信任
2. **Worker 提供执行隔离** - 应用在 Worker 中运行，无法访问主线程
3. **应用永远不接触真实 DOM** - 通过 UI Protocol 通信
4. **能力默认拒绝** - 所有权限都需要显式授权
5. **资源使用有界** - CPU、内存等资源受到限制

## 路线图

- [x] **阶段一：MVP** - 验证核心架构链路
- [x] **阶段二：能力与权限** - 增加完整的 Hooks 支持和能力系统
- [x] **阶段三：应用包与签名** - 形成真正的 .aegis 应用格式
- [ ] **阶段四：平台与生态** - 构建完整的多应用平台

详见 [ROADMAP.md](./ROADMAP.md)

## 文档

- [设计文档](./.agents/skills/aegis-design-index/SKILL.md)
- [路线图与愿景](./.agents/skills/aegis-design-index/references/roadmap-vision.md)
- [本地开发指南](./.agents/skills/aegis-design-index/references/local-development.md)

## 许可证

MIT
