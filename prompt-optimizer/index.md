# Prompt Optimizer：一个让你写出更好 Prompt 的开源利器


<!-- more -->

用过 AI 的人大概都有这种体验：同样一个需求，Prompt 写得好和写得差，结果天差地别。问题在于，大多数人并不擅长写 Prompt——这不是天赋问题，而是缺少一个系统化的优化流程。

最近发现了一个开源项目 [Prompt Optimizer](https://github.com/linshenkx/prompt-optimizer)，GitHub 上已有近 29k Star，专门解决这个问题。

## 它是什么

Prompt Optimizer 是一个 **提示词优化工具**。简单来说，你给它一段粗糙的 Prompt，它帮你优化成一段更精确、更结构化的版本，让 AI 的输出质量显著提升。

它的工作流程是：**写 → 优化 → 测试 → 评估 → 收藏复用**。

## 核心功能

### 一键优化，多轮迭代

把你的原始 Prompt 贴进去，点击优化，工具会调用 AI 模型对 Prompt 进行重写和改进。不满意可以继续迭代，每一轮都会在上一轮的基础上进一步优化。

{{< admonition type=tip title="适用场景" >}}
当你有一个模糊的想法但不知道怎么用 Prompt 精确表达时，这个功能特别有用。比如"帮我写一个严格但有用的审稿人角色"，优化后会生成结构清晰的角色定义和评分标准。
{{< /admonition >}}

### 双模式优化

支持两种优化模式：

- **System Prompt 优化**：针对系统级指令的优化，适合构建 AI Agent、自定义角色等场景
- **User Prompt 优化**：针对用户输入的优化，适合日常对话、内容生成等场景

### 对比评估

优化完了怎么知道效果真的变好了？工具提供了 **分析和对比评估** 功能。你可以：

1. 用原始 Prompt 和优化后的 Prompt 分别生成结果
2. 让 AI 对两份结果进行对比打分
3. 基于评估结果再进一步优化

这个闭环设计是它区别于手动改 Prompt 的关键。

### 图片生成 Prompt 优化

除了文本 Prompt，它还支持 **Text-to-Image** 的 Prompt 优化。把一句模糊的描述变成包含主体、构图、光影、风格等细节的专业图像 Prompt。

### 多模型接入

支持 OpenAI、Gemini、DeepSeek、智谱、SiliconFlow、MiniMax 等主流模型。优化用一个模型，测试用另一个模型，完全灵活搭配。

## 使用方式

项目提供了四种使用方式，覆盖不同需求：

| 方式 | 适合人群 |
|------|----------|
| 在线网页版 | 快速体验，开箱即用 |
| 桌面应用 | 离线使用，本地运行 |
| Chrome 扩展 | 配合 ChatGPT 等网页端使用 |
| Docker 自部署 | 团队共享，数据自主可控 |

## 安全性

一个值得关注的点：Prompt Optimizer 是**纯客户端架构**。你的 API Key 和 Prompt 数据只在你自己的浏览器或本地应用中处理，不会经过第三方服务器。对于在意数据隐私的用户来说，这一点很重要。

## 我的建议

如果你经常使用 AI 工具但觉得 Prompt 质量不稳定，值得花 15 分钟试一下这个工具。尤其是以下场景：

- 需要反复调试 System Prompt 的 AI 应用开发者
- 希望提升日常 AI 对话效率的知识工作者
- 对 Prompt Engineering 感兴趣想系统学习的人

项目地址：[https://github.com/linshenkx/prompt-optimizer](https://github.com/linshenkx/prompt-optimizer)

