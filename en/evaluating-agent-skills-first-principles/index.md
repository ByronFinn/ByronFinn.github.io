# Beyond 'Impressive Output': Scientifically Evaluating Agent Skills

- Date: 2026-10-08
- Author: ByF
- URL: https://blog.baifan.site/en/evaluating-agent-skills-first-principles/
- Description: Reject showcase bias and ungrounded praise. Using causal inference and first principles, this article unpacks the attribution chain of Agent Skills, paired A/B testing, three-tier evidence hierarchies, and anti-contamination guardrails.

---


In earlier discussions on agent architectures in 《{{< ref "posts/2026-06-22-claude-code-skills-system" >}}》 and 《{{< ref "posts/2026-08-05-give-ai-a-rulebook" >}}》, we analyzed how a Skill operates: procedural behavioral conventions injected into the LLM context either statically or on demand. In real-world engineering, assessing whether a skill works is plagued by showcase bias. A developer drafts several pages of textual directives, feeds a prompt to an agent, gets back clean code or a well-structured architecture document, and posts a screenshot declaring the skill "phenomenal."

Uncontrolled single-turn demonstrations offer virtually zero signal-to-noise ratio in causal inference. There is no proof whether the high-grade delivery stems from the text rules constraining model execution or simply from the base foundation model's innate reasoning capability.

Evaluating a skill demands independent bookkeeping of marginal quality improvements against context and runtime overhead. During the development of the `dev-skills` specification, we built an evaluation pipeline grounded in causal inference that applies to agent skills across any technical domain.

<!-- more -->

## 1. The Causal Chain and the Core Ledger

### 1. The Promised Causal Chain

Assessing any technique requires examining its promised causal sequence. The value proposition of a skill relies on a fragile multi-stage link:

$$\text{Inject Skill Text} \xrightarrow{(1)} \text{Model Internalizes Rules} \xrightarrow{(2)} \text{Behavioral Shift Occurs} \xrightarrow{(3)} \text{Artifact Quality Leaps}$$

Each link in this sequence is prone to failure:

- **Link (1) Breaks**: Attention decay over long contexts causes the model to ignore injected rules entirely.
- **Link (2) Breaks**: The model parses the directives, but defaults to pre-trained shortcuts. For instance, when a rule explicitly mandates writing a failing test first, the model writes implementation code anyway.
- **Link (3) Breaks**: The agent shifts its behavior (e.g., executing four additional clarification turns), but the final deliverable shows no statistically measurable quality gain over zero-shot generation.
- **Negative Returns**: The model follows conventions, quality improves by a negligible 1%, but consumes 15,000 extra context tokens and introduces significant turn-taking latency.

The role of an evaluation framework is to place probes across each link, validating state transitions rather than scoring impressionistic outputs at the end.

### 2. Dual-Ledger Accounting: Rejecting Synthetic Composite Scores

Proving net positive utility requires answering a single question:

> Compared to the unaugmented base model operating on native capability alone, what attributable gain does mounting the skill deliver?

The evaluation is a differential formula tracked across two independent ledgers:

$$\text{Net Gain} = \Delta \text{Quality} - \Delta \text{Cost}$$

- **$\Delta \text{Quality}$ (Benefits)**: Deterministic test results (Exit Code 0/1) plus delta scores from double-blind human audits.
- **$\Delta \text{Cost}$ (Overhead)**: Static injection tokens (the skill document and its transitive dependency closure) plus dynamic execution overhead (API round trips, tool invocations, end-to-end latency).

Compressing quality and cost into a synthetic composite score imposes subjective conversion ratios. In the `grill` architectural review skill within `dev-skills`, consuming 30,000 additional tokens to uncover a concurrent deadlock before production deployment represents negligible cost for mission-critical infrastructure. Conversely, a commit-formatting skill that adds 8,000 tokens on every invocation is pure waste across thousands of daily CI runs. An honest evaluation presents delta quality alongside delta cost, leaving the trade-off to specific operational constraints.

## 2. Experimental Foundation: Paired A/B Testing

Establishing empirical validity requires **paired A/B testing**:

```
                          ┌───────────────────────┐
                          │   Standard Task Env   │
                          └───────────┬───────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
       [ Baseline Arm ]                          [ Skill-Armed Arm ]
   Identical Model, Start State, Seed        Identical Model, Start State, Seed
         + Pure Task Spec                          + Pure Task Spec
        (Zero Skill Rules)                        + Skill Closure Text
                 │                                         │
                 ▼                                         ▼
          [ Artifact A ]                            [ Artifact B ]
                 │                                         │
                 └────────────────────┬────────────────────┘
                                      │
                                      ▼
                        [ Double-Blind Audit Layer ]
```

Paired testing enforces three operational rules:

1. **Isolate the Independent Variable**: Both arms share the exact model version, system prompt baseline, sampling temperature, and seed. The only difference is the injection of the skill text and its dependency closure.
2. **Eliminate Cross-Task Variance**: Summing scores across unrelated tasks is statistically invalid. All win/loss determinations occur strictly between paired arms within the exact same task boundary.
3. **Atomic Analysis Unit (Skill $\times$ Task)**: Skill suites are heterogeneous. A repository of ten skills typically contains a couple of high-performing directives, several neutral ones, and occasional regressions. Analysis must evaluate atomic `Skill × Task` slices, classifying each outcome into three categories: **Superior**, **Neutral**, or **Inferior**.

## 3. Seven Core Design Principles and Counter-Patterns

Measurement reliability hinges on the stability of the testing instrument. The following seven principles address prevalent evaluation distortions:

### Principle 1: Unpolluted Baseline (Prevent Task Leakage)

- **Counter-Pattern**: When evaluating a refactoring skill, the task description instructs: "First identify code smells, outline proposals sequentially, ensure backward compatibility, then implement changes." Leaking the skill's methodology directly into the task description artificially equalizes both arms.
- **Protocol**: Task descriptions must define only the goal (What), operational context (Context), constraints (Constraints), and deliverables (Deliverables). Any methodology, reasoning step, or troubleshooting heuristic found in the skill text is strictly banned from the task prompt.

### Principle 2: Provide Space for Behavioral Variance (Interactive Realizability)

- **Counter-Pattern**: Testing an interactive skill (such as pre-implementation requirement clarification) in a single-turn batch script. Deprived of a user, the skill-armed agent must hallucinate answers or skip clarification entirely.
- **Protocol**: Interactive skills require a controlled client simulator. The simulator maintains private specification dossiers, returning cached, deterministic responses to identical queries across both arms to neutralize conversational noise.

### Principle 3: Calibrate Task Difficulty (Eliminate Ceiling Effects)

- **Counter-Pattern**: Using trivial tasks where standard base models achieve a 95% pass rate unassisted. When both arms hit the ceiling, the benchmark loses discriminatory power.
- **Protocol**: Calibrate baseline difficulty to a 40%–70% completion band. Independent testers must blind-verify tasks before official benchmarking. If the baseline arm passes above 80%, the task is discarded and injected with subtle edge cases or realistic distractors.

### Principle 4: Three-Tier Evidence Hierarchy (Deterministic Over LLM Scoring)

- **Counter-Pattern**: Feeding outputs to an unconstrained LLM-as-a-Judge for numerical ratings (1–10). This absorbs well-documented biases: position bias, verbosity bias, and markdown aesthetic preferences.
- **Protocol**: Establish a tiered verification structure:
  1. **L1 Deterministic Verification (Zero Model Subjectivity)**: Hidden test suites, linters, and verification scripts executed via terminal exit codes (Exit Code 0/1).
  2. **L2 Gold-Standard Checklist**: Curated defect and fact checklists where evaluators conduct boolean checks (Hit/Miss) rather than subjective grading.
  3. **L3 Swapped Double-Blind Auditing**: Fully anonymized artifacts stripped of tool telemetry; two independent human or cross-model auditors review outputs in inverted order, each citing at least two concrete flaws in the text.

### Principle 5: Separating Attribution (Compliance vs. Outcome)

- **Counter-Pattern**: Blaming skill logic when a skill-armed agent fails, even though trace inspection reveals the model drifted and skipped required validation steps entirely.
- **Protocol**: Measure execution compliance and delivery outcome independently:
  - Audit execution traces to verify whether mandated procedural steps (e.g., test-first commits or structured failure analyses) were performed.
  - Low compliance points to prompt steerability limits or context overload. High compliance paired with inferior output confirms flawed skill logic.
  - Enforce an MD5 divergence gate: if artifact hashes across both arms match identically, the run is invalidated as an invariant task.

### Principle 6: Full Cost Disclosure

- **Protocol**:
  - **Static Cost Accounting**: Tally total tokens across the skill file and all transitively referenced documentation, presenting the sum prominently in benchmark headers.
  - **Dynamic Overhead Reporting**: Multi-phase reasoning skills naturally increase turn counts. API round trips, tool invocations, and wall-clock execution time must be logged without arbitrary synthetic penalties, providing raw data for marginal utility assessments.

### Principle 7: Experimental Pre-Registration

- **Counter-Pattern**: Inspecting benchmark output and retroactively inflating weightings on formatting or fluency to declare a skill victorious.
- **Protocol**: Pre-register evaluation rubrics and freeze them via Git commits before benchmark execution. Define firm superiority thresholds (e.g., non-inferior deterministic checks paired with a $\ge 10\%$ lead in blinded audit scores). Post-hoc criteria changes are prohibited.

## 4. Benchmark Pipeline and Task Matrix Design

In practice, a rigorous skill evaluation pipeline runs as a multi-stage gate:

```
[ Task Design & Edge Cases ] ──► [ Blind Baseline Calibration ] ──(Pass Rate > 80%?) ──► [ Redesign Task ]
                                           │ (40% - 70% Target)
                                           ▼
                             [ Paired Sandboxed Execution ]
                                           │
                                           ▼
                             [ MD5 Identity Gate ] ──(Identical?) ──► [ Invalidate Run ]
                                           │ (Divergence Confirmed)
                                           ▼
                             [ L1 Deterministic Verification ]
                                           │
                                           ▼
                             [ Anonymization & De-identification ]
                                           │
                                           ▼
                     ┌─────────────────────┴─────────────────────┐
                     ▼                                           ▼
            [ Auditor A: Arm 1 -> 2 ]                   [ Auditor B: Arm 2 -> 1 ]
            - Identify ≥ 2 concrete flaws               - Identify ≥ 2 concrete flaws
            - Boolean checklist audit                   - Boolean checklist audit
                     │                                           │
                     └─────────────────────┬─────────────────────┘
                                           │
                                           ▼
                             [ Adjudication & Disagreement ]
                                           │
                                           ▼
                             [ Dual-Ledger Quality vs. Cost ]
```

### Designing the Task Matrix: Triggering Specific Behavioral Shifts

Benchmark tasks must be tailored to challenge the exact failure mode a skill targets. Examples from the `dev-skills` suite include:

| Skill Category & Example | Evaluated Behavioral Trait | Task Design Mechanism | Primary Adjudication Metric |
| :--- | :--- | :--- | :--- |
| **Interactive Clarification**<br>`think` | Rejects implicit assumptions; initiates targeted queries to resolve ambiguity. | Task description contains hidden conflicting requirements; true boundaries reside solely in the simulator dossier. | Ratio of uncovered constraints and turn efficiency. |
| **Defensive Architecture Review**<br>`grill` | Scrutinizes seemingly clean architectures for deep system risks. | Provides clean, lint-compliant code containing subtle distributed race conditions and resource leaks. | Recall rate against gold-standard defect checklist, deducting trivial nitpicks. |
| **Rigorous Implementation**<br>`tdd` | Enforces test-first discipline; prevents backfilled vanity tests. | Complex algorithmic edge cases where immediate implementation misses boundary contracts. | Temporal commit trace audit (test preceding logic) + hidden validation test exit code. |
| **Technical Research**<br>`research` | Adheres strictly to authoritative documentation; prevents parameter-space hallucinations. | Queries concerning breaking changes in recently released APIs absent from older training data. | Fact accuracy check, version trap avoidance rate, and source citation fidelity. |

## 5. Reviewing an Evaluation Report: A Guide for Technical Leaders

When reviewing benchmark claims regarding skill efficacy, apply three verification checks:

### 1. Diff the Task Spec Against Skill Directives

Examine the task description against the skill documentation. If the task prompt contains instructional guidance like "carefully inspect edge cases" or "ensure backward compatibility," the baseline arm was contaminated, invalidating claimed causal gains.

### 2. Distinguish Between the Two Types of Ties

When a report indicates a tie, check the underlying metrics:

- **True Tie**: Both arms perform identically on deterministic checks and blinded auditors reach consensus. The base model already commands sufficient capability for the task, yielding zero marginal return from the skill.
- **Winner Disagreement**: Auditor A selects Arm 1 while Auditor B selects Arm 2. The task rubric lacks objective criteria and the result is subjective noise. Label this outcome as "Inconclusive Evidence" rather than a tie.

### 3. Verify Marginal Resource Cost

Measure what the skill spent to achieve its quality delta. If a skill injects 15,000 static tokens and inflates latency across every routine run just to catch an infrequent edge case, it should be trimmed or removed from the always-on context window.

## Conclusion

In agentic software engineering, writing skills provides an illusion of rapid progress: natural language produces no compiler errors, and descriptive rules feel like instant capabilities.

Validating an agent skill requires stripping away showcase bias. By isolating unpolluted baselines, benchmarking across discriminating difficulty bands, and running deterministic verification alongside counterbalanced blind audits, teams can balance quality improvements against operational costs. Only directives that survive causal verification justify their presence in the context window.

