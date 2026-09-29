# Transformer Architecture Deconstructed: Attention, Geometric Scaling, and Memory IO

- Date: 2025-08-05
- Author: ByF
- URL: https://blog.baifan.site/en/transformer-attention-mechanism-deep-dive/
- Description: A first-principles deconstruction of Transformer self-attention: Q/K/V inner-product geometry, Softmax scaling, multi-head subspace dynamics, and FlashAttention tiling against the O(N^2) memory wall.

---


The physical barrier modern large language models confront when scaling context length is rarely raw floating-point throughput (FLOPs). It is the memory-access wall between high-bandwidth memory (HBM) and on-chip static random-access memory (SRAM). The standard Scaled Dot-Product Attention operator established by Vaswani et al. (2017) incurs an $O(N^2)$ memory-traffic overhead as sequence length $N$ grows, reducing self-attention primarily to a memory-bound workload.

<!-- more -->

Understanding the Transformer requires stripping away anthropomorphic cognitive metaphors and grounding the discussion in the geometry of matrix projections alongside the hardware constraints of modern GPUs.

---

## The Physical Reality: Compute-Bound or Memory-Bound?

In GPU architecture, operator throughput is dictated by arithmetic intensity: the number of floating-point operations performed per byte of memory transferred (FLOPs/Byte).

A modern accelerator such as the NVIDIA A100 SXM4 40GB delivers 312 TFLOPS of FP16 Tensor Core compute, paired with 1,555 GB/s of HBM2 bandwidth. The hardware balance point (critical intensity) is:

$$\text{Critical Intensity} = \frac{312 \times 10^{12} \text{ FLOPs/s}}{1555 \times 10^{9} \text{ Bytes/s}} \approx 200 \text{ FLOPs/Byte}$$

When an operator's arithmetic intensity falls below this threshold, compute units starve while waiting on memory transfers, placing the workload in a memory-bound regime.

Standard self-attention is constructed from three distinct tensor operations:

1. Attention score computation: $S = Q K^T$
2. Scaling and normalization: $P = \text{softmax}(S / \sqrt{d_k})$
3. Context aggregation: $O = P V$

Let batch size be $B$, head count be $h$, sequence length be $N$, and head dimension be $d_k$. In Step 2, the Softmax operator reads an intermediate matrix $S$ of dimensions $B \times h \times N \times N$ from HBM into SRAM, evaluates exponentiation and division, and writes back matrix $P$ of equal size.

This step performs roughly $O(B \cdot h \cdot N^2)$ floating-point operations while moving $O(B \cdot h \cdot N^2)$ floats across the memory bus. Its arithmetic intensity is merely a few FLOPs per byte—well below the hardware threshold of 200 FLOPs/Byte.

In long-sequence regimes, the vast majority of execution latency is spent round-tripping this quadratic matrix across HBM, while Tensor Cores idle.

---

## The Geometry of Q/K/V Projections and Dot-Product Addressing

Self-attention projects input token embeddings into distinct representational subspaces via three learnable linear transformation matrices.

Given an input sequence matrix $X \in \mathbb{R}^{N \times d_{\text{model}}}$, the three projections are defined as:

$$Q = X W_Q, \quad K = X W_K, \quad V = X W_V$$

where $W_Q, W_K \in \mathbb{R}^{d_{\text{model}} \times d_k}$ and $W_V \in \mathbb{R}^{d_{\text{model}} \times d_v}$.

### From Additive Attention to General Matrix Multiplies

Prior to Vaswani et al. (2017), sequence-to-sequence models predominantly relied on additive attention (Bahdanau et al., 2014):

$$e_{ij} = v_a^T \tanh(W_a s_{i-1} + U_a h_j)$$

Additive attention deploys a single-hidden-layer feedforward network. While dot-product attention shares similar theoretical asymptotic complexity, its engineering performance diverges drastically on accelerator hardware: dot products map directly to General Matrix Multiplies (GEMM), executing natively on Tensor Cores or systolic arrays at peak pipeline utilization, bypassing the nonlinear activation branches required by additive mechanisms.

### Dynamic Addressing in Inner-Product Spaces

The inner product $q_i \cdot k_j^T = \|q_i\| \|k_j\| \cos \theta_{ij}$ evaluates directional alignment and magnitude projection across high-dimensional geometry:

- **$Q$ (Query)**: A semantic probe encoding what context a given token requires.
- **$K$ (Key)**: A structural index defining what features a token offers.
- **$V$ (Value)**: The content payload incorporated into the target token once an alignment match occurs.

This mechanism implements differentiable soft addressing: rather than pulling from memory via discrete pointers, the model extracts a convex combination of Value vectors weighted by probability distributions derived from inner-product affinities.

---

## Softmax Scaling Factor $\sqrt{d_k}$: Derivation and Numerical Stability

Vaswani et al. (2017) introduced the scaling factor $\frac{1}{\sqrt{d_k}}$ into the attention formulation:

$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{Q K^T}{\sqrt{d_k}}\right) V$$

This term counteracts variance inflation in high-dimensional dot products and preserves gradients across the Softmax operator.

### Derivation of Variance Growth with Dimension $d_k$

Assume the components $q_m, k_m$ ($m = 1, \dots, d_k$) of Query and Key vectors are mutually independent random variables with zero mean and unit variance:

$$\mathbb{E}[q_m] = 0, \quad \text{Var}(q_m) = 1$$
$$\mathbb{E}[k_m] = 0, \quad \text{Var}(k_m) = 1$$

Consider their dot product $z = q \cdot k = \sum_{m=1}^{d_k} q_m k_m$.

By independence:

$$\mathbb{E}[q_m k_m] = \mathbb{E}[q_m] \mathbb{E}[k_m] = 0$$

The variance of each component product is:

$$\text{Var}(q_m k_m) = \mathbb{E}[(q_m k_m)^2] - (\mathbb{E}[q_m k_m])^2 = \mathbb{E}[q_m^2] \mathbb{E}[k_m^2] - 0 = \text{Var}(q_m) \text{Var}(k_m) = 1$$

Summing over all $d_k$ independent dimensions:

$$\mathbb{E}[z] = \sum_{m=1}^{d_k} \mathbb{E}[q_m k_m] = 0$$
$$\text{Var}(z) = \sum_{m=1}^{d_k} \text{Var}(q_m k_m) = \sum_{m=1}^{d_k} 1 = d_k$$

The standard deviation of $z$ scales as $\sigma = \sqrt{d_k}$. For standard dimensions such as $d_k = 64$ or $128$, raw dot-product magnitudes disperse widely, generating extreme positive and negative values.

### Gradient Vanishing in the Softmax Saturation Zone

The partial derivative of the Softmax function with respect to input logit $z_i$ is:

$$S_i = \frac{e^{z_i}}{\sum_{j} e^{z_j}}$$

$$\frac{\partial S_i}{\partial z_j} = S_i (\delta_{ij} - S_j)$$

When an entry $z_i$ substantially exceeds other logits, $S_i \to 1$ while $S_j \to 0$ for all $j \neq i$.

Substituting these values into the Jacobian:
- For index $i$: $S_i (1 - S_i) \approx 1 \times (1 - 1) = 0$
- For other indices $j$: $S_j (0 - S_j) \approx 0$

The operator enters a saturated regime where the Jacobian elements vanish, collapsing backpropagation gradients to zero.

Dividing by $\sqrt{d_k}$ normalizes the variance back to 1:

$$\text{Var}\left(\frac{q \cdot k}{\sqrt{d_k}}\right) = \frac{1}{d_k} \text{Var}(q \cdot k) = 1$$

This keeps logits inside the high-gradient region of the Softmax curve, maintaining stable gradient propagation during optimization.

---

## Multi-Head Attention: Orthogonal Subspaces and Rank Collapse

### Convex Hull Constraints in Single-Head Attention

Single-head self-attention computes an output that is strictly a convex combination:

$$y_i = \sum_{j=1}^N \alpha_{ij} v_j, \quad \text{where } \sum_{j=1}^N \alpha_{ij} = 1, \; \alpha_{ij} \ge 0$$

Every aggregated representation $y_i$ is confined within the convex hull of the input set $\{v_1, \dots, v_N\}$.

When a sequence exhibits multiple orthogonal dependencies simultaneously (such as coreference resolution, subject-verb agreement, and temporal clauses), a single Softmax distribution is dominated by the single largest logit, suppressing subtle contextual features.

### Rank Collapse in Deep Transformer Stacks

Dong et al. (2021) demonstrated in *Attention is Not All You Need: Pure Attention Loses Rank Doubly Exponentially with Depth* that without residual connections and multi-layer perceptrons, stacked self-attention layers suffer from rapid rank collapse:

$$\|A_L - \mathbf{1} v^T\| \le \mathcal{O}(c^{2^L})$$

Output rows converge toward an identical vector, collapsing the matrix rank to 1. Tokens lose representational variance, destroying the model's capacity to represent complex sequential structures.

### Multi-Head Projections as Subspace Decomposition

Vaswani et al. (2017) addressed this geometric limitation via Multi-Head Attention (MHA):

$$\text{MultiHead}(Q, K, V) = \text{Concat}(\text{head}_1, \dots, \text{head}_h) W^O$$

$$\text{head}_i = \text{Attention}(Q W_i^Q, K W_i^K, V W_i^V)$$

The model splits $d_{\text{model}}$ across $h$ subspaces, each of dimension $d_k = d_{\text{model}} / h$.

Each head projects onto an independent geometric hyperplane:
1. Head 1 captures local morphological collocations.
2. Head 2 tracks long-range syntactic dependencies.
3. The linear projection $W^O \in \mathbb{R}^{d_{\text{model}} \times d_{\text{model}}}$ synthesizes representations from these orthogonal subspaces.

This decomposition expands the expressive capacity of the network without inflating overall compute requirements.

---

## Breaking the Memory Wall: FlashAttention and SRAM Tiling

Despite its mathematical elegance, standard self-attention encounters an inescapable bottleneck in practice: the $O(N^2)$ physical memory footprint.

### HBM Bottlenecks in Standard Attention

GPU memory is organized hierarchically:
- **SRAM**: On-chip cache (192KB–228KB per SM on A100), delivering over 19 TB/s aggregate bandwidth, but strictly limited in capacity.
- **HBM**: Off-chip memory (40GB–80GB), providing 1.5–3.3 TB/s bandwidth with substantially higher latency.

Standard execution repeatedly reads and writes large matrices to HBM:

```
[HBM] Q, K  ---> [SRAM] Compute QK^T      ---> [HBM] Write S (O(N^2) memory)
[HBM] S     ---> [SRAM] Compute Softmax   ---> [HBM] Write P (O(N^2) memory)
[HBM] P, V  ---> [SRAM] Compute PV        ---> [HBM] Write O
```

For context length $N = 32,768$, batch size $B = 2$, and head count $h = 32$, a single intermediate matrix $S$ in FP16 consumes:

$$\text{Memory} = 2 \times 32 \times 32768 \times 32768 \times 2 \text{ Bytes} = 137.4 \text{ GB}$$

This intermediate allocation exceeds the capacity of an 80GB GPU.

### Online Softmax and Blocked Incremental Computation

Tri Dao et al. (2022) introduced **FlashAttention**, restructuring the operator around two core principles: **never materialize the $N \times N$ attention matrix to HBM**, and maintain execution entirely within SRAM via tiling and online Softmax formulation.

Standard Softmax computes a row-wide maximum to prevent arithmetic overflow:

$$m = \max_{j} x_j, \quad d = \sum_{j} e^{x_j - m}, \quad \text{softmax}(x)_i = \frac{e^{x_i - m}}{d}$$

This introduces an all-to-all dependency across the entire row. Milakov & Gimelshteyn (2018) and Tri Dao et al. (2022) resolved this dependency by formulating an incremental recurrence.

Split a row into two blocks $x^{(1)}$ and $x^{(2)}$. Given the local statistics of the first block:

$$m^{(1)} = \max_j x_j^{(1)}, \quad d^{(1)} = \sum_j e^{x_j^{(1)} - m^{(1)}}$$

When the second block $x^{(2)}$ arrives, update the global maximum and denominator:

$$m^{(new)} = \max(m^{(1)}, \max_j x_j^{(2)})$$

$$d^{(new)} = d^{(1)} e^{m^{(1)} - m^{(new)}} + \sum_j e^{x_j^{(2)} - m^{(new)}}$$

For the accumulated output vector $O$:

$$O^{(new)} = O^{(1)} \cdot \left(\frac{d^{(1)} e^{m^{(1)} - m^{(new)}}}{d^{(new)}}\right) + \frac{e^{x^{(2)} - m^{(new)}}}{d^{(new)}} V^{(2)}$$

Through this transformation, the GPU loads $Q$ blocks into SRAM and streams $K, V$ blocks through the cache, performing local dot products, online denominator updates, and Value accumulations entirely within SRAM.

No intermediate $N \times N$ matrix ever touches HBM.

### Recomputation Strategy in Backward Pass

Traditional backpropagation requires caching intermediate activations from the forward pass. Retaining $P \in \mathbb{R}^{N \times N}$ would preserve the $O(N^2)$ footprint.

FlashAttention makes a deliberate engineering trade-off: **the forward pass stores only the per-row scalar statistics ($m$ and $d$, occupying $O(N)$ memory) and discards $P$ entirely**.

During the backward pass, tiled blocks of attention scores are recomputed on the fly within SRAM using $Q, K, V$ and the cached scalar normalizers.

While this adds roughly 15% more FLOPs, eliminating HBM round-trips yields a 2–4x end-to-end speedup and shrinks memory scaling from $O(N^2)$ to $O(N)$.

---

## Implementation Reference: Python Verification

The following script illustrates standard dot-product attention alongside the recurrence logic behind tiled online Softmax:

```python
import torch
import torch.nn.functional as F
import math

def scaled_dot_product_attention_reference(Q: torch.Tensor, K: torch.Tensor, V: torch.Tensor) -> torch.Tensor:
    """
    Standard scaled dot-product attention reference (O(N^2) memory footprint).
    Q, K, V shapes: [Batch, Heads, SeqLen, HeadDim]
    """
    d_k = Q.size(-1)
    
    # 1. Scaled dot product
    # scores: [B, H, N, N]
    scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(d_k)
    
    # 2. Softmax normalization across last dimension
    attn_weights = F.softmax(scores, dim=-1)
    
    # 3. Value aggregation
    # output: [B, H, N, HeadDim]
    output = torch.matmul(attn_weights, V)
    return output

def online_softmax_tiling_step(q_block: torch.Tensor, k_block: torch.Tensor, v_block: torch.Tensor,
                               prev_m: torch.Tensor, prev_d: torch.Tensor, prev_acc: torch.Tensor):
    """
    Single-tile online recurrence step (core mathematical basis of FlashAttention).
    """
    d_k = q_block.size(-1)
    local_scores = torch.matmul(q_block, k_block.transpose(-2, -1)) / math.sqrt(d_k)
    
    curr_max = torch.max(local_scores, dim=-1, keepdim=True).values
    new_m = torch.maximum(prev_m, curr_max)
    
    alpha = torch.exp(prev_m - new_m)
    beta = torch.exp(curr_max - new_m)
    
    exp_scores = torch.exp(local_scores - new_m)
    new_d = prev_d * alpha + torch.sum(exp_scores, dim=-1, keepdim=True)
    
    new_acc = prev_acc * alpha + torch.matmul(exp_scores, v_block)
    
    return new_m, new_d, new_acc
```

---

## Production Engineering Trade-offs and Architectural Variants

FlashAttention resolves memory bottlenecks during training and prefill phases. During autoregressive decoding, however, the workload shifts into another operational regime.

### The KV Cache Memory Wall in Inference

During streaming generation, the model consumes a single new token per step, producing a query vector $Q \in \mathbb{R}^{1 \times d_k}$. The workload transitions from compute-dense GEMM to memory-latency-bound GEMV (General Matrix-Vector Multiplication).

To prevent redundant computation across preceding context, keys and values from earlier tokens are retained in memory: the **KV Cache**.

The memory footprint per request is:

$$\text{Memory}_{\text{KV}} = 2 \times 2 \times L \times n_{\text{heads}} \times d_k \times N \text{ Bytes (FP16)}$$

For LLaMA-3-70B (80 layers, 64 heads, $d_k = 128$) at a sequence length of 8,192 tokens:

$$\text{Memory} = 4 \times 80 \times 64 \times 128 \times 8192 \text{ Bytes} \approx 21.47 \text{ GB}$$

At this scale, a single concurrent sequence absorbs over a quarter of an 80GB GPU's memory capacity.

### Structural Trade-offs: MQA and GQA

To maintain serving concurrency in production, modern architectures adopt architectural compromises:

| Architecture | KV Heads | Memory Bandwidth Overhead | Representation Trade-off | Representative Models |
| :--- | :--- | :--- | :--- | :--- |
| **MHA (Multi-Head Attention)** | Identical to Query heads ($h_{KV} = h_Q$) | 100% baseline | Full representational capacity; constrained inference throughput | Original Transformer, GPT-3 |
| **MQA (Multi-Query Attention)** | All Query heads share a single KV head ($h_{KV} = 1$) | Reduced to $1 / h_Q$ | Drastic memory reduction; noticeable degradation in complex coreference | PaLM, StarCoder |
| **GQA (Grouped-Query Attention)** | Query heads partitioned across shared KV groups ($h_{KV} = 8, h_Q = 64$) | Reduced to $1 / 8$ | Optimal engineering balance between throughput and multi-head expressive power | LLaMA-2-70B, LLaMA-3 |

---

## References and Related Articles

- For GPU memory hierarchy architecture and CUDA access optimization, see [GPU Acceleration and CUDA Programming Guide]({{< ref "/posts/2025-11-06-gpu-accelerated-training-cuda-complete-guide.md" >}}).
- For long-context state management and KV Cache mitigation in production agents, see [Claude Code Context Compression and State Management]({{< ref "/posts/2026-06-17-claude-code-context-compression.md" >}}).
- For vector embedding spaces and high-dimensional token representations, see [AI LLM Foundations: Tokens and Vectors]({{< ref "/posts/2025-11-05-ai-llm-tutorial-token-vector-basics.md" >}}).

