# The Physical Cost of Context Compression: KV Cache Pressure, Attention Decay, and Lossy Summarization

- Date: 2026-05-23
- Author: ByF
- URL: https://blog.baifan.site/en/claude-code-context-compression/
- Description: Deconstructing Claude Code's context compression pipeline: from Transformer KV Cache VRAM scaling and attention dilution to dynamic summarization entropy, Lost-in-the-Middle traps, and prompt caching invalidation.

---


Large language models possess no biological memory at the hardware tier; they operate entirely on Key-Value Caches that scale linearly in GPU High-Bandwidth Memory (HBM) alongside attention weight distributions that mathematically dilute as sequence length grows. The notion of long-horizon conversations presented by Claude Code is, at its engineering core, an eviction and compaction pipeline operating within the tight margins of memory capacity and numerical precision, trading away information entropy and prefix caching efficiency.

<!-- more -->

During extended programming sessions, developers frequently find themselves confounded by an AI assistant's sudden amnesia: an API contract painstakingly agreed upon in turn 5 is completely ignored by turn 25; a type definition resolved earlier is silently reverted back to a buggy state immediately following a `/compact` command. This is the direct consequence of physical memory boundaries colliding with the mathematics of self-attention.

## Physical Constraints of the Hardware Substrate: KV Cache and Memory Scaling

In the autoregressive decode phase of Transformer models, computing attention over historical tokens without redundant matrix projections requires caching every layer's generated Key and Value tensors directly in GPU VRAM—the Key-Value (KV) Cache.

The physical VRAM footprint of a single inference session during generation can be derived rigorously. Let the model depth be $L$ layers, hidden dimension $D$, and total attention heads $H$. Under modern Grouped Query Attention (GQA) architectures, let $H_{kv}$ denote the count of Key/Value heads, with each head carrying dimension $D_h = D / H$. For a context length of $S$ tokens under FP16 precision (2 bytes per scalar), the memory footprint of the KV Cache is:

$$\text{KV Cache Size} = 2 \times 2 \times L \times H_{kv} \times D_h \times S \text{ bytes} = 4 \times L \times H_{kv} \times D_h \times S \text{ bytes}$$

Consider a representative 70B-parameter foundation model ($L=80$, $H_{kv}=8$, $D_h=128$). Each additional token added to the context requires approximately $320 \text{ KB}$ of dedicated GPU memory. As the sequence extends toward 200,000 tokens:

$$\text{Memory} \approx 4 \times 80 \times 8 \times 128 \times 200,000 \approx 65.5 \text{ GB}$$

This astronomical memory footprint belongs to a **single concurrent request**. In production multi-tenant environments, no cloud infrastructure provider can allow an arbitrary session's unpruned conversation history to monopolize scarce HBM without aggressive eviction policies.

Equally brutal is the wall of Time to First Token (TTFT). Without hitting a prefill cache, recomputing the attention matrix across a 150k token context carries quadratic computational complexity $O(S^2)$. Unmitigated long-context passes cause prompt-processing latency to climb past dozens of seconds, destroying the sub-second interactivity required by interactive terminal tooling.

## Mathematical and Cognitive Degradation: Attention Dilution and the Lost-in-the-Middle Trap

Beyond hardware VRAM saturation, extended context windows suffer severe numerical degradation via attention dilution. Recall the canonical self-attention formulation:

$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{Q K^T}{\sqrt{d_k}}\right) V$$

In the softmax layer, the attention weight vector for any given query token must normalize to unity across all historical positions:

$$\alpha_{i,j} = \frac{\exp\left(\frac{q_i k_j^T}{\sqrt{d_k}}\right)}{\sum_{m=1}^S \exp\left(\frac{q_i k_m^T}{\sqrt{d_k}}\right)}$$

When sequence length $S$ expands from 2,000 to 150,000, the summation terms in the denominator increase by nearly two orders of magnitude. Even with Rotary Position Embedding (RoPE) context extension techniques, background tokens inevitably bleed away finite probability mass.

Liu et al. (2023) in *Lost in the Middle: How Language Models Use Long Contexts* mapped this fundamental structural decay:

```
Retrieval & Reasoning Accuracy
100% |  \                                            /
     |   \                                          /
 75% |    \                                        /
     |     \                                      /
 50% |      \           U-Shaped Attention Trough /
     |       \__________________________________/
  0% +------------------------------------------------->
     Context Beginning (System Prompt)   Middle History (Tool Logs)   Context End (Recent Observation)
```

The model exhibits peak recall sensitivity for tokens positioned at the very front of the context (system identity instructions and tool definitions) and at the very tail (the immediate user command and most recent execution output). Intermediate logs, earlier file snapshots, and historical architectural decisions sink into an attention trough. Trusting an LLM to accurately recall a transient function signature buried 40 turns deep in historical terminal output ignores the statistical reality of attention weights.

## The Claude Code Compaction Pipeline and Lossy Propagation

To reconcile memory constraints with cognitive degradation, Claude Code implements a four-stage tiered compaction pipeline. While it preserves the outward illusion of uninterrupted memory, each stage exacts an explicit entropy cost.

### 1. Observation Trimming

Within the [Think-Act-Observe Loop]({{< ref "posts/2026-06-07-claude-code-think-act-observe-loop.md" >}}), the primary driver of context inflation originates from tool execution logs: commands like `npm test` or `cargo build` routinely dump thousands of lines of compiler traces into the feed.

Claude Code's first line of defense is deterministic output truncation on completed turns. Because source code and test files persist on disk, command output is treated as ephemeral. The pipeline strips historical tool output bodies, retaining only exit codes and terminal head/tail lines. This represents the lowest semantic loss in the entire pipeline.

### 2. Conversation Compaction (`/compact`)

When the total sequence approaches safety watermarks (typically 75% of context capacity), the system initiates automated or manual conversation compaction. A dedicated background invocation prompts the model to summarize its own preceding history:
- Cataloging verified code changes and completed deliverables;
- Listing pending tasks and unresolved architectural roadblocks;
- Replacing thousands of raw multi-turn tokens with an abstracted markdown synopsis.

{{< admonition type="warning" title="Information Entropy and Semantic Drift" open=true >}}
Shannon's entropy theorem $H(X) = -\sum p(x) \log p(x)$ establishes that natural language summarization is an inherently lossy projection from high-entropy technical detail to low-entropy narrative abstractions. When an agent summarizes its own conversation, it inevitably discards compiler edge cases and transient invariants. In a 50-turn refactoring session that undergoes two rounds of `/compact`, the model ends up reasoning over "a summary of a summary". Through this recursive xerox effect, semantic drift accumulates, and the model starts hallucinating constraints derived from syntactic ambiguities in its own earlier notes.
{{< /admonition >}}

### 3. Context Window Management

The pipeline requires active token budgeting. Prior to dispatching an API call to Anthropic endpoints, the orchestrator reserves a static generation budget of 4k to 8k tokens for the model's completion payload.

If the prompt tokens plus this output reservation exceed the maximum context window, earlier message turns are forcibly purged from the active array. This represents unadorned LRU page eviction.

### 4. Dynamic Hierarchical Injection

The onion-layer prompt architecture examined in [System Prompt Engineering]({{< ref "posts/2026-06-12-claude-code-system-prompt-engineering.md" >}}) serves as a dynamic throttling valve here. Core system identities remain resident, while dynamic skills, auxiliary tool schemas, and workspace-wide rules (such as `CLAUDE.md`) are gated behind intent-detection heuristics, keeping baseline token overhead at minimal thresholds.

## The Economic Reality of Scale: Prompt Caching vs. Prefix Invalidation

Context management in modern frontier models is deeply intertwined with the pricing and latency mechanics of **Prompt Caching**.

Anthropic's API pricing structure grants a 90% discount on input tokens that achieve exact prefix cache hits, allowing prefill computation to be bypassed entirely via resident VRAM KV Cache states. This cuts costs by an order of magnitude and brings TTFT down to hundred-millisecond bounds.

```
Standard Request (Cache Hit):
[System Prompt] -> [Tool Defs] -> [Turn 1..N-1] | -> [New User Input]
<---------------- Warm Prefix (90% Off, Sub-sec) ->|  (Cold Prefill)

Post-Compaction Request (Cache Miss):
[System Prompt] -> [Tool Defs] -> [Compacted Summary] | -> [New Input]
<--- Warm --->  (Prefix Invalidated) <----- Cold Prefill (Full Cost) ->
```

Here lies an unavoidable engineering contradiction:
- **Avoiding Compaction**: Context expands linearly. Every turn continues hitting the warm prefix cache, but total token volume swells steadily toward physical limits, steadily eroding model reasoning capability via Lost-in-the-Middle dilution.
- **Executing Compaction**: `/compact` rewrites historical turns into a compressed digest, which **destroys exact prefix byte-level consistency**. Tens of thousands of warm tokens in the remote KV Cache are wiped instantly. In the subsequent turn, the client must pay full price and suffer high TTFT to execute an uncached cold prefill over the newly generated summary.

Balancing memory window preservation against prompt caching efficiency presents a classic systems trade-off where zero-cost abstractions do not exist.

## Deterministic Engineering Solutions: BYF's Observation Masking and Cache Staking

To eliminate the destructive cache misses and semantic drift inherent in blunt compaction, the open-source [BYF](https://github.com/ByronFinn/byf) engine introduced a structured methodology in ADR 0011:

### 1. Watermark-Based Observation Masking

BYF replaces periodic full-history rewrites with stepped capacity thresholds:
- **Low Watermark (60% context utilization)**: Masks ephemeral perceptual output (e.g., voluminous file trees from `glob` or `grep`), collapsing them into single-line metadata markers: `[Glob: 42 files matched]`.
- **High Watermark (80% context utilization)**: Masks non-critical `bash` execution output, preserving solely the trailing 5 lines and exit codes.
- **Contract Immunity**: Code diffs generated by `write_file` and `edit` are granted strict preservation priority, protected against eviction until hitting the 85% emergency boundary.

### 2. Output Offloading to Disk

When any single tool output exceeds 8,000 tokens (such as complete integration test logs or binary dumps), BYF refuses to inject the raw text into context memory. It dumps the payload to a local temporary sandbox file (e.g., `/tmp/byf-output/turn-12.log`), inserting a brief descriptor:
```
[Output truncated. Full content (145KB) written to /tmp/byf-output/turn-12.log.
Showing first 500 chars: ... ]
```
If the agent subsequently requires specific log slices, it must call `read_file` with explicit line offsets. This pattern converts volatile context memory pressure into structured disk I/O.

### 3. Turn-Boundary Cache Staking (`CacheStakingStrategy`)

To ensure steady prefix cache hits against Anthropic endpoints, BYF enforces a "3+1" staking protocol:
- Static stakes: System prompts and tool specifications;
- Dynamic stake: Anchored strictly at the **final token of the preceding turn's Assistant message**.

Throughout a session's lifecycle, the orchestrator refuses to mutate historical assistant turns once emitted. All observation masking operations are applied lazily to historical observations without altering established assistant prefixes, keeping remote cache stakes alive across long command sequences.

## Conclusion: Curing the Illusion of Infinite Memory

Industry evangelism around million-token context windows and lifelong agent memories is largely marketing rhetoric that obscures underlying architectural friction.

A disciplined systems engineer recognizes that a Transformer's attention layer is an expensive, volatile, distance-sensitive physical cache. Relying on recursive lossy summaries to maintain the facade of unbounded context inevitably degrades under the weight of semantic entropy.

In real-world software engineering, when a session exceeds 30 iterative turns and undergoes multiple compactions, the professional move is to commit verified changes via `git commit`, wipe the runtime state, and issue `/clear`. Starting a clean session with unambiguous architectural boundaries is far more dependable than wading through the cognitive sludge of a degraded cache.

