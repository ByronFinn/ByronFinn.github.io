# The Next Phase of AI Coding: Rebuilding the SDLC

- Date: 2026-10-11
- Author: ByF
- URL: https://blog.baifan.site/en/agent-native-sdlc/
- Description: Two years of AI-assisted engineering taught us faster code didn't mean faster delivery. The bottleneck moved downstream to review and verification. The next phase: rebuild the SDLC itself.

---


Two years in, everyone on the team writes code several times faster than before. Delivery hasn't gotten faster. After post-mortems on enough projects, the conclusion converged into one sentence: the bottleneck didn't disappear — it moved from the editor into the review queue and the verification pipeline. This post lays out the judgments we've mined over two years. The last one is directional: the next phase of AI coding is rebuilding the engineering system itself.

<!-- more -->

## Coding Got Faster, Delivery Didn't

Start with a counterintuitive fact: AI has not made software development faster overall, and industry data still doesn't support the claim.

The DORA annual report is the largest-sample engineering-effectiveness research in this field. The 2024 edition ([announcement](https://cloud.google.com/blog/products/devops-sre/announcing-the-2024-dora-report)) regressed adoption against outcomes: every 25% increase in AI adoption came with an estimated 1.5% drop in delivery throughput and a 7.2% drop in delivery stability. The 2025 edition ([announcement](https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report)), drawing on nearly 5,000 practitioners, flipped throughput to a positive correlation; stability stayed negative. The report states the mechanism plainly: AI accelerates software development, and that acceleration exposes weaknesses downstream — without robust automated testing, mature version control practices, and fast feedback loops, rising change volume converts directly into instability.

The caveats matter: this is cross-sectional survey research, and the throughput direction flipped between the two years, so cite the direction, not any single year's point estimate. But two years and two samples gave stability the same sign. That direction is solid.

Theory of Constraints (Goldratt, *The Goal*, 1984) explained this structure long ago: system throughput is set by the narrowest stage. Speeding up a non-bottleneck changes nothing in output; it only piles up work-in-process. Coding used to be software's narrowest stage. AI broke it open, and the constraint moved downstream to review, integration, and verification. That's pipeline math, not a model-capability question.

The fossil record in codebases comes from GitClear. Its 2025 annual report ([link](https://www.gitclear.com/ai_assistant_code_quality_2025_research)) analyzed 211 million changed lines and found 2024 was the first year on record where copy/pasted code exceeded moved (refactoring) code: moved lines fell from 24.1% in 2020 to 9.5% in 2024, while copy/pasted rose from 8.3% to 12.3%. The 2026 report ([link](https://www.gitclear.com/the_ai_code_quality_maintainability_gap)) extends the curve: moved lines are down to 3.8% in the first half of 2026, cross-file function calls have dropped 35% since 2023, and developers now pick duplication over refactoring about five times as often. Duplicated blocks say it even more starkly: by GitClear's detection, the share of commits containing 5+ line duplicated blocks grew roughly tenfold in two years — every copy adds a twin you must hunt down and update whenever that code changes.

Individual perception isn't reliable either. In METR's July 2025 [randomized controlled trial](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/), 16 experienced open-source developers worked 246 real issues in repositories they knew intimately; the group allowed to use AI was actually 19% slower — while they had predicted a 24% speedup beforehand and still believed they'd gotten 20% faster afterward. Perception and measurement inverted completely. The authors documented their limitations candidly (small sample, confidence-interval lower bound of just +2%, no extrapolation to novices). The point is not to declare "AI slows developers down." It's what the study proves incidentally: individual perception of speedup is unreliable, and effectiveness judgments must go to a measurable verification system.

Faster coding does not automatically become faster delivery. Without restructuring review and verification, the extra changes just queue up somewhere downstream.

## The Stronger the Agent, the More the Front Work Matters

Second judgment: the more capable the agent, the higher the demands on the unglamorous work done before coding starts.

The mechanism sits in METR's attribution analysis. Of 20 candidate factors, the first with evidentiary support was over-optimism about AI's usefulness; another was implicit repository context — the agent is like a new contributor: much of a codebase's knowledge was never written down. Which layer of indirection you can't skip, which module you must not touch, how much test coverage is enough. Humans spend years acquiring this judgment. Agents can't get it, so they trial-and-error through delivery, and every error lands downstream. And as agent capability steps up, the boundary of tasks you can safely delegate pushes outward one ring at a time, touching more unwritten knowledge each round. The gap doesn't narrow with capability; it widens.

The only use of upfront planning is making implicit standards explicit. Write the intent clearly, draw the system boundary, nail down the acceptance criteria — then the agent gets a spec; without them it gets a riddle. Claude Code's official best practices divide the workflow into explore, plan, implement, commit (methodology in [our Plan Mode breakdown]({{< ref "posts/2026-06-29-claude-code-plan-mode" >}})), for a simple reason: "Give Claude something that produces a pass or fail, and the loop closes on its own." Verification criteria up front gives execution an anchor.

Cognition (the company behind Devin) put it more starkly in 2025's [Don't Build Multi-Agents](https://cognition.com/blog/dont-build-multi-agents): actions carry implicit decisions, conflicting decisions produce bad results, and that's why shared context is the core of reliability. It's an opinion piece, not an empirical study — but every pit it describes, we hit ourselves over the same two years.

That's how our task-spec rules hardened: state only the goal, the context, the constraints, and the deliverable format; methodology verbs are banned outright. The rule was paid for with one wasted controlled experiment — full post-mortem in [that skill-evaluation post]({{< ref "posts/2026-10-08-evaluating-agent-skills-first-principles" >}}).

The more solid the upfront work, the more reliable the agent's delivery. Two years and several hundred tasks back that rule.

## Code Review Must Become an Engineering System

Once generation volume doubles, review has only two exits: queue up, or let things slide. Queuing costs delivery time; sliding costs stability — DORA's negative correlation measures exactly the sliding. Developer-attitude data adds pressure: in the [Stack Overflow 2025 survey](https://survey.stackoverflow.co/2025/ai), 46% of respondents distrust the accuracy of AI tools, and 75% turn to a human because they don't trust AI answers — the top help-seeking scenario of all.

Adding reviewers doesn't scale — reviewer training can't keep pace with code generation. Adding hours doesn't either — fatigue makes standards drift. What's left: turn review from a hero-driven activity dependent on individual experience into an engineering system that scales horizontally.

That system has at least three layers. Deterministic checks first: anything a script can run, let it — lint, types, tests, builds; exit codes have no gray zone and consume nobody's attention. Codified judgment: judgments that recur in review become rules, patterns, and checkers — write once, apply everywhere. Consistent standards: subjective dimensions get anonymized blind review backed by gold-standard checklists; no score without cited evidence.

Industry now has a complete sample. In April 2026 Atlassian [published](https://www.atlassian.com/blog/ai-at-work/developer-productivity-improved-with-rovo-dev) an internal evaluation of its homegrown AI review system: 1,900+ repositories, over a year of online experimentation, and three stacked quality gates — structured review prompts, factuality filtering, actionability filtering. Median PR cycle time dropped 30.8%; human-written review comments fell 35.6%. The report also carries an honest number: AI review comments saw a 38.7% resolution rate, still below the 44.45% for human comments — machine review hasn't caught up with humans, but it freed humans from the first sieve.

## Inside the Guardrails, the People Closest to the Problem Do the Work

Once review is engineered, a previously impossible option unlocks: let non-engineers make changes directly.

The product manager knows where that button belongs; the designer knows which step users drop off at; the domain expert knows which report column nobody ever reads. Their old path was file a request, wait for scheduling, wait for the release — a two-line change took three weeks. Now permission sandboxes, change-scope constraints, one-click rollback, and automated verification box the risk of "changing it directly" inside a controllable boundary. The people closest to the customer's problem can, for the first time, do fine-grained improvements themselves within that boundary.

There's no industry statistic yet for non-engineers shipping inside guardrails; this judgment comes from practice, not survey data. Non-engineer output typically stalls at the runnable-prototype stage: the main logic holds, but edge cases and long-horizon concerns never quite get there — the last mile still belongs to engineers. Guardrails solve "don't break it," not "good enough." Confusing small in-guardrail improvements with out-of-guardrail system changes underestimates both. I broke down the division-of-labor logic fully in [Thoughts on Team Roles]({{< ref "posts/2026-08-03-team-roles-evolution-ai-era" >}}); one line suffices here: guardrails change who may act; they don't change the scarcity of judgment.

## The Chain of Accountability Ends at People

The list of things agents do well keeps growing: execute, verify, retry, propose alternatives. The other list never moves: when something breaks, who answers for it.

Three authoritative texts nail this down. Atlassian's evaluation states that the final decision to accept or decline a suggestion rests solely with the human reviewer. Anthropic's [agent-building guide](https://www.anthropic.com/engineering/building-effective-agents) lists human review as essential for aligning solutions with broader system requirements. DORA 2025's thesis is one sentence: AI doesn't fix a team; it amplifies what's already there. A broken process just breaks faster.

It shows clearest when something goes wrong. The agent doesn't take the blame for a production incident, doesn't carry the economic responsibility for a misread requirement, and doesn't explain at the retro why it changed what it changed. Accountability flows through the human org structure and never moved out — intent definition, product quality, system architecture, high-risk decisions: these land on the person whose name is on the change.

One more footnote. In February 2026 METR [announced](https://metr.org/blog/2026-02-24-uplift-update/) it was abandoning its developer-productivity experiment: in round two, 30% to 50% of developers admitted deliberately withholding tasks they "wouldn't want to do without AI," systematically distorting the sample. Even the meta-question — how to measure human-agent collaboration — has outgrown the traditional toolkit. If the measurement method itself must be rebuilt around agents, the engineering system certainly does.

## The Next Phase: Treat the Engineering System as the Product

Start from adoption data. Phase one is fully saturated: in DORA 2025, 90% of practitioners use AI at work; [GitHub Octoverse 2025](https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/) counted over 1.13 million public repos pulling in LLM SDKs, up 178% year over year. The tool race has run for a year and a half; individual-level speedup has peaked — the downstream curves in section one are the evidence.

The next phase shifts the axis: rebuild the engineering system itself as a product. Requirements expressed as machine-executable specs, where acceptance criteria are the tests; review carried first by an automated pipeline with humans as the final arbiter; verification elevated from project appendix to first-class citizen — it's the precondition of the agent's closed loop; and org structure follows. DORA's advice to engineering leaders is to treat AI adoption as an organizational transformation, and the report stresses that returns come mainly from strategic investment in platform quality, workflows, and collaboration.

After the rebuild, the division of labor is clear enough to write into a job description: humans define intent, make the calls, and own engineering judgment; agents push execution, close the verification loop, and clear the path to delivery. The mission of the engineering system is to push the efficiency of that collaboration to its limit.

Rebuilds of this magnitude have precedent. Compilers rearranged what "programmer" meant; CI/CD rearranged the topology of the engineering system. Agent-native will be the same order of change — I sketched the evolution path in [From Copilot to Autonomous Agent]({{< ref "posts/2026-07-03-ai-coding-tools-future-copilot-to-agent" >}}); now we're into construction drawings.

## What We Don't Have Answers For Yet

Measurement is the first black hole. METR's RCT struggles even at the individual level; there is still no credible causal estimate of AI adoption's net effect on delivery quality at team level, and our internal two-year attributions only reach "strong correlation." Second is the false-positive economics of review automation: the quality gates need human maintenance, and how to weight the cost of false positives pulling humans back against missed defects has no industry-consensus data. Third is the demand side: once capacity doubles, the bottleneck likely moves up again to requirement definition — next time, what needs rebuilding may be the product process itself.

Phase one's race is run. Phase two's engineering has just begun.

