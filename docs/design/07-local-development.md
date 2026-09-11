# 07. Local Development Guide

[返回技能索引](../../.agents/skills/aegis-design-index/SKILL.md)

本仓库当前处于 **design-first** 阶段。当前仓库内容主要是架构设计文档，尚未包含 `# 44. 项目结构` 中描述的完整实现目录。

## 当前仓库状态

- 当前仓库的主入口是 `/home/runner/work/Aegis/Aegis/.agents/skills/aegis-design-index/SKILL.md`
- 详细设计已经按主题拆分到 `docs/design/`
- 目前更适合先完成文档拆解、概念校准、模块边界确认，再逐步落地代码

## 推荐阅读顺序

1. `docs/design/01-foundation-and-security-model.md`
2. `docs/design/02-runtime-architecture-and-protocol.md`
3. `docs/design/03-capabilities-and-package-security.md`
4. `docs/design/04-renderer-and-react-lifecycle.md`
5. `docs/design/05-dataflow-performance-and-tooling.md`
6. `docs/design/06-roadmap-and-vision.md`

如果你的目标是补充本地开发体验，应优先阅读：

- `docs/design/05-dataflow-performance-and-tooling.md`：理解 DevTools、项目结构和调试面
- `docs/design/06-roadmap-and-vision.md`：确认当前阶段应该先做什么、不应该先做什么

## 按任务选读

### 安全模型与边界

阅读：

- `docs/design/01-foundation-and-security-model.md`
- `docs/design/03-capabilities-and-package-security.md`

适合任务：

- 定义 trusted / untrusted boundary
- 增加 capability policy
- 设计资源限制与拒绝策略

### Runtime / Protocol

阅读：

- `docs/design/02-runtime-architecture-and-protocol.md`
- `docs/design/05-dataflow-performance-and-tooling.md`

适合任务：

- 定义 UI protocol / event protocol
- 调整 worker 与 host 的消息边界
- 规划调试与协议观测能力

### Renderer / React 兼容

阅读：

- `docs/design/02-runtime-architecture-and-protocol.md`
- `docs/design/04-renderer-and-react-lifecycle.md`

适合任务：

- 设计 JSX 运行模型
- 设计 reconciler / host-config 接口
- 明确 ref、layout、lifecycle 的兼容边界

### 路线图与范围控制

阅读：

- `docs/design/06-roadmap-and-vision.md`

适合任务：

- 判断某个能力是否属于 MVP
- 决定当前阶段要不要引入 package / signing / multi-app

## 本地开发建议

在实现尚未完整落地前，本地开发建议遵循以下顺序：

1. 先确认本次改动属于哪一个设计模块
2. 只加载与该模块直接相关的文档，避免同时展开整个白皮书
3. 如果改动涉及安全边界，先回看 foundation 与 capability 模块
4. 如果改动涉及可运行原型，先以 `# 45. MVP` 的最小链路为范围约束
5. 如果需要补目录结构，优先参考 `# 44. 项目结构`，不要先发散到完整平台能力

## 从设计到实现的映射

`docs/design/05-dataflow-performance-and-tooling.md` 中已经给出推荐目录结构：

- `packages/runtime/`：Worker、调度、生命周期
- `packages/react/`：reconciler、host-config
- `packages/protocol/`：UI / event / capability protocol
- `packages/security/`：policy、permission、validation
- `packages/capabilities/`：network、storage 等能力实现
- `packages/renderer/`：DOM、miniapp、native renderer
- `packages/ui/`：基础 UI primitive
- `packages/devtools/`：运行时与安全观测
- `apps/host/`、`apps/playground/`、`apps/inspector/`：宿主、演示、调试入口

当前这些路径更多是**设计目标**而不是现状，因此本地开发的第一步仍然应该是先确认模块边界，再决定具体落地目录。
