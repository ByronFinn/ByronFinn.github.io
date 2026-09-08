# Multi-Agent Collaboration: Value From Structure, Not Concurrency


Conclusion first: the value of multi-agent doesn't come from more models; it comes from the right structure. Multi-agent without structure is just more expensive concurrency — burn 2 to 3 times the tokens to watch a group of models nod at each other. Multi-agent with structure is an execution system that can delegate, parallelize, and verify.


<!-- more -->

## Why a Single Agent Fails at Long Tasks

Diagnosis first. A single agent executing complex tasks has five structural defects — blame the execution structure, not the model's intelligence:

- **Uncertain stopping judgment**. Given a goal with 7 subtasks, the model may stop and report back after finishing 3, asking whether to continue. It "feels" done.
- **Long-task degradation**. The context gets dirtier as it accumulates; early requirements are forgotten; once the direction drifts, it keeps drifting. Once an error appears, there is no internal mechanism to break it off.
- **Self-grading**. It sincerely checks its own output — but what it checks is the very scene it just constructed. Judge and contestant are the same person; self-attestation doesn't count as external evidence.
- **Long horizons clash with interaction expectations**. Minute- or even hour-scale work fights second-scale feedback expectations; background tasks and active conversation share one context and pollute each other.
- **Role-playing is not role division**. Swapping prompts on one agent to play "planner" and "executor" is not division of labor. Real division operates on at least four dimensions of context: tools, context, memory, and skills.

Of the five, the deadliest is the third. Grading your own paper always comes out full marks — a flaw humans have, and so do models.

## The Core: Seven Things

### Value Comes From Structure, Not Concurrency

To judge whether a multi-agent system is worth building, don't count how many agents it can launch at once — ask five questions: why split, how to accept, when to stop, how to recover from failure, how to manage memory. These five questions are themselves the acceptance criteria for multi-agent.

The cautionary tale is an experiment the research world ran long ago: homogeneous models [debating](https://arxiv.org/abs/2402-06782) each other burns 2.1–3.4x the tokens of single-agent self-correction with no accuracy gain — sometimes worse. In that 2024 paper, models were even led astray by more persuasive wrong arguments. Multiple homogeneous models confirming each other just spreads uncertainty in parallel.

### Production and Verification: Adversarial, Not a Chorus

The core collaboration flow has exactly three roles:

- **Leader**: sets the plan, splits tasks, decides whether a team is worth opening, how fine to split, how many retries, and when to escalate to a human.
- **Worker**: does the work, each with different tools, context, and output requirements. The clearer the role, the more reusable, comparable, and checkable the output.
- **Verifier**: gates the work — checks factual sources, coverage checklists, risk boundaries — with the authority to send work back.

The key design is the adversarial relationship between Worker and Verifier: R&D versus QC, not colleagues being polite to each other in a review meeting. A state machine governs each task's lifecycle: `producing → verifying → done`; a failed verifying sends it back to producing, until it passes or a stop condition triggers.

Why adversarial? Because in sequential multi-agent handoffs, hallucinations compound: A's bias is reinforced by B, stacked by C, and finally converges into a high-confidence wrong conclusion. An independent verifier exists to break that chain — another way to break it is Claude Code's [fork-join]({{< ref "posts/2026-06-24-claude-code-multi-agent.md" >}}), but the merge point needs an inspector too. This design is isomorphic to the Evaluator-Optimizer in Anthropic's [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents), but with a sharper stance: verification is not the producer's self-improvement — it is an independent actor's veto.

### Context Is Money

Multi-agent collaboration exposes three engineering costs that a bigger context window cannot solve:

1. **Handoff cost**: the same piece of information has to be re-packaged between agents. The countermeasure is structured handoff artifacts: a readable handoff file plus a shared message board, with agents slow-communicating via "file path + summary" instead of stuffing everything into context at once.
2. **Sharing cost**: every extra piece of shared content is paid for again by every Worker on every round. The countermeasure has three tiers: within-agent memory (broadcast to similar agents), inter-agent communication channels (direct dialogue), and a whiteboard (high capacity, read on demand). This maps to the progression of "push notification → direct conversation → read on demand".
3. **Aggregation cost**: collecting ten results in parallel is easy; synthesizing one deliverable that is factually consistent, citation-aligned, and stylistically uniform is hard. Aggregation is the Leader's expensive job: "merging 10 into 1".

The design implication in one sentence: evaluate shared information by "is it worth every Worker paying for it every round". Isolation is the default; sharing is the exception.

{{< figure src="/pictures/posts/multi-agent-technical-core-cost-models.svg" alt="Three context cost models" caption="Three context costs: handoff, sharing, aggregation" >}}

### It's a Runtime, Not Prompt Orchestration

Writing a few paragraphs of prompt to make a model play different roles is a demo, not a system. The real complexity lives in the control plane: task state machines (each run cycle is a session), multi-source events (users, other agents, timers, system monitoring), observability, and gates. Permission constraints and memory-write constraints can't rely on agent goodwill; soft and hard gates must intercept them.

Industry evidence points the same way: mainstream agent frameworks all emphasize sandbox, workspace, handoff, tracing; enterprise products list Runtime, Memory, Identity, Gateway, and Browser as modules. The center of gravity is shifting from "writing prompts" to "maintaining the control plane" — a direction I also discussed in [runtime dynamic intervention for agents]({{< ref "posts/2026-07-07-ai-agent-runtime-dynamic-intervention.md" >}}).

### Equal Interfaces, Unequal Accountability

Operations on agents — spawn, fork, suspend, terminate — can be abstracted into one unified interface, with callers being users, other agents, or the system engine. Interface equality brings a unified control plane and audit plane, but two boundaries must hold: equality is not unlimited permission — an agent gains no rights merely by gaining the interface; and humans do not exit the accountability chain — high-risk actions like merging code or overwriting production data require a human signature.

Only when agents and humans share one auditable collaboration plane do permissions, accountability, and risk become visible. Audit is the precondition of equality, not its byproduct.

### Externalized State

Long tasks span multiple message rounds, multiple tools, multiple agents — you can't bet on any single model's context not losing things. Task state, event logs, file artifacts, and decision records must all be saved as recoverable objects; the session itself is an external context object, not identical to the model's context window. Recoverability is the precondition for async execution. Put differently: sessions get lost; files don't.

### Memory Consolidation

The execution experience of each run can consolidate into memory and skills, letting agents in the same role understand the user and the collaboration better with use. Growth itself counts toward ROI — don't just look at single-run token spend.

So the selection criterion is clear: the more complex the task, the longer the chain, the higher the risk, and the more reusable the experience, the more team-style collaboration pays off; the shorter and more deterministic the task, the better single-agent or traditional automation. The goal isn't to encourage "open a team for everything" — it's to help people judge when collaboration is worth it and when to keep things simple.

## Four Scenarios, One Core

- **Async long tasks**: task and conversation decoupled — confirm the goal in seconds, split and execute in the background, report at key nodes (started, blocked, decision needed, done). The user can talk to the planner anytime without polluting the execution context.
- **Coding harness**: the Developer implements (outputting rationale for changes, potential risks, verification suggestions); the Tester supplies external evidence — verification results come from commands, tests, and executable checks, not the model's vibes; the Reviewer answers "should this change be made at all" (abstract boundaries, compatibility, privilege expansion, sensitive information). Stop conditions are bound to test, lint, build, and format checks.
- **Parallel research**: split into parallel information channels; independent Verifiers check source retrievability (stable URLs preferred; cached pages are leads only), staleness, and contrary evidence; a synthesizer then merges everything into structured conclusions.
- **Document pipeline**: a Planner sets goals and structure, a Writer drafts, a Formatter handles layout, an Evaluator independently checks content, format, and file integrity. Document generation is reworked into CI/CD: middleware at every step, checks at every step, and every step's failure is locally retryable.

## Five Rough Edges

1. **The planner is the new single point**. We opened by criticizing single agents for uncertain stopping judgment, but the Leader in this scheme is also a model, also carrying decomposition granularity, retry strategy, and escalation decisions. That moves the single point from the execution layer to the decision layer; it doesn't eliminate it.
2. **The verifier's anchor is fuzzy in some scenarios**. In coding the anchors are clear (commands, tests, executable checks), but in research and documentation the verifier is a model too — if "checking source retrievability" isn't backed by hard anchors like stable URLs and version timestamps, the adversarial relationship degrades into two models talking each other into things. Adversarial needs operational verification criteria.
3. **Security boundaries unexpanded**. Agent-on-agent can trigger aborts — so what about anti-abuse mechanisms? What do the soft and hard gates each intercept (paths, commands, network egress)? How does auditing guarantee tamper-proofing and retention periods?
4. **No quantitative data**. Nothing above includes success rates, cost comparisons, or failure-recovery times. "Users will wait longer for verifiable results" is an assumption, not a measurement.
5. **Diagnosis and prescription are asymmetric**. The opening blames single agents' "stopping mid-way" on execution structure, then advocates binding stop conditions to external systems — but if stop conditions can be externalized, a single agent's stopping mid-way is to a considerable degree a design choice, not model fate. There's a missing step between the diagnosis and the prescription.

## Seven Engineering Takeaways

1. **Pass the five questions before selecting**: why split, how to accept, when to stop, how to recover from failure, how to manage memory. If any question has no answer, don't go multi-agent.
2. **Adoption order**: protocol first (task structure, state machines), then isolation (context, files, permissions), adversarial verification last. Reverse the order and collaboration becomes a disaster.
3. **Verification needs external anchors**: test output, command results, stable URLs, timestamps. Verification that "looks like it passed" is more dangerous than no verification.
4. **Cost guardrails before features**: evaluate shared content by per-round tokens; set iteration caps, token budgets, and timeout escalations in advance.
5. **Externalize all state**: task state, event logs, file artifacts, decision records go to disk. Sessions get lost; files don't.
6. **Audit before equality**: with everything auditable, the control interface can be authorized; high-risk actions keep a human signature.
7. **Long-term returns live in consolidation**: write the pitfalls you hit into memory, and freeze effective moves into skills. That is the real compound interest over one-off tool calls.

The essence of multi-agent is splitting the contradiction of "one agent serving as both judge and contestant" into a structure that is adversarial, acceptable, recoverable, and auditable. Structure is its only product strength, the cost model is its only yardstick, and memory consolidation is its only long-term return.

