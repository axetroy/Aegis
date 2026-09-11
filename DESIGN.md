# Aegis Design Index

Aegis 当前以架构设计为主，原始白皮书内容已经拆分为可按主题阅读的模块文档。

## 设计模块

| 模块 | 说明 | 文件 |
| --- | --- | --- |
| 01 | 摘要、定位、威胁模型、安全模型、边界 | `docs/design/01-foundation-and-security-model.md` |
| 02 | 总体架构、React 兼容、JSX、UI / Event Protocol | `docs/design/02-runtime-architecture-and-protocol.md` |
| 03 | Capability、Manifest、权限策略、资源限制、包安全 | `docs/design/03-capabilities-and-package-security.md` |
| 04 | 应用身份、签名、渲染器、UI Primitive、生命周期 | `docs/design/04-renderer-and-react-lifecycle.md` |
| 05 | 数据流、交互流程、性能、DevTools、项目结构 | `docs/design/05-dataflow-performance-and-tooling.md` |
| 06 | MVP、阶段路线图、产品模型、核心抽象、愿景 | `docs/design/06-roadmap-and-vision.md` |
| 07 | 本地开发与阅读导航 | `docs/design/07-local-development.md` |

## 推荐阅读路径

- 初次阅读：01 → 02 → 03 → 04 → 05 → 06
- 关注本地开发：先看 07，再按任务跳到对应模块
- 关注安全边界：优先看 01、03
- 关注协议与 Runtime：优先看 02、05
- 关注 MVP 范围控制：优先看 06

## 文档使用方式

- 把 `DESIGN.md` 当作总索引
- 把 `docs/design/*.md` 当作详细设计模块
- 当任务只涉及单一主题时，只读取最相关的模块，不再一次性展开整份白皮书

## 与技能包的关系

仓库中的 `.agents/skills/aegis-design-index/SKILL.md` 是一个轻量级索引技能。

它不重复承载设计细节，只负责把读者或 Agent 路由到合适的模块文档。
