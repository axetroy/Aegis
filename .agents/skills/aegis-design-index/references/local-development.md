# 本地开发指南

[↑ 返回 Aegis 设计索引](../SKILL.md) · [← 上一篇](./roadmap-vision.md)

本仓库当前处于 **以设计为先** 阶段。当前仓库内容主要是架构设计文档，尚未包含 `# 44. 项目结构` 中描述的完整实现目录。

## 当前仓库状态

- 当前仓库的主入口是 [`.agents/skills/aegis-design-index/SKILL.md`](../SKILL.md)
- 详细设计已经按主题拆分到 [Aegis 设计参考索引](./README.md)
- 目前更适合先完成文档拆解、概念校准、模块边界确认，再逐步落地代码

## 推荐阅读顺序

1. [基础与安全模型](./foundation-security-model.md)
2. [运行时架构与协议](./runtime-architecture-protocol.md)
3. [能力与包安全](./capabilities-package-security.md)
4. [渲染器与 React 生命周期](./renderer-react-lifecycle.md)
5. [数据流、性能与工具](./dataflow-performance-tooling.md)
6. [路线图与愿景](./roadmap-vision.md)

如果你的目标是补充本地开发体验，应优先阅读：

- [数据流、性能与工具](./dataflow-performance-tooling.md)：理解开发者工具、项目结构和调试面
- [路线图与愿景](./roadmap-vision.md)：确认当前阶段应该先做什么、不应该先做什么

## 按任务选读

### 安全模型与边界

阅读：

- [基础与安全模型](./foundation-security-model.md)
- [能力与包安全](./capabilities-package-security.md)

适合任务：

- 定义可信 / 不可信边界
- 增加能力策略
- 设计资源限制与拒绝策略

### 运行时 / 协议

阅读：

- [运行时架构与协议](./runtime-architecture-protocol.md)
- [数据流、性能与工具](./dataflow-performance-tooling.md)

适合任务：

- 定义 UI 协议 / 事件协议
- 调整工作线程与宿主之间的消息边界
- 规划调试与协议观测能力

### 渲染器 / React 兼容

阅读：

- [运行时架构与协议](./runtime-architecture-protocol.md)
- [渲染器与 React 生命周期](./renderer-react-lifecycle.md)

适合任务：

- 设计 JSX 运行模型
- 设计协调器 / host-config 接口
- 明确引用、布局、生命周期的兼容边界

### 路线图与范围控制

阅读：

- [路线图与愿景](./roadmap-vision.md)

适合任务：

- 判断某个能力是否属于 MVP
- 决定当前阶段要不要引入打包 / 签名 / 多应用

## 本地开发建议

在实现尚未完整落地前，本地开发建议遵循以下顺序：

1. 先确认本次改动属于哪一个设计模块
2. 只加载与该模块直接相关的文档，避免同时展开整个白皮书
3. 如果改动涉及安全边界，先回看基础与能力模块
4. 如果改动涉及可运行原型，先以 `# 45. MVP` 的最小链路为范围约束
5. 如果需要补目录结构，优先参考 `# 44. 项目结构`，不要先发散到完整平台能力

## 从设计到实现的映射

[数据流、性能与工具](./dataflow-performance-tooling.md) 中已经给出推荐目录结构：

- `packages/runtime/`：工作线程、调度、生命周期
- `packages/react/`：reconciler、host-config
- `packages/protocol/`：UI / 事件 / 能力协议
- `packages/security/`：policy、permission、validation
- `packages/capabilities/`：网络、存储等能力实现
- `packages/renderer/`：DOM、小程序、原生渲染器
- `packages/ui/`：基础 UI 原语
- `packages/devtools/`：运行时与安全观测
- `apps/host/`、`apps/playground/`、`apps/inspector/`：宿主、演示、调试入口

当前这些路径更多是**设计目标**而不是现状，因此本地开发的第一步仍然应该是先确认模块边界，再决定具体落地目录。

---

[↑ 返回 Aegis 设计索引](../SKILL.md) · [← 上一篇](./roadmap-vision.md)
