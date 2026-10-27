# Aegis

![CI](https://github.com/axetroy/Aegis/actions/workflows/ci.yml/badge.svg)

**让不受信任的代码构建 UI，但永远不能拥有宿主。**

Aegis 是一个面向安全 UI 运行时的实现原型。Playground 已将 `.aegis` 计数器应用装入 Worker，由 React Reconciler 生成 UI 协议消息并在 Host DOM Renderer 中渲染；能力平台和完整生产级安全控制仍在开发中。

## 核心特性

- 🔒 **Worker 容器** - `.aegis` 计数器应用在独立 Worker 中运行，Host 只接收私有 `MessagePort` 上的桥接消息
- ⚛️ **React Worker 渲染** - React、Hooks、JSX 与 Host Renderer 已在 Playground 中串通
- 🎯 **SDK-only UI 通信** - 应用导入宿主提供的 ESM SDK；协议通道不挂到 Worker 全局对象
- 📦 **能力系统** - 显式的权限控制和资源限制
- 🛡️ **事件隔离** - 事件处理在安全边界内进行

## 当前进度

| 阶段                 | 状态          | 说明                                                                            |
| -------------------- | ------------- | ------------------------------------------------------------------------------- |
| 阶段一：MVP          | ✅ 原型已贯通 | `.aegis` React 计数器在 Worker 执行，事件和 UI 更新经 Host Renderer 闭环        |
| 阶段二：能力与权限   | 🟡 部分完成   | 权限与 Storage 已实现；网络 transport 尚未接入 Host，Camera/Location 为接口占位 |
| 阶段三：应用包与签名 | 🟡 部分完成   | .aegis、Manifest 与签名工具已实现；模块加载、依赖解析及沙箱执行尚未实现         |
| 阶段四：平台与生态   | 📋 规划       | 多应用管理、应用商店、DevTools                                                  |

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
        Private MessagePort bridge
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

默认 Playground 运行已打包的 React 计数器应用；点击 `+` 可验证 Worker → Host → DOM 的事件闭环。Host 提供的 `aegis-sdk` ESM bundle 与应用包分开加载，应用代码只导入公开的 React/UI API。

### 构建

```bash
pnpm build
```

## 开发者示例

```jsx
import { View, Text, Button } from '@aegis/ui';
import { useState } from 'react';

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

## 安全原则

以下是架构目标，不代表当前版本已完整实现或可作为生产安全边界：

1. **应用代码不可信** - 所有第三方代码都被视为不受信任
2. **Worker 提供执行隔离** - 应用在 Worker 中运行，无法访问主线程
3. **应用永远不接触真实 DOM** - 通过 UI Protocol 通信
4. **能力默认拒绝** - 所有权限都需要显式授权
5. **资源使用有界** - CPU、内存等资源受到限制

## 路线图

- [x] **阶段一：MVP** - React 应用包、Worker 执行、私有协议桥和 Host 渲染已贯通
- [ ] **阶段二：能力与权限** - 权限与 Storage 基础已存在，Host 网络 transport 及 Camera/Location 待完成
- [ ] **阶段三：应用包与签名** - 打包签名和基础模块加载器已存在；完整依赖解析、安装和沙箱加载流程待完成
- [ ] **阶段四：平台与生态** - 构建完整的多应用平台

详见 [ROADMAP.md](./ROADMAP.md)

## 文档

- [设计文档](./.agents/skills/aegis-design-index/SKILL.md)
- [路线图与愿景](./.agents/skills/aegis-design-index/references/roadmap-vision.md)
- [本地开发指南](./.agents/skills/aegis-design-index/references/local-development.md)

## 许可证

MIT
