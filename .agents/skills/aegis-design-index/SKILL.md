---
name: aegis-design-index
description: Umbrella skill for navigating the Aegis design corpus. Use when a task needs architecture context, security boundaries, protocol design, roadmap scoping, or local development guidance; route immediately to the smallest relevant design module.
---

# Aegis Design Index

This skill is the canonical entrypoint for the Aegis design corpus. It replaces the old `DESIGN.md` index and should route the reader to the smallest detailed design module instead of restating the whole architecture whitepaper.

Repository-local discovery entrypoint:

- [`aegis-design-index/SKILL.md`](./SKILL.md)

Primary design modules:

| Module | Focus | Link |
| --- | --- | --- |
| 01 | 摘要、定位、威胁模型、安全模型、边界 | [Foundation and Security Model](../../../docs/design/01-foundation-and-security-model.md) |
| 02 | 总体架构、React 兼容、JSX、UI / Event Protocol | [Runtime Architecture and Protocol](../../../docs/design/02-runtime-architecture-and-protocol.md) |
| 03 | Capability、Manifest、权限策略、资源限制、包安全 | [Capabilities and Package Security](../../../docs/design/03-capabilities-and-package-security.md) |
| 04 | 应用身份、签名、渲染器、UI Primitive、生命周期 | [Renderer and React Lifecycle](../../../docs/design/04-renderer-and-react-lifecycle.md) |
| 05 | 数据流、交互流程、性能、DevTools、项目结构 | [Dataflow, Performance, and Tooling](../../../docs/design/05-dataflow-performance-and-tooling.md) |
| 06 | MVP、阶段路线图、产品模型、核心抽象、愿景 | [Roadmap and Vision](../../../docs/design/06-roadmap-and-vision.md) |
| 07 | 本地开发与阅读导航 | [Local Development Guide](../../../docs/design/07-local-development.md) |

## Recommended reading paths

- 初次理解 Aegis：[`01`](../../../docs/design/01-foundation-and-security-model.md) → [`02`](../../../docs/design/02-runtime-architecture-and-protocol.md) → [`03`](../../../docs/design/03-capabilities-and-package-security.md) → [`04`](../../../docs/design/04-renderer-and-react-lifecycle.md) → [`05`](../../../docs/design/05-dataflow-performance-and-tooling.md) → [`06`](../../../docs/design/06-roadmap-and-vision.md)
- 想知道如何在当前仓库开展工作：先看 [07. Local Development Guide](../../../docs/design/07-local-development.md)
- 只需要某一类上下文：直接跳到对应模块，不要展开全部文档

## Routing rules

Pick the first module that matches and only load adjacent modules when the task crosses boundaries.

- Threat model, trusted boundary, main-thread rationale -> [01. Foundation and Security Model](../../../docs/design/01-foundation-and-security-model.md)
- Worker / host architecture, JSX, UI protocol, event protocol -> [02. Runtime Architecture and Protocol](../../../docs/design/02-runtime-architecture-and-protocol.md)
- Manifest, capability policy, storage, network, isolation, package security -> [03. Capabilities and Package Security](../../../docs/design/03-capabilities-and-package-security.md)
- Application identity, code signing, renderer design, layout, ref, lifecycle -> [04. Renderer and React Lifecycle](../../../docs/design/04-renderer-and-react-lifecycle.md)
- Dataflow, interaction flow, performance, DevTools, project structure -> [05. Dataflow, Performance, and Tooling](../../../docs/design/05-dataflow-performance-and-tooling.md)
- MVP scope, phase planning, product model, core abstraction, final vision -> [06. Roadmap and Vision](../../../docs/design/06-roadmap-and-vision.md)
- Reading order, repo status, documentation-first local development -> [07. Local Development Guide](../../../docs/design/07-local-development.md)

## First-pass workflow

1. Decide whether the task is about security, protocol, renderer, roadmap, or contributor onboarding.
2. Open the narrowest module that covers that topic.
3. Use [07. Local Development Guide](../../../docs/design/07-local-development.md) whenever the task is about how to read the repo, where to start, or how to stage local work from the design-first state.
4. Return to this skill file when you need the top-level map.

## Output expectations

- Treat this skill as a router, not as the source of design truth.
- Prefer linking to the module file path that answers the question.
- If the request spans multiple modules, enumerate the minimal set instead of unfolding the whole corpus.
