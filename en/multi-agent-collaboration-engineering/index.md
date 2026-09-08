# Multi-Agent Collaboration: Triggers, Topology, and Merging


Conclusion first: multi-agent collaboration is not "spinning up a few more model instances." It has to solve task scheduling, context isolation, permission control, state management, and result merging — every one of which is an engineering problem, not a prompt problem.

<!-- more -->

The multi-agent stories on TikTok and Xiaohongshu usually go like this: one agent researches, one agent writes code, one agent runs tests, one agent does review, and the main agent collects results like a project manager. The comments: "Whoa, that's insane."

People who have actually used it just shake their heads.

In engineering terms: who is allowed to create workers? How much context does a worker get? Can it write files? What happens when multiple workers write to the same area? When a worker fails, times out, or gets interrupted, how does the parent task recover? Once results come back, who adjudicates conflicts and who does the merge? These are runtime design questions, with little to do with model capability.

What follows takes the actual designs of five systems — Codex, Claude Code, OpenClaw, Hermes, and Qoder — and takes the engineering problems of multi-agent systems apart.

## Triggering and Topology Are Two Different Problems

Many discussions get muddled because they treat two problems as one.

**Triggering**: when does the system go from one agent to many?

**Topology**: once there are multiple agents, how are they organized? Does the main agent dispatch workers and merge everything itself, or can workers talk to each other? Do you wait for results within the current turn, or drop tasks into a durable queue and continue tomorrow?

### Four Triggering Modes

{{< image src="/pictures/posts/multi-agent-collaboration-topology.svg" caption="The main topologies of multi-agent systems" width="100%">}}

**Explicit triggering**. The user literally says "use parallel subagents" or "spawn one agent per review category". Codex mainly takes this road. It won't start workers on its own just because a task looks complicated; it leaves the parallelism decision to the user and the main agent.

**Semantic triggering**. The main agent decides whether to call a particular expert based on the task content and each subagent description. Claude Code's ordinary subagents work this way. The more a description reads like a trigger condition, the more reliably the system calls it at the right moment; the more it reads like a wish, the more chaotically agents get summoned. Qoder Experts is not auto-switched into from normal agent mode — the user switches to Experts mode first, then the Team Lead breaks down the task and pulls in experts as needed.

**Route triggering**. The system doesn't look at task complexity; it looks first at where the message came from. OpenClaw selects agents by channel, account, thread, peer, guild, and role. The Slack ops channel goes to the ops agent, private Telegram goes to the deep work agent, the household entry point goes to a low-privilege assistant.

**Queue triggering**. Tasks are written to a board, queue, cron, or background job, and a dispatcher pulls up workers by status and assignee. Hermes Kanban takes this road. The key question isn't whether the current turn can return a result — it's whether tasks survive across turns, days, restarts, and human intervention.

### Six Topologies

**Single agent**. The default. When requirements are vague, changes are small, or steps are tightly coupled, a single agent is usually the most stable. Plenty of tasks don't need multiple agents — they need better context and shorter feedback loops.

**Star fan-out/fan-in**. The most common subagent shape. The main agent dispatches multiple workers, workers don't negotiate directly with each other, and results flow back to the main agent for the reduce. Codex subagents, Claude's ordinary subagents, Hermes delegate\_task, and Qoder Experts all use this structure. The advantage is a clear center of responsibility; the disadvantage is that workers can't correct each other, and every conflict piles onto the main agent's merge stage.

**Chain pipeline**. For strongly sequential tasks. First locate the bug, then write the fix, then add tests, then review. Forcing parallelism onto tasks like these usually just makes later workers waste time on wrong assumptions.

**Tree**. For layering big tasks. The main agent dispatches orchestrators, which dispatch leaf workers. It looks powerful, but depth and concurrency must be strictly capped or the fan-out inflates exponentially. OpenClaw and Hermes both keep default depth very low precisely to control this risk.

**Mesh team**. For multi-hypothesis problems. A production login failure might come from frontend state, backend tokens, database sessions, cache, or deployment config; multiple teammates each verify a hypothesis and challenge each other. The cost: more messages, more context, higher coordination overhead, and file conflicts become more likely.

**Gateway routing**. For always-on, multi-entry systems. Not "one task split across multiple agents" but "different entry points flow into different agents." A large share of OpenClaw's multi-agent value lives here.

## The Call Chain

{{< image src="/pictures/posts/multi-agent-delegation-chain.svg" caption="The call chain of a multi-agent system" width="100%">}}

Take a multi-agent system apart into one call chain:

```text
input event
  -> router / dispatcher
  -> context builder
  -> worker profile selection
  -> execution sandbox
  -> state store
  -> merge / reduce
  -> final output or next task
```

**router / dispatcher** decides whether to split a task and to whom. In Codex this judgment comes from explicit user authorization; in Claude Code it's driven by description matching; in OpenClaw it's often decided by entry-point binding; in Hermes a short task may be delegated by the parent agent calling delegate\_task, or auto-selected by the model based on complexity; in Qoder's Experts mode the Team Lead splits tasks, picks experts, and merges results.

**context builder** decides what the worker knows. Under-contextualized subagents drift off course as a matter of course. You can't pull a worker in with nothing but "fix it" and expect it to understand the project path, the error scene, the relevant files, the acceptance criteria, and the no-go list. For a subagent, the delegation brief is the requirements document.

**worker profile selection** decides which role to use. Read-only explorer, code-editing worker, security reviewer, test reviewer, a profile with long-term memory, a one-shot child — pick the wrong role and the permissions and output that follow will be wrong too.

**execution sandbox** decides what the worker can do. Can it run a shell? Go online? Write files? Spawn children of its own? These aren't just security settings — they directly change the collaboration pattern. A read-only reviewer and a writable implementer are two completely different agents.

**state store** decides where state lives. A one-shot subagent's state usually only lives inside the current task, returning a summary at the end. OpenClaw's agents have their own session store. Hermes Kanban writes task, comment, handoff, and blocked/retry state into a database. Where state lives determines whether the system can span turns, days, and restarts.

**merge / reduce** owns the final merge. After multiple workers return results, who adjudicates conflicts, who makes trade-offs, who writes the final patch, who is accountable to the user? Many multi-agent demos look beautiful precisely because they skip the merge problem. In real engineering, merge is where success or failure is decided.

Finally there's cancellation and failure propagation. If the parent task is interrupted, do the children stop too? What happens when a worker times out? When two workers return opposite conclusions? When one worker writes a bad patch and another worker's tests keep running on top of it — how do you roll back? These are runtime design questions.

## Codex: Explicit Fan-Out

Codex's subagent strategy is restrained. By default it will not spin up a fleet of agents just because a task sounds complex. You have to grant parallelism explicitly:

```text
Use parallel subagents.
Spawn one agent per review category.
Delegate this work in parallel and synthesize the results.
```

If you only say "dig into this" or "review it thoroughly," Codex usually reads that as a quality bar, not multi-agent authorization. It's a product trade-off: Codex leaves fan-out control with the user and the main agent instead of automatically translating complexity into more workers.

There are practical reasons behind this design. More agents mean more tokens, latency, log volume, and merge cost; workers that can write files add conflict risk; subagents returning long explanations raise the main agent's reduce cost. Explicit authorization looks a little less "automatic," but system behavior stays predictable.

The default topology is a star:

```text
main Codex agent
  -> explorer A: read-only search
  -> explorer B: trace call path
  -> worker C: scoped patch
  -> reviewer D: test and risk review
  <- summaries / patch / findings
main Codex agent reduces result
```

The main agent plays both dispatcher and reducer. A subagent's value isn't just "one more brain" — it's context isolation: codebase searches, long logs, test output, and call-path exploration can all live in the child's context, keeping the main context from being polluted by noise.

Codex's built-in agent types divide by responsibility:

- **explorer**: reads code, finds paths, locates call chains, searches for related files. Stays read-only and outputs file paths, function names, key evidence, risk points, and suggestions. Its value is cutting the main context's exploration cost, not editing code directly.
- **worker**: edits code, adds tests, implements local features. Must have clear ownership, such as only touching `src/auth/*` or only owning `tests/auth/*`. If two workers can both edit the same logic, the time you saved gets paid back in conflict resolution.
- **default**: the general-purpose fallback, for tasks whose boundaries aren't fully clear yet but that need independent context handling. The more general the worker, the clearer the task boundary it needs.

If your Codex environment offers custom agents or concurrency configuration, it's worth codifying fixed roles like security-reviewer, migration-worker, or docs-editor. But the more agents you have, the clearer the dispatch rules need to be — otherwise you've just moved prompt chaos from the main context into the agent registry.

Concurrency width and recursion depth must be capped. Three workers — security, tests, performance — is already enough for one PR review; if each of those spawns three more, cost and behavior quickly spiral out of control. Exact configuration names depend on your Codex version; these switches aren't necessarily consistent across distribution forms.

Codex doesn't suit breaking apart every complex task. Small fixes aren't worth a fan-out; strongly sequential tasks don't parallelize; when multiple workers would write the same file, design serially first, then execute in parallel; when requirements are still vague, multiple agents only amplify the vagueness.

A more robust delegation example:

```text
Use parallel subagents.

Explorer A: trace the auth request path from UI to API. Read-only.
Explorer B: inspect session persistence and cookie handling. Read-only.
Worker C: patch only src/auth/session.ts after A and B report back.
Reviewer D: review the final diff and test coverage. Read-only.

Main agent must synthesize findings, resolve conflicts, and present one final plan.
```

## Claude Code: Description-Driven, Three Layers Deep

Claude Code's ordinary subagents are closer to a local expert registry. Per the [Claude Code subagents docs](https://docs.anthropic.com/en/docs/claude-code/sub-agents), each subagent has a name, description, system prompt, tool permissions, model, and its own context. The main session decides when to call one based on the description; users can also name one explicitly.

A security reviewer can be written like this:

```text
name: security-reviewer
description: Use proactively after authentication or session code changes
             to review token handling, cookie flags, expiry, and missing tests.
tools: Read, Grep, Glob, Bash
model: sonnet
```

The description is the routing rule — it answers "when should you call me." Written specifically, Claude tends to invoke it at the right moments; written too broadly (say, "review code quality"), it may show up constantly and become noise.

Ordinary subagents are short-lived. The main session invokes them, they execute in an independent context, and they return a summary. They don't naturally become long-term roles and don't negotiate with other subagents by default. They suit context-noisy work: exploration, review, log analysis, localized debugging, codebase comprehension.

The built-in Explore, Plan, and General-purpose are three default worker profiles: Explore leans read-only, Plan does research (exploration material goes into the child context to keep the main context from bloating), and General-purpose is broader and handles multi-step tasks.

The difference from Codex is the trigger threshold. Codex waits for explicit user authorization by default; Claude Code can delegate automatically based on descriptions. Codex asks "has the user authorized parallelism"; Claude Code asks "is there a description matching the current task."

Ordinary Claude subagents are still a star:

```text
main Claude session
  -> Explore
  -> security-reviewer
  -> test-reviewer
  <- summaries
main session decides next step
```

### Agent Teams: Mesh Collaboration

[Agent Teams](https://docs.anthropic.com/en/docs/claude-code/agent-teams) is a different logic altogether. One lead Claude with multiple teammates, each teammate with its own context, able to message each other and share a task list. No longer a star fan-out — closer to a team mesh:

```text
lead Claude
  <-> frontend teammate
  <-> backend teammate
  <-> database teammate
  <-> test teammate
shared task list
direct teammate messages
```

Team mode suits multi-hypothesis problems. A production login failure might originate in frontend state, backend tokens, database sessions, cache, or deployment config. A single agent following one thread anchors early; multiple teammates verifying separately and challenging each other cover more ground.

The costs are just as direct: more context, more messages, more intermediate judgments. Teammates may edit the same file, give conflicting advice, or turn the shared task list into an administrative burden. The lead must clearly own the final merge. A team without ownership easily becomes "several sessions all busy, nobody responsible for the final result."

### The Three Layers

Claude Code splits into three layers:

**Layer 1: ordinary subagents** — description-based auto-routing, independent context, summary returned.

**Layer 2: Agent Teams** — lead + teammates, shared task list, teammates can message each other.

**Layer 3: Agent View / worktrees / batch** — humans orchestrating multiple sessions, writes isolated with worktrees, suited to large-scale mechanical overhauls.

Agent View is more like a human dispatch console. Launch multiple background sessions, watch their states, and step in — pause or take over — when needed. Human involvement is higher; the system doesn't pretend the models handle all coordination automatically.

Worktrees are the file-isolation mechanism. With multiple agents writing to the same repo in one working tree, conflicts are nearly inevitable. Worktrees let each worker edit its own copy and merge at the end.

/batch suits repo-wide migration or mechanical refactoring. Split by directory into multiple worktree-isolated subagents, each agent owning one slice, then run tests and review across everything at the end.

Claude Code's common failure points come from descriptions and permission boundaries: too-broad descriptions misfire; oversized tool permissions overstep; teams without ownership collide; batch runs without acceptance criteria produce piles of patches that look done but are stylistically inconsistent.

A good description should read like a trigger condition:

```text
Use after auth/session/cookie code changes.
Check token handling, cookie flags, expiry, replay risk, and missing tests.
Return findings with file paths and severity.
Do not modify files.
```

Claude Code's initiative comes from descriptions — and so does its controllability.

## OpenClaw: The Multi-Entry Gateway

OpenClaw starts from a different place than Codex or Claude Code. Those two mostly operate inside a single coding session; OpenClaw faces a multi-channel event stream first — closer to a self-hosted gateway that connects WhatsApp, Telegram, Discord, Slack, and other channels to an agent runtime.

In OpenClaw, what arrives isn't necessarily a unified "task." It might come from the ops channel on the company Slack, a private Telegram, a Discord thread. Different entry points mean different identities, permissions, contexts, and risk. So OpenClaw's first layer isn't subagents — it's routing:

```text
incoming message
  -> channel/account/thread/peer matching
  -> selected agent
  -> agent workspace + session store
  -> response or background task
```

Agents can be selected by rules like peer, thread inheritance, Discord guild/role, Slack team, accountId, or channel-level fallback. Messages from the Slack ops channel go to the ops agent; from private Telegram to the deep work agent; from the household entry to a low-privilege assistant.

The trigger isn't the user saying "spawn a subagent," nor the model matching a description — it's the event-entry binding. OpenClaw first answers "which agent does this message belong to," and only then whether that agent should split the task.

An agent in OpenClaw is more like an isolated runtime unit. Each agent has its own workspace (AGENTS.md, SOUL.md, USER.md, notes, persona rules), its own agentDir (credentials, model registry, per-agent config), and its own session store. Mind the boundary: sub-agent auth resolves by agent id, but main profiles are merged in as a fallback — so it's not "every agent's credentials fully hard-isolated." More precisely, it's isolation of agent-level config, workspace, sessions, and tool policy.

Much of the multi-agent value comes from isolation — entry-identity isolation, context isolation, permission isolation, tool isolation. The ops agent can have logging and deployment tools; the household assistant shouldn't have dangerous shell access; the deep work agent can hold long-term project context; a throwaway chat agent shouldn't share any of that state.

The second layer is the background subagent. An existing agent can launch a background agent run via `/subagents` spawn or `sessions_spawn`. You get back a run id and the main conversation doesn't block. The child agent runs in its own session and announces results when done.

Similar to Codex's fan-out, but the lifecycle differs. Codex's child agents are more like parallel workers inside the current task, with the main agent waiting for results to merge; OpenClaw's background subagents are more like async jobs, fitting always-on chat scenarios. Have it check logs, run research, wait on slow tools — the main conversation continues without being stuck in the same turn.

Nesting is allowed but heavily restricted by default. `maxSpawnDepth` defaults to 1. Raised to 2, tree structures where an orchestrator dispatches workers become possible, but child counts and concurrency stay capped, and depth-2 workers cannot spawn further.

The third layer is ACP Agents. OpenClaw can plug in external coding harnesses (Codex, Claude Code, Cursor, Gemini CLI). When the user says "run this in Codex," OpenClaw can route to the Codex runtime. It doesn't need its native subagents to cover every execution scenario — it turns itself into the unified entry point.

The three layers:

```text
Routing layer:
  channel/account/thread/peer -> agent

Agent isolation layer:
  workspace / agentDir / session store / sandbox / tool policy

Execution layer:
  native background subagent
  or external ACP harness
```

OpenClaw's engineering focus isn't "how to make several agents think together" but "how to keep a network of agents with different entry points, identities, and permissions running stably for the long haul." It's closer to an agent operating system or message gateway than a parallelizer for one-off coding tasks.

## Hermes: RPC for Short Tasks, a Durable Queue for Long Ones

Hermes splits short-horizon parallelism and long-horizon collaboration into two primitives: delegate\_task and Kanban.

### delegate\_task: Short-Horizon Parallelism

The parent agent initiates the call, a child agent executes, a summary comes back. Like an RPC. Hermes docs say agents choose delegation automatically based on task complexity, but mechanically it still works by spawning a child agent via delegate\_task:

```text
parent agent
  -> delegate_task(goal, context)
    -> child A
    -> child B
    -> child C
  <- ordered summaries
parent continues
```

The child agent gets a fresh conversation, restricted tools, and its own terminal session. It doesn't know the parent agent's full context — only what's written in the goal and context.

The docs' line that "subagents know nothing" is critical. A child agent doesn't inherit background automatically. The parent must write in the project path, error messages, relevant files, task goals, acceptance criteria, no-go items, and output format. Writing only "fix the error" is like handing an incomplete brief to a new colleague.

The limits are explicit: at most 3 concurrent children by default, with an error raised beyond that instead of silent truncation; batch results return in input order; active children are interrupted together when the parent turn is interrupted; by default a leaf subagent cannot delegate further; nesting requires making the child an orchestrator and raising max spawn depth. Three levels deep with 3 concurrent each is already 27 leaf agents.

Leaf workers are further restricted: they cannot call delegate\_task again, cannot clarify with the user, cannot write shared persistent memory, cannot message across platforms, and cannot use certain dangerous execution tools. Short tasks can run in parallel — but parallel width, recursion depth, tool permissions, and interrupt propagation all have to stay controlled.

### Kanban: The Durable Queue

Kanban isn't a subagent — it's a durable queue plus a state machine. Tasks, handoffs, and comments are written to a SQLite task board. Workers have profiles, names, and memory. The dispatcher pulls up workers by assignee. Tasks can block, unblock, and retry, and can wait for human input.

The difference between the two task kinds, viewed by lifecycle:

```text
delegate_task:
  temporary child, parent agent waits for the result
  state lives mostly within the current call
  suits parallel research, checks, and local fixes lasting seconds to minutes

Kanban:
  durable task, worker profiles take over in relay
  state lives on the board
  suits work spanning turns and days, waiting on humans, retry on failure, audits
```

Three researchers each checking one source and then pooling results — delegate\_task. A two-day research report — gather material first, then analyze, then draft, then review — possibly waiting for a human to add direction midway — that goes to Kanban.

Mixing up the two task kinds is a common failure mode. Putting short tasks on Kanban feels ponderous; running long tasks through delegate\_task loses state and makes retry and handoff hard. The other failure point is writing too little context — Hermes states the risk right in the docs: the child doesn't know the parent's context, and without enough information it can only guess.

## Qoder: A Productized Star of Experts

Per the [Qoder Experts docs](https://docs.qoder.com/user-guide/quest/experts-mode.md), it takes another road entirely: turning multi-agent collaboration into a product-grade experience instead of making users assemble the blocks themselves. In Experts mode the user states a need, and the Team Lead automatically decomposes tasks, assembles the expert team, runs execution in parallel, and delivers.

Its topology is a star with planning in front. The Team Lead is the sole dispatcher and reducer; experts execute in parallel without waiting on each other, and results flow back to the Team Lead for synthesis. It closely resembles Codex's star fan-out/fan-in, but Qoder wraps two things into the product:

**An upfront planning stage.** Before execution, the Team Lead generates a structured implementation plan the user can review, edit, and confirm — only then does the expert team start. This effectively exposes the delegation-contract authoring process to the user: the Team Lead drafts the contract for you, you sign it, then it executes. Codex and Claude Code have no such explicit intermediate step — you either write the delegation instructions yourself or rely on description matching.

**Real-time visualization.** The Expert Team Canvas lets the user watch every expert's progress, execution steps, and output in one panel. This solves a chronic pain point of multi-agent systems: observability. Earlier I called "no observation and no audit" an anti-pattern; Qoder built the fix straight into the product.

Expert roles are predefined: frontend, backend, QA, code review, research, ops, UX design. Each expert has its own context and toolset. Similar to Codex's explorer / worker / default split, but Qoder maps role names directly onto software engineering's functional divisions, which lowers the user's comprehension cost.

```text
user request
  -> Team Lead: understand requirements, generate plan, user confirms
  -> frontend expert + backend expert + QA expert + code review expert (parallel)
  <- outputs from each expert
  -> Team Lead synthesizes, gates quality
  -> deliver results
```

The trigger mode is more precisely auto-orchestration within a mode: the user switches to Experts mode first, then describes the need; within that mode the Team Lead generates the plan, splits tasks, and pulls in experts. Simple, well-defined file edits still fit plain agent mode better. Qoder's docs mention roughly a 67% quality improvement in internal testing, but the task set, scoring criteria, and baseline definition aren't published — treat with caution.

Qoder also does several things worth noting:

**Sandboxed terminals.** Per the [Terminal and Sandbox docs](https://docs.qoder.com/user-guide/quest/terminal-and-sandbox.md), commands are handled by risk tier: ordinary commands run directly, potentially dangerous ones go into a sandbox; only when the sandbox can't complete the job is a permission escalation requested. This directly reshapes the execution sandbox design — the user intervenes less often, while risk is caught jointly by sandboxing and escalation approval.

**Extensible experts.** Users can append Skills and MCP to built-in experts, or create custom subagents to join the team. Close to Claude Code's subagent registry idea — the more experts, the clearer the dispatch rules need to be.

**A self-evolving mechanism.** Two layers: Expert Skill (individual evolution, sharpening a specific capability with each task) and Team Skill (team evolution, recording squad experience and reusing past lineups for similar tasks). It's an interesting design — most multi-agent systems are stateless and start from zero each time. Qoder tries to persist its scheduling experience. How well it works has no public data yet.

**Few human intervention points.** User confirmation is needed only when a terminal command hits the blacklist, tool calls hit their cap, or something abnormal happens. Qoder chooses to trust the Team Lead's judgment, at the cost of a weaker sense of user control. Codex leans toward explicit authorization and a stronger sense of control.

Qoder's positioning is clear: developers who don't want to build multi-agent pipelines themselves and just want to state a need and get a result. It folds the trigger decisions, expert configuration, and result synthesis that Codex and Claude Code leave to the user into the Team Lead's job. The upside is a low barrier to entry; the downside is limited flexibility — you can hardly control each worker's permissions and ownership as precisely as in Codex.

## Six Scenarios

### PR review

For a mid-sized PR, Codex or ordinary Claude Code subagents are both enough. Open one read-only worker each for security, tests, and performance, with the main agent synthesizing. No team mesh needed; workers don't need to talk much. What matters more is spelling out the review dimensions, the output format, and whether file changes are allowed.

Codex:

```text
Use three read-only subagents: security, tests, and maintainability.
Each should return findings with file paths and severity.
Do not modify files. Main agent synthesizes one review.
```

Claude Code: write security-reviewer and test-reviewer as ordinary description-driven subagents that show up automatically after the relevant code changes.

### Production login failure

Suits a team or parallel exploration. The failure could be in frontend state, token issuance, session storage, cache, or deployment config. Codex explicitly spawns multiple explorers to check UI, API, DB, and cache separately, with the main agent merging. Claude Code Agent Teams is better when teammates should challenge each other's assumptions.

Starting with multiple workers writing fixes is not recommended. Locate first with read-only parallelism, then have one worker write the patch, then a reviewer check it. A multi-agent first phase should widen observation, not rush to widen writes.

### Multi-channel personal assistant

Not Codex or Claude Code territory. WhatsApp, Telegram, Slack, and Discord need routing, entry-identity isolation, permission isolation, and a session store. OpenClaw fits this problem better. The concern isn't "several agents working together" but "which entry can trigger which agent, with which tools, where state lives, and how credentials and tool permissions are constrained."

A sensible design: the Slack ops channel goes to the ops agent with log-read and low-risk deployment-query tools; private Telegram goes to the deep work agent holding personal project context; the household entry goes to a low-privilege assistant that can't touch the shell or company accounts. Multi-agent is first about isolation boundaries, not a collaboration performance.

### A two-day research report

One-shot subagents aren't enough. You need task decomposition, state tracking, material handoffs, human comments, and failure retries. A durable board like Hermes Kanban fits better. Set up the board first: gather material, clean material, analyze viewpoints, first draft, review. Each task has an assignee, dependencies, acceptance criteria, and a comment area.

Inside a specific task (say, "check three official docs separately"), use delegate\_task for short-horizon parallelism. Kanban owns the lifecycle; delegate\_task owns local parallelism. Keep those two layers straight and the system won't end up both ponderous and lossy.

### repo-wide migration

Fits worktrees + batch. Split by directory or module, not by "let a few agents figure it out among themselves." Each worker owns a slice of the file space; run tests and review across everything at the end. Claude Code's worktrees / batch fits this scenario best; Codex can also assign workers file scopes, but ownership must be written out clearly.

The common mistake is splitting by role — "one agent thinks, one agent implements, one agent tests." For a repo-wide migration, the better split is by file boundary: `packages/api`, `packages/web`, `packages/shared`. File boundaries reduce conflicts more than abstract roles do.

### Full-stack feature development

"Build a user management module with registration, login, and profile management" — for end-to-end full-stack asks like this, Qoder Experts' productized wrapper is the most direct. The Team Lead generates the plan automatically, frontend and backend experts develop in parallel, QA writes tests in sync, and code review gates quality. The user never designs a delegation contract, configures worker profiles, or worries about merge strategy.

Do the same with Codex or Claude Code and the user writes the delegation instructions, configures explorer/worker/reviewer permission boundaries, and resolves result conflicts personally. Qoder wraps all of it into the Team Lead's duties, at the price of flexibility — you can hardly control "this worker only touches src/auth/" as precisely as in Codex.

The other difference is visualization. Qoder's Expert Team Canvas shows you directly what each expert is doing and how far along it is. Running multi-agent parallelism with Codex or Claude Code, observability usually means logs and session lists — far lower information density.

## Seven Anti-Patterns

**Treating complexity as a trigger.** A complex task doesn't mean it should run in parallel. When subtasks depend tightly on each other (understand the business rules first, then decide the data model, then write the migration), that's a pipeline, not a fan-out.

**No delegation contract.** Without paths, the error scene, acceptance criteria, and no-go items, workers can only guess. Guessing right is luck; guessing wrong is the norm.

**Multiple workers writing the same code.** Multi-agent's worst case is parallel writes with no ownership. When parallel writes are unavoidable, draw boundaries first by directory, module, or test files; if you can't draw boundaries, don't write in parallel yet.

**No reducer.** After multiple agents return results, someone must make trade-offs and merge, dedupe, order, and accept them. Multi-agent without a reducer is just a stack of opinions.

**Queues for short tasks, RPC for long ones.** A durable board slows feedback on short tasks; one-shot subagents lose state on long ones. Hermes splitting this into delegate\_task and Kanban is a fine engineering reminder.

**Permissions too broad.** A review agent shouldn't write files; a household agent shouldn't hold the company shell; a leaf worker doesn't necessarily need to spawn children. The wider the permissions, the less predictable the scheduling.

**No observation or audit.** A multi-agent system needs to know who triggered whom, what context was passed, which tools were used, what summary came back, and where it failed. Otherwise, when something breaks, all you can do is pore over a pile of chat logs and guess.

## An Order for Choosing

When designing for multiple agents, ask in this order:

1. **Can a single agent do it?** If yes, don't split yet. For small changes, strong sequencing, or vague requirements, a single agent is the most stable.
2. **Will the main context get polluted?** Long logs, big searches, cross-directory reading, and multiple failure stacks muddy the main agent. Offloading to an explorer or read-only subagent makes sense.
3. **Can the subtasks run independently?** Security review, test review, and performance review can parallelize; locating a bug before deciding how to fix it fits a pipeline better.
4. **Must results return within this turn?** If yes, fork/join; if not, a background job; for spanning days, retrying, or waiting on humans, a durable queue or Kanban.
5. **Do workers need to challenge each other?** If they only research separately, a star is enough; consider a team mesh only when they must question each other and share task state.
6. **Will files be written in parallel?** When multiple workers write files, write down ownership first. Who edits which directory, who stays read-only, who merges last. Without those constraints, don't write in parallel.
7. **Is entry-point isolation needed?** For systems with many channels, identities, and permissions, prefer gateway routing over dumping every message into one omnipotent agent.
8. **How does it recover from failure?** Can it retry? Block? Preserve handoffs? Can you see the subtasks' evidence? These determine whether the system can run for the long haul.

## A Delegation Contract Template

If you take away only one practical template:

```text
Role:
  read-only auth explorer / scoped implementation worker / security reviewer

Goal:
  what to answer or accomplish, and where the boundary lies

Context:
  project path, relevant files, error messages, user goals, existing conclusions

Allowed actions:
  which files can be read; whether commands, file writes, or network access are allowed

Ownership:
  if writing is allowed, which directories or files only

Forbidden actions:
  which files not to touch, which refactors not to attempt, do not ask the user, do not spawn further children

Output format:
  findings / patch summary / test result / confidence / open questions

Stop condition:
  what counts as done, and when to stop and report a blocker
```

This template addresses the basics of multi-agent work: context, permissions, boundaries, output, and the merge. Without them, even the fanciest topology degenerates into random parallelism.

## Which System Fits Where

Codex fits explicit, controllable star-shaped parallelism. Claude Code fits description-driven expert delegation and can handle more complex collaboration in team and batch scenarios. OpenClaw fits multi-entry, always-on agent networks with permission isolation. Hermes fits keeping short-horizon parallelism and long-horizon queues separate — delegate\_task for ad-hoc fork/join, Kanban for cross-turn workflows. Qoder fits full-stack development when you don't want to build the pipeline and just want to state a need and get a result — it wraps triggering, planning, scheduling, and merging into the product.

A task that just needs four threads checked faster: star subagents. A question that needs multiple parties challenging each other: team mesh. Messages arriving from different channels and identities: gateway routing. Tasks that span days, retry, or wait on humans: a durable board. Multiple workers writing the same code: stop and write out ownership first. Full-stack development with minimum fuss: a productized option like Qoder.

Design the boundaries first; add agents after.

