# AI Psychosis: When MTTR Fanaticism Meets Resilience


<!-- more -->

I have a strong intuition: some companies in the tech industry right now are going through a full-blown AI psychosis, and inside those companies, rational conversation is simply impossible. I'm not talking about strangers — I'm talking about personal friends I deeply respect. That leaves me worried about how this ends.

This fear has a specific source. I lived through the great MTBF (mean time between failures) vs MTTR (mean time to recovery) debate when infrastructure moved from traditional ops to cloud and cloud automation. Now those exact same arguments are resurfacing in a new costume — only the scope has widened from infrastructure to the entire software industry, and possibly to the whole world.

## From Infrastructure to Software: Same Lesson, Bigger Table

One of the core arguments of the cloud transition: should you prioritize MTBF (how long the system runs without failing) or MTTR (how fast you recover when it does)?

Traditional ops culture emphasizes MTBF — preventing failures through strict change approval, redundant design, and thorough testing. Cloud-native culture leans toward MTTR — accepting that failures are inevitable and putting energy into fast detection and fast recovery. Netflix's Chaos Monkey is the extreme practice of MTTR philosophy: inject failures on purpose to prove your recovery capabilities are strong enough.

The debate eventually reached a subtle equilibrium: MTTR is indeed a good measure of operational maturity, but you can't abandon attention to MTBF on that account. Charity Majors (CEO of Honeycomb) has stressed this repeatedly — fast recovery is a good thing, but if your system crashes every five minutes and recovers in five seconds, your users are still suffering.

The DORA (DevOps Research and Assessment) team, sponsored by Google, has researched this for over a decade. Their 2025 report reached a key conclusion: AI acts as an amplifier, but the biggest returns come from improving the underlying sociotechnical systems. Tools cannot replace systemic engineering practice.

Now that argument has spread from infrastructure to all of software development. Advocates of AI coding tools have taken an almost uniform, extreme MTTR position: "Bugs are fine, because agents can fix them at a speed and scale humans can't touch!"

## MTTR Fanaticism: A Disaster Machine That Looks Healthy

This "fast fixes are all that matter" mindset has a fatal blind spot.

The key lesson we learned in infrastructure: you can automate yourself into a highly resilient disaster machine. A system can pass every local health check while becoming completely incomprehensible at the global level. This isn't a theoretical exercise — it's a reality that AWS, Google Cloud, and Azure have each confirmed in painful post-incident reports.

Richard Cook, the well-known safety engineering researcher, wrote a series of distilled observations in [How Complex Systems Fail](https://how.complexsystems.fail/). Several of them map onto the current AI coding frenzy in deeply unsettling ways:

- **Disasters require a coincidence of multiple small failures; a single point of failure isn't enough.** Each small failure looks harmless in isolation; only their combination is enough to trigger catastrophe. That means there are far more unnoticed failure trajectories than actual accidents.
- **Complex systems always run in degraded mode.** The system is never fully healthy; the failures just haven't accumulated to the critical point yet.
- **Post-incident analyses almost never reconstruct the decision process accurately.** People unconsciously adjust the narrative to make past decisions look reasonable.

Carry these observations over to AI-assisted programming:

Every piece of code an AI agent generates introduces a tiny inconsistency — a missed edge case, an inappropriate abstraction, a design choice incompatible with the existing architecture — each individually quick to fix. But they stack up and accumulate deep in the system, while nobody holds a global view that could spot this failure trajectory.

## Red Alerts Behind Four Green Metrics

Conversations with friends in the industry unsettle me most. When I try to raise these concerns, the responses come back as an almost standardized set of rebuttal talking points:

**"Test coverage is 100%"**

Test coverage is a widely misunderstood metric. Martin Fowler notes in [Technical Debt](https://martinfowler.com/bliki/TechnicalDebt.html) that software systems naturally accumulate cruft (degradation of internal quality), and the interest on technical debt shows up as "the extra effort required to add new features." AI tools can send coverage numbers soaring, but if the tests themselves are AI-generated and only verify what the code does — not whether the business intent is correct — you end up with a test suite that precisely verifies the wrong behavior.

Data from the Stack Overflow 2025 Developer Survey backs the worry: **46% of developers distrust the accuracy of AI tool output**, and only 3% report "high trust." More interesting still, the more experienced the developer, the deeper the distrust — senior developers hit 20% on "highly distrust," the highest of any group.

**"Bug report counts are dropping"**

A falling bug report count can mean two opposite things: quality improved, or users gave up on reporting. The more likely reality is a third option — the types of bugs AI-generated code introduces have changed. They're no longer obvious crashes or interface errors but deeper architectural rot: performance degradation, data consistency risks, blurring security boundaries. These bugs never show up in the issue tracker, because spotting them requires understanding the system as a whole.

**"Our agents fix bugs 10x faster than humans"**

This is the core argument of MTTR fanaticism. But faster fixes carry an assumption: that fixes don't introduce new problems. In an AI-assisted development pipeline, every fix is itself AI-generated code that can introduce new hidden defects. That creates a positive feedback loop: more bugs → more fixes → more new hidden bugs → even more fixes.

**"We're shipping 3x the code volume of last year"**

Rising change velocity may be the most dangerous health metric of all. Richard Cook's observation applies again: change happens so fast that nobody notices the underlying architecture rotting. Once the system's rate of change exceeds any individual's ability to understand those changes, the system's comprehensibility declines irreversibly.

{{< image src="/pictures/note/ai-mttr-mtbf-metrics-illusion.svg" alt="Metric illusion: bug counts falling, test coverage rising, change velocity up — while global system risk accumulates" caption="While every local metric is green, nobody notices the architecture rotting" >}}

## Ward Cunningham's Debt Metaphor Takes on New Meaning in the AI Era

Ward Cunningham introduced the technical debt concept at OOPSLA 1992. His metaphor was financial debt: if you write code that isn't clean enough, the extra time you pay every time you add a new feature on top of it is the interest on that debt.

Martin Fowler later extended the concept, splitting technical debt into four quadrants: Prudent & Deliberate, Prudent & Inadvertent, Reckless & Deliberate, and Reckless & Inadvertent.

AI-assisted programming is mass-producing a new kind of debt — I call it "Unauditable Debt". Traditional technical debt had at least one virtue: a human wrote it, so another human can read the code and reconstruct the decision logic. AI-generated code has no such property. When the author of the code is no human with context, the "why" of the code is lost.

The DORA 2025 research describes the problem more precisely: AI is an amplifier. If your underlying engineering practices are good, it makes you better; if your engineering practices are flawed, it amplifies those flaws. And this isn't linear amplification — in a complex system, flaws amplify non-linearly.

## Why This Conversation Is So Hard

This may be the most frustrating part. When I raise these concerns, the response is rarely a reasoned, evidence-backed rebuttal — it's closer to reflexive denial.

I understand why. When a person or a company has poured time, money, and narrative into AI coding tools, admitting those tools may be systematically introducing hidden risk means admitting the investment might have pointed the wrong way. That's psychologically hard to accept.

And AI tools do deliver real efficiency gains. The Stack Overflow 2025 survey shows 84% of developers already use them, and 69% of AI agent users say agents improved their productivity. I've written a [coding agent usage guide]({{< ref "posts/2026-05-16-pi-coding-agent-complete-guide.md" >}}) myself and know first-hand how valuable these tools are in daily development. The numbers are real. The problem is that they describe local efficiency, not global health.

It's like a city where every car drives faster (local efficiency up) while the accident rate rises and the road network's overall throughput falls (global efficiency worsening). Every driver feels like a winner — they can feel their own speed — but nobody can perceive network-level congestion.

## The Target Isn't AI — It's Abandoning Engineering Discipline

Let me be clear about my position: I am not against AI coding tools. I use them myself every day. For example, in my earlier [AI programming practice]({{< ref "posts/2026-05-17-ui-first-ai-programming.md" >}}), I explored deriving the PRD backward from UI prototypes to reduce requirement drift — itself an attempt to fight the "arbitrariness" of AI programming with structured process.

I use AI coding tools myself every day. For example, in my earlier [AI programming practice]({{< ref "posts/2026-05-17-ui-first-ai-programming.md" >}}), I explored deriving the PRD backward from UI prototypes to reduce requirement drift — itself an attempt to fight the "arbitrariness" of AI programming with structured process.

But one pattern of use deeply unsettles me: treating AI as a pass to skip engineering discipline. Specifically —

- Letting AI-generated test coverage replace deep review of code correctness
- Letting bug-fix speed replace systematic analysis of bug root causes
- Letting code change volume replace deliberate design of the system architecture's evolution
- Letting AI agents' output throughput replace evaluation of output quality

From infrastructure engineering experience, the healthy approach is to attend to both MTBF and MTTR:

- **On the MTBF side**: invest energy in understanding your system architecture, build defense in depth, keep the code auditable, and make sure every change has a "why" a human can explain
- **On the MTTR side**: use AI tools to accelerate failure detection and repair, automate repetitive work, and expand what an individual engineer can produce

Do both. Do only the latter while pretending the former doesn't matter, and sooner or later it blows up.

## A More Honest Framing for the Conversation

If you're wrestling with something similar — friends or colleagues deep in AI fervor and you don't know how to bring it up — the most effective approach I've found is to skip the specific technical metrics and ask a more fundamental question:

**Is there anyone in your system who can fully explain why it works?**

If the answer is "no, but it has tests and monitoring," the problem already exists. Tests verify behaviors the system once got right; monitoring reflects the system's current behavior. But understanding why the system works — and under what conditions it stops working — requires a human mental model, and that model cannot be replaced by tests or monitoring.

Richard Cook put it well: "Complex systems always run close to their performance limits. A normally running system is not safe — it simply hasn't yet encountered the combination of events that triggers catastrophe."

Moving fast isn't the problem. The problem is moving so fast that nobody understands why the system still runs — and on the day it stops running, nobody knows where to fix it.

