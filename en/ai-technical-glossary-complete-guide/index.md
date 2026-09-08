# AI Technical Glossary: A Complete Guide to 270+ Terms


# AI Technical Glossary

This reference gathers the core terminology of the LLM field, from basic concepts to advanced technical architecture, to help you build a systematic understanding of the AI technology landscape.

---

## 📚 Fundamentals

| Term | Technical definition | Plain-language explanation | Example |
|------|----------|----------|----------|
| **AGI (Artificial General Intelligence)** | An AI system with human-level intelligence | An all-capable AI that can think, learn, and create like a person | A robot that can write poetry, code, cook, and chat at the same time |
| **LLM (Large Language Model)** | A large neural network model trained on massive data | A "super brain" that understands and generates human language | GPT-4, Claude, ERNIE Bot, and the like are all LLMs |
| **Training** | The process of fitting neural network parameters on large data | The AI's "study phase" — like a person absorbing knowledge from books | Training a model on all text on the internet until it learns language |
| **Inference** | A trained model generating output from input | The AI's "application phase" — like a person answering questions from what they learned | The model generating an answer after you ask it a question |
| **Token** | The smallest unit of text a model processes, a fragment split by a tokenization algorithm | The particles of AI language, processed one at a time | `"我喜欢苹果"` → `["我", "喜欢", "苹果"]` |

---

## 🏗️ Architecture

| Term | Technical definition | Plain-language explanation | Example |
|------|----------|----------|----------|
| **Transformer** | A deep learning architecture based on self-attention, proposed by Google in 2017 | The "neural skeleton" of modern AI that lets models understand language efficiently | GPT, BERT, and every other large model is built on Transformer |
| **Encoder** | A neural network component that encodes an input sequence into semantic representations | The AI's "understanding unit" — turns text into vectors machines understand | BERT uses an encoder for text understanding tasks |
| **Decoder** | A neural network component that generates output token by token based on context | The AI's "writing unit" — generates answers from what it understood | The GPT series are all decoder-only models |
| **Self-Attention** | A mechanism that computes how much each element in a sequence relates to the others | The AI automatically "focuses on what matters", like a person picking out key points while reading | In "deposit money at the bank", "bank" attends to "money"; in "fish by the river bank", it attends to "river" |
| **Multi-Head Attention** | Several self-attention mechanisms run in parallel to capture different types of dependencies | The AI understands text from multiple angles at once | One head tracks syntax while another tracks semantics |
| **Positional Encoding** | Vector representations that add position information to each token | Lets the model know "who comes first, who comes later" | "The dog bit the man" and "the man bit the dog" mean different things |
| **Query** | The vector that actively asks for related information — what the current word needs | The numeric expression of "what am I looking for" | "Apple" queries attributes like taste and color |
| **Key** | The identifier vector for information being queried — what each word can offer | The label of "what I can provide" | "Sweet" serves as the Key for a taste feature, waiting to be queried |
| **Value** | The representation vector holding the actual content and true semantic information | "My actual content", in numbers | The actual semantic representation of "sweet": `[0.8, 0.2, -0.1]` |
| **Attention Weight** | Importance scores expressing how much to attend, usually normalized via softmax | "How much to pay attention", quantified | 0.8 means strong attention, 0.1 weak; all weights sum to 1 |
| **Cross-Attention** | Attention across two sequences — Query comes from one, Key/Value from another | Cross-modal information exchange | In image-text matching, text Queries attend to image Keys/Values |
| **Causal Attention** | Attention restricted to the current position and earlier, preventing future information leaks | Attention that can "only look backward" | When GPT generates the 5th word it can only see the previous 4 |
| **Softmax Function** | An activation function that turns any real-valued vector into a probability distribution | Converts scores into "importance percentages" | `[2,1,0] → [0.67,0.24,0.09]`, preserving relative magnitudes |

---

## 🔢 Mathematical Representation

| Term | Technical definition | Plain-language explanation | Example |
|------|----------|----------|----------|
| **Vector** | A mathematical object with magnitude and direction; an ordered list of numbers | A "numeric ID card" that describes a thing with numbers | `[25, 180, 70]` can represent a person's age, height, and weight |
| **Embedding** | The technique of mapping discrete symbols into a continuous vector space | Turns words into "numeric coordinates" | `"king"→[0.25, -0.12, 0.78, ...]` |
| **Query / Key / Value** | The three core vector matrices in self-attention: what is asked, what is labeled, what is delivered | Query = what I want, Key = what I can offer, Value = my actual content | `Query=[0.1,0.2]` asks about taste, `Key=[0.8,0.1]` labels sweetness, `Value=[0.9,0.05]` is the actual representation of sweetness |
| **Feed-Forward Network** | Applies an independent nonlinear transform at each position | Deepens the model's understanding of each word | From "spring" the model further associates "warmth, growth" |
| **Layer Normalization** | Standardizes a layer's inputs | A "stabilizer" for training | Prevents gradient explosion or divergence |
| **Residual Connection** | A cross-layer connection that preserves the original information | An "express lane" for information, preventing loss | Like a shortcut path that keeps deep networks from degrading |

---

## 🔄 Processing Pipeline

| Term | Technical definition | Plain-language explanation | Example |
|------|----------|----------|----------|
| **Tokenizer** | Converts text into a sequence of tokens | A "knife for chopping text" | `"Hello world" → ["Hello", " world"]` |
| **Context Window** | The maximum number of tokens a model can process | The AI's "memory limit" | GPT-4 has a 128K context |
| **Decoding** | Generates text token by token from a probability distribution | The AI's "writing process" | Starts generating from the most probable word |
| **Temperature** | A parameter controlling generation randomness | A "creativity dial" | High temperature is more creative, low more stable |
| **Top-p Sampling** | A sampling strategy based on cumulative probability | An "essence filter" | Only considers candidates whose cumulative probability reaches 90% |
| **Max Tokens** | Caps the length of generated output | A "word-count limiter" | Keeps the AI from answering too long |

---

## 🛠️ Engineering Practice

| Term | Technical definition | Plain-language explanation | Example |
|------|----------|----------|----------|
| **RAG (Retrieval-Augmented Generation)** | An AI approach combining retrieval and generation | An "open-book exam" AI | Look up references first, then answer the question |
| **Prompt Engineering** | The craft of designing and optimizing prompts | "The art of asking" | Helping the AI understand your needs better |
| **Fine-tuning** | Training a pretrained model on a specific task | "Targeted job training" | Turning a general model into a medical assistant |
| **BPE (Byte Pair Encoding)** | A common tokenization algorithm | A "text compression technique" | `"unhappiness" → ["un","happi","ness"]` |
| **Detokenization** | Turns a token sequence back into readable text | "Reassembling the pieces" | `["我","喜欢","苹果"]→"我喜欢苹果"` |
| **Streaming** | Generates output token by token in real time | The "typewriter effect" | A chatbot thinking while it types |

---

## 🧠 Classic Models Compared

| Term | Technical definition | Plain-language explanation | Example |
|------|----------|----------|----------|
| **RNN (Recurrent Neural Network)** | A neural network that processes sequences step by step | A "read-one-word-at-a-time AI" | Translating `"我爱你"` word by word |
| **LSTM (Long Short-Term Memory)** | An improved RNN that handles long-range dependencies | "A better memory" | Can remember content from the beginning |
| **CNN (Convolutional Neural Network)** | A neural network that excels at image patterns | An "image specialist" | Recognizing cats, dogs, and faces |
| **Encoder-Decoder Architecture** | A model containing both understanding and generation modules | An "all-round AI" | Machine translation models |

---

## 📊 Application Scenarios

| Term | Technical definition | Plain-language explanation | Example |
|------|----------|----------|----------|
| **Chat product** | A user-facing AI application interface | An "AI chat shell" | ChatGPT, Claude |
| **API call** | An interface for program-to-program communication | The "AI phone line" | An application calling the OpenAI API |
| **Context management** | The technique of maintaining conversation history | The "AI's memory" | A chatbot remembers what you said |
| **Multi-turn dialogue** | A continuous human-machine interaction mode | "Ongoing conversation" | Ask about the weather, then what to wear |
| **Function Calling** | The model invoking external APIs to perform tasks | The "AI's ability to act" | The AI checks the weather or searches automatically |

---

## 🧩 Model Optimization and Training Techniques

| Term | Technical definition | Plain-language explanation | Example |
|------|----------|----------|----------|
| **LoRA (Low-Rank Adaptation)** | Fine-tunes model parameters via low-rank matrices | "Lightweight fine-tuning" | Lets an LLM quickly adapt to a new domain |
| **Quantization** | Represents model parameters at lower precision | "Slimming the model down" | FP32→INT8 speeds up inference |
| **Pruning** | Removes redundant neurons or connections | "Trimming the branches" | Cutting useless parameters |
| **Distillation (Knowledge Distillation)** | A large model teaches a small one | "Teacher trains the student" | GPT-4 teaching a small model |
| **Checkpoint** | A saved intermediate state during model training | A "training save point" | Prevents losing progress on a power cut |

---

## 🔍 Vector Retrieval and Knowledge Integration

| Term | Technical definition | Plain-language explanation | Example |
|------|----------|----------|----------|
| **Embedding Model** | A model that converts text into semantic vectors | A "semantic coordinate machine" | text-embedding-3-large |
| **Vector Database** | A database supporting vector retrieval | A "semantic warehouse" | Milvus, Pinecone, FAISS |
| **Cosine Similarity** | Measures how similar two vectors' directions are | A "semantic similarity meter" | `A cat is sleeping ≈ The cat is resting` |
| **Knowledge Graph** | Stores knowledge as nodes and relationships | A "knowledge map" | `apple → is a → fruit` |
| **Hybrid Search** | Combines semantic retrieval with keyword matching | "Belt-and-suspenders search" | Searching both `cat` and `pet animal` at once |

---

## 🧩 Multimodal and Agents

| Term | Technical definition | Plain-language explanation | Example |
|------|----------|----------|----------|
| **Multimodal Model** | Handles text, images, audio, and other modalities at once | A "full-senses AI" | GPT-4V, Gemini |
| **VLM (Vision-Language Model)** | Vision-Language Model | An AI that can "see pictures" | A visual question-answering AI |
| **Speech Recognition** | Converts speech to text | A "dictation AI" | Voice input methods |
| **TTS (Text-to-Speech)** | Converts text to speech | An "AI announcer" | The AI reads its answer aloud |
| **AI Agent** | An AI capable of autonomous action and decision-making | An AI assistant "that can act" | Devin, AutoGPT |

---

## ⚙️ Model Evaluation and Safety

| Term | Technical definition | Plain-language explanation | Example |
|------|----------|----------|----------|
| **Hallucination** | The model generating false information | "Confident nonsense" | Inventing papers or facts |
| **Alignment** | Bringing the model in line with human values | "Values training" | Tuning a model with RLHF |
| **RLHF (Reinforcement Learning from Human Feedback)** | Optimizes a model with human preferences | "Humans teaching AI to speak" | How ChatGPT was trained |
| **Red Teaming** | Adversarial testing of model safety | A "security penetration test" | Testing whether the model leaks secrets |
| **Bias** | Systematic prejudice in model outputs | "The AI plays favorites" | Preference for a gender or language |

---

## 🧰 Emerging Trends and Future Directions

| Term | Technical definition | Plain-language explanation | Example |
|------|----------|----------|----------|
| **Mixture of Experts** | A structure with multiple sub-models activated dynamically | A "panel-of-experts AI" | The `Gemini 1.5 Pro` architecture |
| **Context Compression** | Compresses conversation history to save tokens | "Memory compression" | Summarizing long conversations |
| **Memory-Augmented Model** | An AI combined with long-term memory mechanisms | An AI "with a memory" | `ChatGPT` long-term memory |
| **Autonomous Agent** | An AI that can plan and execute tasks on its own | A "self-managing AI" | `AutoGPT`, `Devin` |
| **Synthetic Data** | Virtual training data generated by AI | "AI-made textbooks" | Expanding a training set with AI |

---

## 💡 Study Advice

### 🎯 Priority for Mastering Core Concepts

1. **Beginner (must know)**: Token, Embedding, Transformer, LLM
2. **Intermediate (important)**: Self-Attention, RAG, Context Window
3. **Advanced (optional)**: LoRA, Mixture of Experts, Red Teaming

### 📖 Suggested Learning Path

1. **Understand the basics**: what a token is, and why vector representation is needed
2. **Master the core architecture**: the Transformer encoder-decoder structure
3. **Practice application techniques**: combining prompt engineering with RAG
4. **Go deeper into technical details**: attention mechanisms and alignment training

### 🔗 Concept Map

```
Fundamentals → Math → Architecture → Processing → Engineering → Optimization → Retrieval → Agents
↓            ↓       ↓             ↓            ↓             ↓               ↓          ↓
Token   → Vector   → Transformer → Decoding → RAG → LoRA → Embedding → Agent
LLM     → Q/K/V    → Attention  → Context → Prompt → Quant → Knowledge → Memory
```

---

> 🚀 **Tip**: the AI technology landscape is vast but tightly interconnected. A good approach is to study it systematically along four dimensions: understand → build → optimize → secure.

---

## 📚 Further Reading

### 🔗 AI LLM Systematic Tutorials Series

1. **[A Complete Guide to AI LLMs]({{< ref "/posts/2025-11-05-ai-llm-tutorial-token-vector-basics.md" >}})** — tokens and vectors explained in depth, from the ground up
2. **[Transformer Architecture Deep Dive]({{< ref "/posts/2025-11-05-transformer-attention-mechanism-deep-dive.md" >}})** — the attention mechanism and the core technology behind LLMs
3. **[Prompt Engineering Complete Guide]({{< ref "/posts/2025-11-05-prompt-engineering-context-management-complete-guide.md" >}})** — a hands-on guide from prompt engineering to context engineering
4. **[This post] AI Technical Glossary** — 270+ terms and a dictionary of the AI technology landscape

### 🎯 How to Use This Page

- **Order of study**: work through tutorial 1 → tutorial 2 → tutorial 3 systematically, and keep this page handy as a reference dictionary
- **Looking up terms**: when you hit an unfamiliar term while reading the other tutorials, just search for it here
- **Building the knowledge system**: combine the tutorials' theory with the term explanations here to build a complete picture of AI

---

## 📘 Appendix: English–Chinese AI Glossary (A–Z)

| English term | 中文名称 | Brief explanation |
|------------------|-----------|-----------|
| **AGI (Artificial General Intelligence)** | 通用人工智能 | AI with human-level general intelligence |
| **Alignment** | 对齐 | Making AI behavior conform to human values |
| **API (Application Programming Interface)** | 应用程序接口 | The standard way programs call each other |
| **AutoGPT / Autonomous Agent** | 自主智能体 | AI systems that plan and execute tasks on their own |
| **BERT (Bidirectional Encoder Representations from Transformers)** | 双向Transformer编码模型 | A landmark pretrained NLP model |
| **Bias** | 偏差 | Systematic unfairness in model output |
| **BPE (Byte Pair Encoding)** | 字节对编码 | A widely used text tokenization algorithm |
| **Checkpoint** | 检查点 | A saved intermediate state during model training |
| **CNN (Convolutional Neural Network)** | 卷积神经网络 | A network architecture that excels at image recognition |
| **Context Window** | 上下文窗口 | The maximum number of tokens a model can process |
| **Context Compression** | 上下文压缩 | Summarizing history to save context |
| **Cosine Similarity** | 余弦相似度 | A metric for semantic similarity between vectors |
| **Decoder** | 解码器 | The network module that turns semantic vectors into text |
| **Decoding** | 解码过程 | The process of a model generating text |
| **Detokenization** | 反分词 | Turning a token sequence back into text |
| **Distillation (Knowledge Distillation)** | 知识蒸馏 | A large model guiding a small one's learning |
| **Embedding** | 嵌入 | Mapping discrete words into a continuous vector space |
| **Embedding Model** | 向量模型 | A model that produces semantic vectors for text |
| **Encoder** | 编码器 | A network component that turns text into semantic representations |
| **Encoder–Decoder** | 编码–解码结构 | A model architecture with both understanding and generation |
| **Feed Forward Network (FFN)** | 前馈网络 | The nonlinear transform module inside a Transformer layer |
| **Fine-tuning** | 微调 | Further training a pretrained model on a specific task |
| **Function Calling** | 工具调用 | A model's ability to call external APIs to take actions |
| **Hallucination** | 幻觉 | The model generating false or fabricated information |
| **Hybrid Search** | 混合检索 | Combining semantic retrieval with keyword search |
| **Knowledge Graph** | 知识图谱 | A network storing knowledge as nodes and relationships |
| **Layer Normalization** | 层归一化 | Standardizing a network layer's inputs |
| **Latency** | 延迟 | Response time from model input to output |
| **LLM (Large Language Model)** | 大语言模型 | A language model trained on massive corpora |
| **LoRA (Low-Rank Adaptation)** | 低秩适配 | A lightweight model fine-tuning method |
| **LSTM (Long Short-Term Memory)** | 长短期记忆网络 | An RNN variant that captures long-range dependencies |
| **Memory-Augmented Model** | 记忆增强模型 | AI with long-term memory capability |
| **Mixture of Experts (MoE)** | 专家混合模型 | An architecture that dynamically selects sub-models to cooperate |
| **Multi-Head Attention** | 多头注意力 | A mechanism computing several attentions in parallel |
| **Positional Encoding** | 位置编码 | A way to add position information to tokens |
| **Pruning** | 剪枝 | Removing redundant parameters to shrink a model |
| **Prompt Engineering** | 提示工程 | Optimizing prompts to improve model output quality |
| **Quantization** | 量化 | Representing model parameters at lower precision for performance |
| **Query / Key / Value (QKV)** | 查询 / 键 / 值 | The three elements of self-attention |
| **RAG (Retrieval-Augmented Generation)** | 检索增强生成 | Combining external knowledge retrieval with generation |
| **Red Teaming** | 红队测试 | Evaluating model safety through adversarial inputs |
| **Residual Connection** | 残差连接 | A cross-layer information pass-through that prevents gradient degradation |
| **RLHF (Reinforcement Learning from Human Feedback)** | 人类反馈强化学习 | Optimizing model output with human preferences |
| **RNN (Recurrent Neural Network)** | 循环神经网络 | A network that processes sequences step by step |
| **Self-Attention** | 自注意力 | A mechanism computing relationships between sequence elements |
| **Streaming** | 流式输出 | A model generating and emitting output as it goes |
| **Synthetic Data** | 合成数据 | Virtual training data generated by AI |
| **Temperature** | 温度参数 | The parameter controlling generation randomness |
| **Throughput** | 吞吐量 | The number of requests processed per second |
| **Token** | 词元 | The smallest unit of text a model processes |
| **Tokenizer** | 分词器 | The tool that splits text into tokens |
| **Top-p Sampling** | 累积概率采样 | A generation strategy that filters low-probability words |
| **Transformer** | Transformer架构 | The core neural network built on attention |
| **TTS (Text-to-Speech)** | 文本转语音 | Turning text into natural speech |
| **Vector** | 向量 | A mathematical structure representing an entity's features numerically |
| **Vector Database** | 向量数据库 | A system that stores vectors and retrieves them semantically |
| **VLM (Vision-Language Model)** | 视觉语言模型 | A model that understands both images and language |
| **Weight** | 权重参数 | The core learnable numeric parameters of a model |

---

