# 本地开发指南

[↑ 返回 Aegis 设计索引](../SKILL.md) · [← 上一篇](./roadmap-vision.md)

本仓库处于实现阶段。README 与路线图记录了当前的部分实现：Worker UI 演示、React 与能力模块、Storage、策略和包签名已存在；React Worker 渲染闭环、Host 网络代理、模块加载器及阶段四平台能力仍未完成。

## 当前仓库状态

- 当前仓库的主入口是 [`.agents/skills/aegis-design-index/SKILL.md`](../SKILL.md)
- 详细设计已经按主题拆分到 [Aegis 设计参考索引](./README.md)
- `packages/` 已包含协议、运行时、React、渲染、UI、安全、能力与打包模块；`packages/loader/` 目前仅导出类型
- `apps/` 当前包含宿主和 Playground；React Worker 闭环、Host 网络代理及 Inspector、DevTools、多应用平台尚未落地
- 判断实现范围时，以根目录 [README](../../../README.md) 和 [路线图](../../../ROADMAP.md) 的阶段状态为准

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

推进实现时，本地开发建议遵循以下顺序：

1. 先确认本次改动属于哪一个设计模块
2. 只加载与该模块直接相关的文档，避免同时展开整个白皮书
3. 如果改动涉及安全边界，先回看基础与能力模块
4. 如果改动涉及可运行原型，先以 `# 45. MVP` 的最小链路为范围约束
5. 如果需要扩展目录结构，先检查实际工作区与路线图，不要把最终平台目录误认为当前阶段的必需项

## 从设计到实现的映射

[数据流、性能与工具](./dataflow-performance-tooling.md) 中已经给出推荐目录结构：

- `packages/runtime/`：Worker 运行时、调度、生命周期
- `packages/container/`：容器核心、上下文注入、沙箱化
- `packages/adapter/`：适配器接口、本地包 / 远程 URL / 文件系统适配器
- `packages/loader/`：模块加载器
- `packages/react/`：reconciler、host-config
- `packages/protocol/`：UI / 事件 / 能力协议
- `packages/security/`：permission-manager、policies、types
- `packages/capabilities/`：网络、存储、摄像头、定位
- `packages/renderer/`：DOM 渲染器
- `packages/ui/`：基础 UI 原语
- `packages/devtools/`：运行时与安全观测
- `packages/packager/`：打包工具
- `apps/host/`：Host 应用入口
- `apps/playground/`：开发调试

其中 `runtime`、`react`、`protocol`、`security`、`capabilities`、`renderer`、`ui`、`host` 和 `playground` 已存在；`devtools`、`inspector` 等路径仍属于后续设计目标。

---

[↑ 返回 Aegis 设计索引](../SKILL.md) · [← 上一篇](./roadmap-vision.md)
