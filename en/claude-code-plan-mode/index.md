# The Discrete State Machine of Plan Mode: Decision Tree Pruning, Backtracking Costs, and Diminishing Returns


Autoregressive large language models operating in unconstrained environments suffer from an inherent tendency toward myopic mutation and runaway divergence. Claude Code's Plan Mode attaches an external discrete Finite State Machine (FSM) that projects the action space onto a strictly side-effect-free subset, using an interactive human barrier to prune catastrophic physical backtracking branches from the decision tree.

<!-- more -->

In disciplined software engineering, experienced developers instinctively value structural planning: mapping dependency graphs, deriving type signatures, and scoping blast radiuses before modifying a single line of code. Large language models possess no such innate restraint. Shaped by reinforcement learning to generate immediate answers, an agent granted unrestrained write permissions will instinctively mutate files without global context, precipitating an architectural cascade across complex repositories.

## Action Myopia and the Divergence of Markov Decision Trees

When an agent tackles a coding assignment formulated as a Markov Decision Process (MDP), each autoregressive tool dispatch traverses a branching trajectory. The cumulative probability of the system maintaining global alignment through step $T$ degrades according to cascading error probabilities:

$$P(\text{Success}_T) = \prod_{t=1}^T (1 - \epsilon_t)$$

Even if the individual error rate $\epsilon_t$ of a single tool execution is kept down to a modest $5\%$, after 15 consecutive autonomous mutations the cumulative probability of avoiding an off-target trajectory drops sharply:

$$P(\text{Success}_{15}) = (1 - 0.05)^{15} \approx 46.3\%$$

In an unconstrained read-write workspace, language models routinely fall into **Action Myopia**:
1. Observing a broken test, the model immediately calls `edit` to alter function parameters.
2. The change breaks upstream call sites; the model blindly issues `write_file` to override caller files.
3. Transitive dependencies trigger secondary compilation errors, and the model scrambles outward across the codebase.

```
                   [Root Goal: Refactor Auth Service]
                           /         \
                 (Disciplined Plan)   (Action Myopic Branch)
                      |                         |
             [Trace Dependency Graph]   [Instantly Edit Auth.ts]
                      |                         |
             [Establish API Contract]   [Break Token.ts Signature]
                      |                         |
             [Human Barrier Check]      [Mutate 8 Upstream Files]
                      |                         |
             (Zero-Cost Pruning)        (Physical Backtracking Disaster)
```

In real-world engineering, the penalty for this divergence is the **Physical Backtracking Penalty**. Once an agent scatters flawed edits across a dozen files, rolling back requires complicated Git resets, dirty working tree cleanups, and thousands of contrite, token-heavy recovery turns. As analyzed in [The Physical Cost of Context Compression]({{< ref "posts/2026-06-17-claude-code-context-compression.md" >}}), this churn burns context budgets while polluting short-term reasoning memory.

## Formalizing Plan Mode: A Finite State Machine with Barrier Synchronization

The architectural mechanism of Plan Mode is an **external two-state Finite State Machine (FSM)** wrapped around the agent loop:

$$\mathcal{S} \in \{\text{PLAN}, \text{EXECUTE}\}$$

```
+------------------------------------------------------------+
|                Finite State Machine (FSM)                  |
|                                                            |
|       +----------------+            /plan command          |
|       |                | <--------------------------+      |
|       |   PLAN State   |                            |      |
|       | (Safe Read-Only|                            |      |
|       +-------+--------+                            |      |
|               |                                     |      |
|               | User Approves Plan (Barrier Sync)   |      |
|               v                                     |      |
|       +----------------+                            |      |
|       |  EXECUTE State | ---------------------------+      |
|       |  (Read/Write)  |                                   |
|       +----------------+                                   |
+------------------------------------------------------------+
```

### 1. Asymmetric Projection of Action Space

Let $\mathcal{A}$ denote the complete universe of dispatchable tools, encompassing all file writes, edits, and terminal execution vectors. Under the `PLAN` state, the runtime dispatch router forcibly projects the action space onto an immutable subset:

$$\mathcal{A}_{\text{plan}} = \mathcal{A} \cap \{\text{read\_file}, \text{glob}, \text{grep}, \text{ls}, \text{read\_only\_bash}\}$$

As detailed in [Permissions and Real Security Boundaries]({{< ref "posts/2026-06-14-claude-code-permissions-security.md" >}}), access control must intervene before operating system calls execute. In `PLAN` mode, any attempt by the model to dispatch a `write_file` or mutating shell command is trapped by the local dispatcher and returned as an error. This barrier originates from hard application-level routing.

### 2. Human Barrier Synchronization

The transition from `PLAN` to `EXECUTE` is non-autonomous; it introduces a mandatory human-in-the-loop synchronization barrier:
- The agent conducts repository exploration under strict read-only constraints.
- It consolidates findings into a structured Markdown document enumerating affected files, dependency shifts, and operational sequences.
- The engine halts execution, suspending the loop until a human approves the proposal.

This barrier radically alters backtracking economics: rejecting an erroneous approach during Plan Mode costs only a single prompt ("Wrong approach; do not touch the database layer") and a few discarded lines of text. Rejecting an approach during unconstrained execution requires reverting dirty files and reconciling corrupted repository states.

**Plan Mode replaces expensive physical state rollback with low-cost textual pruning.**

## The Collapse of Static Planning: Fragility Against Dynamic Compilers

Treating Plan Mode as a panacea is dogmatic. Static upfront planning exhibits a severe defect when applied to real software: **software systems are non-linear dynamic feedback environments, and static language models are fundamentally blind to compilers.**

{{< admonition type="caution" title="The Law of First-Step Plan Disintegration" open=true >}}
In strictly typed languages like Rust or TypeScript, an elaborate ten-step architectural plan drafted in read-only isolation frequently disintegrates upon executing step one. An unexpected borrow checker violation or an esoteric generic constraint generates a fatal compiler diagnostic that the model could never foresee without running a build. The moment step one fails, the subsequent nine steps—crafted at great token expense—instantly become invalid noise cluttering the prompt context.
{{< /admonition >}}

Language models cannot simulate full compiler semantics in their weights. Forcing an agent to draft comprehensive plans in an empirical vacuum slows down development velocity while generating an illusion of control.

## Diminishing Returns: Why BYF Eliminated Plan Mode in ADR 0008

In the early architectural iterations of the open-source [BYF](https://github.com/ByronFinn/byf) engine, the team implemented a faithful replica of Claude Code's Plan Mode. By ADR 0008, however, the team took a calculated decision: **rip Plan Mode completely out of the core state machine.**

The rationale was anchored in compounding runtime complexity and sharply diminishing returns:

### 1. Chronic Context Token Bleed

Sustaining Plan Mode imposed a persistent tax on every single conversational turn:
- Schema definitions for `EnterPlanMode` and `ExitPlanMode` consumed roughly 1,425 tokens per turn, serialized into the prompt on every iteration.
- A periodic `PlanModeInjector` injected repetitive system reminders ("You are currently in Plan Mode; do not modify files") into history buffers.
- The generated plan artifacts themselves occupied 2k to 5k tokens of high-priority context window.

### 2. Architectural Sprawl and State Contamination

Plan Mode was never a cleanly isolated feature; it invaded every layer of the system:
- The CLI/TUI layer required dedicated `/plan` handlers, keybinding monitors, plan-card widgets, and status-bar badges.
- The core orchestrator had to manage dual-state migrations, reentrancy guards, and complex transition rollbacks.
- The implementation touched over 70 source files, driving up test maintenance overhead.

### 3. Degradation of the Barrier into Rubber-Stamping

Much like approval fatigue in security checkpoints, when an agent presents a 100-line markdown plan full of abstract prose, human developers rarely audit every line. They scan the headers and hit Enter. The rigorous barrier quickly degrades into empty ritual.

BYF concluded that **an agent should interleave exploration and mutation in a continuous workflow, avoiding artificial lock-in to synthetic binary states.** Developers can express "inspect the code and tell me your thoughts before writing" through plain language, achieving the same planning benefits without carrying the weight of an embedded state machine.

## Practical Scoping: When to Plan and When to Act

Critiquing dogma does not mean rejecting planning. In production engineering, applying hard state boundaries is a question of task uncertainty versus blast radius:

| Task Profile | Collaboration Stance | Enforcement Mechanism | Trade-Off Analysis |
| :--- | :--- | :--- | :--- |
| **Deterministic Local Fixes**<br>(Single unit test fix, field addition, rename) | Continuous Interleaving (No Plan Mode) | Direct execution with rapid test feedback | Avoids token waste and transition friction |
| **Cross-Module Refactoring**<br>(State management migration, ORM refactor) | Hard Barrier Planning (Plan Mode) | Restrict write tools; mandate boundary blueprint | Maximizes tree pruning; prevents dirty state spread |
| **Unfamiliar Codebase Discovery**<br>(Investigating foreign repos, auditing dependencies) | Exploratory Read-Only | Mount read-only toolset exclusively | Prevents accidental modification during reconnaissance |

## Conclusion: Mechanical Splints on Stochastic Engines

Plan Mode is a **mechanical splint** bolted onto a stochastic system to curb its volatility.

By constricting degrees of freedom, it suppresses impulsive mutations driven by action myopia. Through an external FSM and human barrier synchronization, it truncates disastrous decision branches at trivial textual costs.

Yet sound engineering demands seeing the boundary: a splint immobilizes a fracture, but it cannot impart strength to the underlying bone. The moment a static plan loses contact with dynamic compiler diagnostics, it encounters the hard ceiling of diminishing returns. Knowing where to impose hard friction and where to enable fluid verification remains the true dividing line in building dependable AI developer tooling.

