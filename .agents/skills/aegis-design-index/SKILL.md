---
name: aegis-design-index
description: Umbrella skill for navigating the Aegis design corpus. Use when a task needs architecture context, security boundaries, protocol design, roadmap scoping, or local development guidance; route immediately to the smallest relevant design module.
---

# Aegis Design Index

This skill is an index only. It should route the reader to the smallest detailed design module instead of restating the whole architecture whitepaper.

Repository-local discovery entrypoint:

- `.agents/skills/aegis-design-index/SKILL.md`

Primary design modules:

- Foundation and security model: `../../../docs/design/01-foundation-and-security-model.md`
- Runtime architecture and protocol: `../../../docs/design/02-runtime-architecture-and-protocol.md`
- Capabilities and package security: `../../../docs/design/03-capabilities-and-package-security.md`
- Renderer and React lifecycle: `../../../docs/design/04-renderer-and-react-lifecycle.md`
- Dataflow, performance, and tooling: `../../../docs/design/05-dataflow-performance-and-tooling.md`
- Roadmap and vision: `../../../docs/design/06-roadmap-and-vision.md`
- Local development guide: `../../../docs/design/07-local-development.md`

## Routing rules

Pick the first module that matches and only load adjacent modules when the task crosses boundaries.

- Threat model, trusted boundary, main-thread rationale -> `01-foundation-and-security-model.md`
- Worker / host architecture, JSX, UI protocol, event protocol -> `02-runtime-architecture-and-protocol.md`
- Manifest, capability policy, storage, network, isolation, package security -> `03-capabilities-and-package-security.md`
- Application identity, code signing, renderer design, layout, ref, lifecycle -> `04-renderer-and-react-lifecycle.md`
- Dataflow, interaction flow, performance, DevTools, project structure -> `05-dataflow-performance-and-tooling.md`
- MVP scope, phase planning, product model, core abstraction, final vision -> `06-roadmap-and-vision.md`
- Reading order, repo status, documentation-first local development -> `07-local-development.md`

## First-pass workflow

1. Decide whether the task is about security, protocol, renderer, roadmap, or contributor onboarding.
2. Open the narrowest module that covers that topic.
3. Use `07-local-development.md` whenever the task is about how to read the repo, where to start, or how to stage local work from the design-first state.
4. Return to `/home/runner/work/Aegis/Aegis/DESIGN.md` when you need the top-level map.

## Output expectations

- Treat this skill as a router, not as the source of design truth.
- Prefer linking to the module file path that answers the question.
- If the request spans multiple modules, enumerate the minimal set instead of unfolding the whole corpus.
