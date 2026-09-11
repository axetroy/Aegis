---
name: aegis-design-index
description: Aegis 设计文档的总索引技能。当任务需要架构背景、安全边界、协议设计、路线图范围判断或本地开发指引时使用；应立即路由到最小且最相关的设计模块。
---

# Aegis 设计索引

这个技能是 Aegis 设计文档的规范入口。它是一个路由型技能：当更窄的模块已经足够回答问题时，不要重复展开整份白皮书。

仓库内发现入口：

- [`aegis-design-index/SKILL.md`](./SKILL.md)

详细设计模块位于这个技能包内的 [`references/README.md`](./references/README.md)。

## 技能包地图

| 模块 | 关注点 | 链接 |
| --- | --- | --- |
| 01 | 摘要、定位、威胁模型、安全模型、边界 | [基础与安全模型](./references/foundation-security-model.md) |
| 02 | 总体架构、React 兼容、JSX、UI / 事件协议 | [运行时架构与协议](./references/runtime-architecture-protocol.md) |
| 03 | 能力、清单、权限策略、资源限制、包安全 | [能力与包安全](./references/capabilities-package-security.md) |
| 04 | 应用身份、签名、渲染器、UI 原语、生命周期 | [渲染器与 React 生命周期](./references/renderer-react-lifecycle.md) |
| 05 | 数据流、交互流程、性能、开发者工具、项目结构 | [数据流、性能与工具](./references/dataflow-performance-tooling.md) |
| 06 | MVP、阶段路线图、产品模型、核心抽象、愿景 | [路线图与愿景](./references/roadmap-vision.md) |
| 07 | 本地开发与阅读导航 | [本地开发指南](./references/local-development.md) |

## 推荐阅读路径

- 初次理解 Aegis：[`01`](./references/foundation-security-model.md) → [`02`](./references/runtime-architecture-protocol.md) → [`03`](./references/capabilities-package-security.md) → [`04`](./references/renderer-react-lifecycle.md) → [`05`](./references/dataflow-performance-tooling.md) → [`06`](./references/roadmap-vision.md)
- 想知道如何在当前仓库开展工作：先看 [本地开发指南](./references/local-development.md)
- 只需要某一类上下文：直接跳到对应模块，不要展开全部文档

## 路由规则

优先选择第一个匹配的模块；只有当任务跨越边界时，才同时加载相邻模块。

- 威胁模型、可信边界、为什么 UI 保持在主线程 -> [基础与安全模型](./references/foundation-security-model.md)
- 工作线程 / 宿主架构、JSX、UI 协议、事件协议 -> [运行时架构与协议](./references/runtime-architecture-protocol.md)
- 清单、能力策略、存储、网络、隔离、包安全 -> [能力与包安全](./references/capabilities-package-security.md)
- 应用身份、代码签名、渲染器设计、布局、引用、生命周期 -> [渲染器与 React 生命周期](./references/renderer-react-lifecycle.md)
- 数据流、交互流程、性能、开发者工具、项目结构 -> [数据流、性能与工具](./references/dataflow-performance-tooling.md)
- MVP 范围、阶段规划、产品模型、核心抽象、最终愿景 -> [路线图与愿景](./references/roadmap-vision.md)
- 阅读顺序、仓库状态、以设计为先阶段下的本地开发 -> [本地开发指南](./references/local-development.md)

## 首次处理流程

1. 先判断任务属于安全、协议、渲染、路线图，还是贡献者上手。
2. 打开覆盖该主题的最小模块。
3. 当任务关注如何阅读仓库、从哪里开始、或如何在当前以设计为先状态下推进本地工作时，优先使用 [本地开发指南](./references/local-development.md)。
4. 当需要查看总览时，返回这个技能文件。

## 输出期望

- 把这个技能当作路由器，而不是设计事实本身。
- 优先给出能直接回答问题的模块文件路径。
- 如果请求横跨多个模块，只列出最小必要集合，不要展开整套语料。
