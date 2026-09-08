# Prompt Engineering: From Prompts to Context Engineering


# AI Tutorial: Prompt Engineering

Prompt engineering focuses on designing, optimizing, and strategizing prompts — helping users mobilize the capabilities of large language models more effectively, and pushing their adoption across real-world scenarios and research domains.

## 1. Basic Concepts

### 1.1 What Is Prompt Engineering

A prompt is simply this: you use natural language to tell the model what to do, how to do it, what it may do, and what it must not do. That is all there is to it.

### 1.2 The Essential Anatomy of a Prompt

- **Instruction**: tell the model clearly what you need it to do
- **Context**: relevant background information, giving the model more to work with when making decisions
- **Input Data**: the necessary input — a question, a goal, and so on
- **Output Constraints**: constrain the format, style, or length of the output so the result fits your needs

### 1.3 What Is Context Engineering

Context engineering is an engineering discipline for building, optimizing, and dynamically managing the input context for large language models. It mainly covers:

- **Information gathering and integration**: pulling task-relevant content from multiple data sources
- **Structuring and formatting**: organizing the information and feeding it to the model in a defined format
- **Context management**: managing within a limited context window through trimming, isolation, compression, persistence, and similar techniques
- **Tool and external system integration**: strengthening the model's capabilities by interfacing with external tools and systems

### 1.4 The Operating System Analogy

A large language model (LLM) can be likened to a new kind of operating system (OS), where the context window corresponds to RAM, and context engineering plays the role of the OS scheduler — loading the most critical processes and data into a finite amount of memory.

In essence, context engineering gives an LLM plug-and-play task capability in a specific scenario. At inference time, all a model has is the abilities acquired during training plus the content of its context. With the former fixed, the latter matters enormously.

> **Core insight**: no matter how many rounds the model has executed or interacted over before, the latest round can only reason from the context you provide it — which is exactly why context matters so much at inference time.

Large language models need context. Errors come from insufficient information, not from the model not being good enough — plus the challenge of complex tasks and multi-source information fusion.

**Training and fine-tuning determine what the model can do; context engineering determines how much of that capability actually gets used.**

## 2. Prompt Engineering vs Context Engineering

### 2.1 Prompt Engineering

Uses a sentence, a paragraph, a format, or a role prompt to unlock the model's potential.

**Characteristics:**

- Static, single-turn, instruction-oriented
- Suited to closed tasks and structured answers
- An endless stream of techniques: zero-shot prompting, few-shot prompting, chain-of-thought prompting, and more

### 2.2 Context Engineering

Continuously pulls in relevant information at runtime, makes the best decision based on it, and produces the most appropriate result.

**Characteristics:**

- Dynamic, multi-turn, environment-oriented
- Supports state management, task evolution, chained reasoning
- Has Agent-level operational capability

{{< figure src="/pictures/note/2025-11-05-ai-03-001.png" title="Context engineering Venn diagram" caption="A visual overview of the techniques currently involved in context engineering" class="center" >}}

## 3. The Challenges Context Engineering Faces

### 3.1 Context Length Limits

Feed in too little and the model lacks the information to reason out a good result; feed in too much and its attention scatters, unable to focus. Context engineering is about manufacturing the right context for the model to reason with.

### 3.2 Poisoning

Erroneous information persisting in the context, causing repeated wrong behavior, goal drift, and behavioral loops.

**The problem:**
With an overly long context, wrong or inappropriate information gets mixed in and keeps living there — the Agent may keep repeating the same wrong decisions or actions.

**Important reminder:** a bigger context is not automatically the better choice. It depends on the actual use case and your context engineering strategy. Don't blindly chase giant context windows and ultra-long context assembly — that can make results worse.

**Typical example:**
Large models are great imitators. When reviewing resumes, if the previous 20 were all rejections, the model may imitate that pattern and reject the next resume even if it is good. LLMs tend to imitate — if the samples you supply follow a repetitive pattern, the model will imitate the samples and keep repeating the same behavior.

**The fix:**
Introduce more diversity. Do this by adding small structured variations to actions and observations — different serialization templates, reworded phrasing, slight perturbations in order or format. This kind of "controlled randomness" helps break fixed patterns and re-anchor the model's attention.

> **Field note:** don't let few-shot prompting lock you into one groove. The more uniform your context, the more fragile your agent.

**The underlying principle:** whether an LLM falls into hallucinated error loops or repeats itself because of one-shot/few-shot prompting, the root cause is the same — the context is saturated with irrelevant, misleading, or wrong information, biasing the model toward wrong results. This bias cannot be corrected quickly in the short term, so you need detection and prevention mechanisms.

### 3.3 Attention Drift (Misalignment)

Longer context degrades results. The core issue is distraction: the model's attention gets spread across the context, and worse, drifts away from the goal or instructions toward irrelevant context.

**Symptoms:**

- Overly long context
- Similar but irrelevant context
- Once context reaches a certain length, the model over-focuses on the context and ignores knowledge acquired during training
- Context so long the model cannot focus on the instruction

**The fix:**
Refresh the todo list every turn to lock the model's attention. Placing the latest todo list at the end works even better.

### 3.4 Semantic Conflict and Confusion

Ambiguity, contradiction, or redundancy in the context makes the model hard-pressed to understand and discern, so the final result misses expectations.

**Why it happens:**
Newly introduced information or tools contradict what is already in the context. The model gets confused, makes wrong judgments, or even behaves unstably — "picking at random".

**Typical examples:**

- **Multi-turn interaction problem:** splitting what could be a single-turn interaction into many turns degrades model performance significantly. Each turn gives the model only a partial, incomplete view; early answers are incomplete or outright wrong, and those errors persist in the context and color the model's judgment when the final answer is generated.
- **Tool conflicts:** mount too many tools — built-in or MCP — and similar descriptions can leave the model unable to choose. The result is a non-deterministic pick among lookalike tools (call it a random choice), producing unstable or even wrong output.

**The comparative advantage:** handing over the full information in a single turn lets the model generate less erroneous information.

## 4. The Context Engineering Technology Stack

### 4.1 Context Augmentation

**Main purpose:** supply information

**Techniques:**

- **prompt**: prompt engineering
- **RAG**: retrieval-augmented generation
- **tools**: tool calling (FunctionCall, MCP, skills)

### 4.2 Context Optimization

**Main purpose:** clean and optimize the context

#### Context isolation

- **Split stateless tasks**: hand them to sub-agents; each sub-agent gets an independent context
- **Memory systems**: manage long-term and short-term memory separately, pulling each in only when needed
- **Specialized contexts**: configure dedicated contexts for specialized tasks — medical, legal, coding, and so on

#### Context compression

- **Extractive Summarization**: directly select the most relevant passages and sentences from the source
- **Abstractive Summarization**: summarize the information in new words, usually with an LLM
- **Structured Summarization**: extract structured information such as knowledge points, tasks, and goals — to-do lists, decision paths
- **Self-summarization**: after each dialogue turn, the model automatically summarizes that turn and passes it along as input, forming a compressed context chain
- **Summarized Memory**: combined with a memory mechanism, historical summaries are referenced as long-term memory
- **Time-based Pruning**: keep only the most recent or critical time spans of context, dropping historical redundancy to improve reasoning accuracy

### 4.3 Context Persistence

**Main purpose:** retain information

**How it is done:** persistence services backed by external memory modules — file systems or databases.

## 5. Practical Advice and Best Practices

1. **Balance context length**: pick the right context size for the task; avoid both too long and too short
2. **Prevent context poisoning**: clean and refresh the context regularly; introduce diversity to prevent pattern lock-in
3. **Manage attention focus**: use tools like todo lists to lock the model's attention
4. **Avoid semantic conflicts**: keep the context consistent and logically coherent
5. **Choose the right technique mix**: flexibly combine augmentation, optimization, and persistence per scenario

---

## 📚 Further Reading

### 🔗 AI LLM Systematic Tutorials Series

1. **[A Complete Guide to AI LLMs]({{< ref "/posts/2025-11-05-ai-llm-tutorial-token-vector-basics.md" >}})** — tokens and vectors explained in depth, from the ground up
2. **[Transformer Architecture Deep Dive]({{< ref "/posts/2025-11-05-transformer-attention-mechanism-deep-dive.md" >}})** — the attention mechanism and the core technology behind LLMs
3. **[This post] Prompt Engineering Complete Guide** — a hands-on guide from prompt engineering to context engineering
4. **[AI Technical Glossary]({{< ref "/posts/2025-11-05-ai-technical-glossary-complete-guide.md" >}})** — 270+ terms and a dictionary of the AI technology landscape

### 🎯 Practical Advice

- **Theory first**: get comfortable with LLM fundamentals before diving into the hands-on techniques here
- **Understand the architecture**: a deep grasp of the Transformer helps you design better prompts
- **Terminology reference**: when you hit a technical term during development, look it up in the AI glossary anytime

---

