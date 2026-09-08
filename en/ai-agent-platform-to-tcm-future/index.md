# Reverse Engineering Claude Science: From 54 Tables to Modern TCM


A 67 MB DMG installer, 164 MB unpacked, hiding Anthropic's Claude Science (internal codename Operon). After reverse engineering it, I found 54 SQLite tables, a 9-layer security model, 30+ bioinformatics skills, and a complete AI agent platform for computational biology.

On the other side is TCMSP, an AI-native Traditional Chinese Medicine systems pharmacology platform under active development. Looking at the two projects side by side, some design ideas are worth cross-referencing.

<!-- more -->

## Claude Science Is Not a Chat Window

The bundle ID says it plainly: `com.anthropic.operon`. Operon comes from the biology concept of the operon — a unit of gene regulation. The early internal name was `claude-bioscience`, so it was aimed at biological science from the start.

The 30+ built-in skills extracted during reverse engineering are all computational biology and drug development tools:

- AlphaFold2, OpenFold3, ESMFold2 — protein structure prediction
- Boltz, DiffDock — molecular docking
- Chai1, Borzoi, ScGPT — protein design, genomics, single-cell analysis
- ProteinMPNN, SolubleMPNN, LigandMPNN — sequence design
- Figure Composer, Figure Style — scientific figures
- Literature Review, Indication Dossier — literature reviews, drug filing

Version info: `0.1.0-dev.20260630.t212931.sha2bc1ac8` — still at the dev stage.

## Dual-Binary Architecture

Claude Science uses a dual-binary model: a 189 KB Swift GUI handles the interface while a 112 MB Bun daemon runs all the business logic.

![](/pictures/posts/claude-science-architecture.svg)

The GUI layer launches the daemon via NSTask and uses NSPipe for inter-process communication. The daemon is safely copied from the bundle into an isolated directory via SecTranslocate before running. Close the window, and the daemon keeps running in the background.

The daemon's core modules:

| Module | Capability |
|---|---|
| Claude API client | Multi-model, tool calling, token estimation, concurrency control |
| MCP protocol connector | Built-in + custom + marketplace, three sources |
| Remote compute engine | SSH/SCP, container/VM support |
| Frame session management | Conversation trees with branching, archiving, and backfill |
| Artifact versioning | Version tracking for AI-generated code |
| Local memory system | Cross-session persistence, automatic recall, evidence chains |

## 54 Tables

54 SQLite tables defined via Drizzle ORM cover sessions, artifacts, MCP, remote compute, memory, security audit, project management, user configuration, event logs, and more.

The memory system deserves a few extra words. It distinguishes three sources (extractor/agent_tool/user) and three evidence types (stated/observed/inferred). The AI can remember what you said, and it can also tell apart "what you told me" from "what I observed". Drop this design into any scenario that needs evidence grading and it works as-is.

## The 9-Layer Security Model

From code signing to sandboxing to audit logs:

1. macOS code signing + SecTranslocate safe copy
2. DR (Dynamic Replace) integrity verification
3. Data directory tamper detection (pre-upgrade plant attack protection)
4. Path sandbox (allow_write whitelist)
5. Dynamic network authorization
6. Command safety checks
7. Environment variable injection protection
8. Three-tier MCP tool authorization (allow/deny/ask)
9. Host access authorization + audit logs

Layer 3's pre-upgrade plant detection prevents attackers from pre-seeding a malicious data directory before the user's first run. This is not a theoretical assumption; it is an attack technique that has actually appeared.

The detailed reverse engineering report lives in the [claude-science-reverse](https://github.com/ByronFinn/claude-science-reverse) repository.

## What TCMSP Is

TCMSP is an **AI-native** Traditional Chinese Medicine systems pharmacology platform, currently under development.

The whole project consists of 10+ sub-repositories spread across three layers:

**Data layer:**
- `tcmsp` — core search and data API (FastAPI + PostgreSQL), providing the full data chain of herb → ingredient → target → disease
- `tcmsp-cms` — content management backend (interim), managing articles, announcements, patents, and other content
- `tcmsp-prds` — PRD drafts, roadmaps

**Orchestration layer:**
- `tcmsp-ai` — the AI orchestration service, the project's brain

**Compute layer:**
- `modules/` — the collection of compute modules: molecular docking, molecular dynamics, enrichment analysis, single-cell analysis, toxicity prediction, and more

**User layer:**
- `tcmsp-desktop` — desktop app (Tauri + Rust + Vue)
- `tcmsp-web` — public frontend
- `tcmsp-admin-web` — admin console
- `tcmsp-cms-web` — CMS frontend
- `tcmsp-ums` — user management and authentication (Casdoor OIDC)

### Data Model

The data model is designed around many-to-many relationships — herb ↔ ingredient ↔ target ↔ disease — with an independent join table per relationship to support multi-hop queries. Taking the data model in the `tcmsp` repo as an example, the core entities are `草药` (herb), `化学成分` (chemical ingredient), `蛋白靶点` (protein target), `疾病` (disease), and so on, plus their join tables.

The query chain is the research chain: find a herb's chemical ingredients → the protein targets those ingredients act on → the diseases linked to those targets → reverse analysis.

### Orchestration Layer

`tcmsp-ai` is the heart of the project. It exposes a set of APIs:

- Module recommendation and exploration (`/exploration`, `/extraction`)
- Molecular docking (`/molecular-docking`)
- Molecular property prediction (`/molecule-properties`)
- Molecular toxicity prediction (`/molecule-toxicities`)
- Research sessions (`/sessions`)
- Paper generation (`/papers`)
- Gate decisions (`/gates`)
- Research triage (`/research-triage`)

### Compute Modules

The `modules/` directory holds the actual compute modules, including:

- **Molecular docking** (molecular_docking) — AutoDock Vina-based small molecule-protein docking
- **Molecular dynamics** (molecular_dynamics) — GROMACS dynamics simulation
- **Compound property analysis** (compound_property_analysis)
- **Enrichment analysis** (enrichment_pipeline)
- **Molecular property service** (molecule_property_service) — ML model prediction
- **Single-cell analysis** (single_cell_plot)
- **Toxicity prediction** (venompred_toxicity_service)
- **Virtual knockout** (virtual_knockout_service) — gene-level simulation

## Agent Runtime: The Part Most Worth Studying

The Agent Runtime inside `tcmsp-ai` is the most interesting part of the project. It has a complete dynamic agent execution engine:

```
User input → module recommendation → research exploration → plan generation → plan approval →
step execution (parallel scheduling) → gate decisions → result production → paper generation
```

**DynamicAgentExecutor** is the core executor. It takes a `dynamic_agent_plan`, topologically sorts steps by dependency, and executes them in parallel batches. Steps come in three kinds: module steps (invoking compute modules), gate steps (waiting for human approval), and template service steps.

**The Gate system** is the key node of human-AI collaboration. It supports several approval types:

- **plan_confirmation** — the user approves the research plan
- **cost_approval** — cost approval (approve all, approve a subset, or skip)
- **scientific_selection** — scientific target selection (the user filters targets from AI recommendations)
- **claim_review** — review of research findings
- **pipeline_review** — pipeline review
- **failure_recovery** — failure recovery (retry, retry with adjustments, or give up)

Every gate decision is validated by `GateDecisionHandler`, then applied to the execution context by `GateEffectApplier`. A decision can modify the plan, adjust steps, or even abort execution.

**StepScheduler** uses Kahn's algorithm for topological sorting, grouping independent steps to run concurrently. This way molecular docking, property prediction, and toxicity prediction can run in parallel without blocking each other.

## What Claude Science's Architecture Can Teach TCMSP

After reverse engineering Claude Science, looking back at TCMSP's design, a few comparisons are worth recording:

**Evidence grading in the memory system.** Claude Science distinguishes stated/observed/inferred. In TCMSP's module system, the Agent Manifest already defines `evidence_type` and `confidence_fields`, but there is no cross-session memory persistence or evidence tracking yet. That could be the direction for the next iteration.

**MCP protocol vs the modules system.** Claude Science connects external tools via the MCP protocol. TCMSP uses a registry + runner pattern — modules register into a registry, and a RunnerSpec defines how they execute (python_runtime, docker, http_api, etc.). The ideas are similar, but MCP is more general while TCMSP's module system sits closer to TCM computation scenarios. If TCMSP later needs to plug in external tools, an MCP protocol layer is one option worth considering.

**Frame sessions vs research sessions.** Claude Science's Frame supports conversation branching. TCMSP's Research Session has a similar concept — multi-round exploration, module recommendation, pipeline execution — but no branching capability yet.

## Current Status

TCMSP is still in development. Judging from the PRDs, long-term goals include: a TCM systems pharmacology research agent, multi-scale mechanism analysis of ethnic medicines, predicting new indications for compound formulas, syndrome-driven intelligent formula composition, discovery and structural optimization of efficacy ingredients, and more. The desktop app also has its own commercial roadmap.

AI agents are evolving from general-purpose programming tools into domain-specific research platforms. Claude Science enters from biological science, TCMSP from TCM systems pharmacology — different paths, same direction.

TCMSP official site: [https://tcmsp-e.com/](https://tcmsp-e.com/)

---

*Based on reverse engineering of Claude Science v0.1.0-dev.20260630.*

