# PDF2Markdown - 大型PDF文档智能文章提取工具完全指南


# PDF2Markdown - 大型 PDF 文档智能文章提取工具

[![Python Version](https://img.shields.io/badge/python-3.13+-blue.svg)](https://python.org)
[![Code Style](https://img.shields.io/badge/code%20style-ruff-green.svg)](https://github.com/astral-sh/ruff)
[![Type Checking](https://img.shields.io/badge/type%20checking-mypy-blue.svg)](https://mypy.readthedocs.io/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 项目概述

PDF2Markdown 是一个专门用于处理大型扫描件 PDF 文件的智能内容提取工具。结合传统 OCR 技术与现代 AI 大模型，智能提取文档中的纯文章内容，自动过滤图片、表格等非文章元素。完美支持中英文混合文档处理。

### ✨ 核心特性

- 🚀 **大文件支持**: 专门优化处理 500M+大型 PDF 文件，采用流式处理避免内存溢出
- 🧠 **AI 智能提取**: 集成 Ollama 本地大模型，精准识别和提取纯文章内容
- 🌐 **双语支持**: 完美支持中英文混合文档，智能语言检测
- 🔄 **断点续传**: 支持中断恢复，避免重复处理，节省时间
- 💾 **智能内存管理**: 动态内存监控，自动调整处理参数适应不同硬件配置
- 🔧 **多引擎 OCR**: 集成 PaddleOCR 和 Tesseract，智能选择最优识别引擎
- 📊 **质量保证**: 多重验证机制，置信度评估，确保输出质量
- 🎯 **灵活配置**: 丰富的配置选项，支持不同处理策略

## 📦 快速安装

本项目使用 `uv` 统一管理 Python 版本与依赖，确保环境一致性。

### 系统要求

- Python 3.13+
- 内存: 8GB+ (推荐 16GB)
- 存储: 额外 5GB 用于临时文件
- GPU: 可选，支持 CUDA 加速

### 安装步骤

```bash
# 1. 安装 uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# 2. 安装并固定 Python 版本
uv python install 3.13

# 3. 克隆项目
git clone https://github.com/ByronFinn/pdf2markdown.git
cd pdf2markdown

# 4. 同步基础依赖
uv sync --locked

# 5. 根据需要安装可选组件
uv sync --locked --group pdf-processing --group ocr-support --group ai-models

# 6. 安装开发/测试工具（可选）
uv sync --locked --group dev
```

### 系统依赖

```bash
# Ubuntu/Debian
sudo apt-get install tesseract-ocr tesseract-ocr-chi-sim poppler-utils

# macOS
brew install tesseract poppler

# Windows (需要手动安装)
# - Tesseract OCR: https://github.com/UB-Mannheim/tesseract/wiki
# - Poppler: https://github.com/oschwartz10612/poppler-windows
```

### Ollama 模型安装

```bash
# 安装 Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# 启动 Ollama 服务
ollama serve

# 下载推荐模型
ollama pull qwen3:8b
```

## 🚀 快速开始

### 基本使用

```bash
# 最简单的使用方式
uv run python -m pdf2markdown your_document.pdf

# 完整参数示例
uv run python -m pdf2markdown \
    --input large_document.pdf \
    --output ./results \
    --environment development \
    --model qwen3:8b \
    --memory 4 \
    --workers 4 \
    --formats markdown,json \
    --log-level DEBUG \
    --log-file processing.log
```

### 命令行参数详解

**必需参数：**

- `pdf` 或 `--input <path>` - PDF 文件路径

**配置管理：**

- `--environment <env>` - 配置环境 (development/production)
- `--chunk-size <int>` - 分块页数 (默认: 20)
- `--ocr-engine <engine>` - 指定 OCR 引擎 (可重复指定)
- `--model <model_name>` - Ollama 模型名称 (默认: qwen3:8b)

**性能调优：**

- `--workers <int>` - 并发工作数 (默认: 4)
- `--memory <float>` - 最大内存限制(GB) (默认: 4.0)

**输出控制：**

- `--output <dir>` - 输出目录 (默认: ./output)
- `--formats <format>` - 输出格式: markdown,json,text (默认: markdown,json)

**调试选项：**

- `--log-level <level>` - 日志级别: DEBUG,INFO,WARNING,ERROR
- `--log-file <path>` - 日志文件路径
- `--verbose` - 详细日志模式
- `--quiet` - 静默模式

**环境检查：**

- `--skip-checks` - 跳过环境自检
- `--check-only` - 仅运行环境检查
- `--strict-check` - 将警告视为错误

### 开发与测试

```bash
# 运行测试
uv run pytest

# 类型检查
uv run mypy src

# 代码格式检查
uv run ruff check

# 验证环境
uv run python -m pdf2markdown --check-only
```

## ⚙️ 配置系统

本项目采用多层配置系统，支持灵活的配置覆盖策略：

### 配置文件层级

1. **`config/default.yaml`** - 默认基线配置
2. **`config/{environment}.yaml`** - 环境特定配置覆盖
3. **命令行参数** - 运行时参数覆盖

### 默认配置详解

```yaml
# 资源限制
max_memory_gb: 4.0
confidence_threshold: 0.8

# OCR 配置
ocr_engines:
  - paddleocr # 中文识别优先
  - tesseract # 英文识别备用
chunk_size_pages: 20
max_workers: 4

# Ollama AI 配置
ollama_model: qwen3:8b
ollama_timeout_seconds: 600.0
ollama_max_retries: 2
ollama_batch_size: 4
ollama_cache_size: 128
ollama_num_ctx: 8192
ollama_max_prompt_chars: 12000
ollama_format: json

# 输出配置
output_formats:
  - markdown
  - json
checkpoint_dir: ./checkpoints
temp_dir: ./temp

# PDF 渲染设置
pdf_render_dpi: 200
pdf_render_format: jpeg
```

## 🏗️ 技术架构

### 核心处理流程

```
PDF输入 → 智能文档分析 → 动态分块 → 多引擎OCR → AI内容过滤 → 质量检查 → 多格式输出
```

### 项目模块结构

```
pdf2markdown/
├── 📁 models/                   # 数据模型层
│   ├── __init__.py             # 模型导出
│   └── data_models.py          # 核心数据模型定义
├── 📁 utils/                    # 工具模块
│   ├── __init__.py             # 工具模块导出
│   ├── logging.py              # Loguru 日志配置
│   ├── progress.py             # 终端进度条
│   └── env_check.py            # 环境自检工具
├── 📄 __init__.py               # 主要公共接口
├── 📄 __main__.py               # 命令行入口
├── 📄 main.py                   # 主应用程序逻辑
├── 📄 config_manager.py         # 配置管理器
├── 📄 memory_manager.py         # 内存管理模块
├── 📄 checkpoint_manager.py     # 断点续传管理器
├── 📄 enhanced_coordinator.py   # 主调度器
├── 📄 smart_pdf_processor.py    # PDF 文档处理器
├── 📄 multi_ocr_processor.py    # 多引擎 OCR 处理器
├── 📄 ollama_content_filter.py  # Ollama AI 内容过滤器
└── 📄 output_manager.py         # 输出管理器
```

### 数据模型架构

基于 **Pydantic v2** 的类型安全数据模型系统：

```python
# 核心类型定义
LanguageTag = Literal["zh", "en", "mixed"]
OutputFormat = Literal["markdown", "json", "text"]
ChunkStatus = Literal["pending", "processing", "completed", "failed", "skipped"]

# 主要数据模型
- PageSpan           # 页码范围表示
- ContentChunk       # 内容分块对象
- DocumentInfo       # PDF 文档结构信息
- ProcessingConfig   # 处理流程配置
- OCRLPayload/Result # OCR 输入输出数据结构
- FilteredContent    # AI 筛选后结果
- OutputArtifact     # 输出结果描述
- CheckpointRecord   # 断点续传记录
- ProcessingState    # 运行时状态与最终结果
```

## 🔧 核心模块详解

### 1. 智能 PDF 处理模块 (`smart_pdf_processor.py`)

**核心功能**

- **智能文档分析**: 自动识别文档类型、章节边界、语言分布
- **自适应分块**: 根据文档结构和内容密度动态分块
- **流式处理**: 避免大文件导致的内存溢出
- **质量评估**: 预处理阶段评估扫描质量，优化处理参数

**关键特性**

- 支持最大 500M+ 的 PDF 文件处理
- 智能语言检测，支持中英文混合文档
- 内存优化策略，适应不同硬件配置

### 2. 多引擎 OCR 集成 (`multi_ocr_processor.py`)

**支持的 OCR 引擎**

- **PaddleOCR**: 中文识别优势，支持复杂版面布局
- **Tesseract**: 英文识别备用方案，处理特殊字体
- **PassThroughEngine**: 调试模式，直接传入预提取文本

**智能特性**

- **语言自适应**: 自动识别中英文段落，采用对应 OCR 引擎
- **质量重试**: 低质量页面自动增强和重试机制
- **结果融合**: 多引擎结果智能融合，提高准确率
- **缓存机制**: 避免重复处理相同内容

### 3. AI 内容过滤 (`ollama_content_filter.py`)

**核心能力**

- **智能提取**: 基于大模型识别并提取纯文章内容
- **自动过滤**: 过滤图片描述、表格内容、页眉页脚
- **结构保持**: 保持原文的段落结构和层级关系
- **置信度评估**: 对提取结果进行质量评估

**技术特点**

- 支持长文本分段处理
- 智能批处理优化
- 结果缓存机制
- JSON 结构化输出

### 4. 内存管理 (`memory_manager.py`)

**动态优化策略**

- 实时监控内存使用情况
- 根据可用内存动态调整批处理大小
- 自动垃圾回收机制
- 内存预警和限制执行

**性能表现**

- 10,000 次内存监控调用 < 0.2 秒
- 智能批次大小调整算法
- 多进程内存隔离

### 5. 断点续传 (`checkpoint_manager.py`)

**状态管理**

- JSON 格式检查点文件
- 支持处理进度保存与恢复
- 智能跳过已成功处理的页面
- 详细的错误状态记录

**容错机制**

- 单个分块失败不影响整体处理
- 自动错误恢复和重试
- 完整的处理历史追踪

### 6. 输出管理 (`output_manager.py`)

**支持格式**

- **Markdown**: 保持原文层级结构，支持后续编辑
- **JSON**: 结构化数据，便于程序处理
- **Text**: 简洁格式，便于阅读

**质量保证**

- 输出质量评估功能
- 详细的处理统计信息
- 错误报告和建议
- 元数据完整性检查

## 📊 性能指标

### 基准测试结果

| 指标             | 预期值   | 说明                                 |
| ---------------- | -------- | ------------------------------------ |
| **处理速度**     | 2-4 小时 | 500M 文件，取决于硬件配置和 OCR 引擎 |
| **内存占用**     | 2-4GB    | 峰值内存使用，动态调整优化           |
| **识别准确率**   | 90%+     | 文章内容识别准确率                   |
| **支持文件大小** | 1GB+     | 理论上支持更大文件，仅受内存限制     |
| **并发处理数**   | 2-8 进程 | 根据内存自动调整                     |
| **内存监控性能** | <0.2 秒  | 10,000 次调用基准测试                |

### 性能优化策略

- **智能分块**: 根据内容密度动态调整分块大小
- **缓存机制**: OCR 结果和 AI 过滤结果双重缓存
- **内存管理**: 实时监控，动态调整批处理大小
- **并行处理**: 多进程处理，智能资源调度

## 🧪 测试覆盖

项目包含 10 个测试文件，全面覆盖所有核心功能：

```bash
# 运行所有测试
uv run pytest

# 运行特定模块测试
uv run pytest tests/test_models.py          # 数据模型测试
uv run pytest tests/test_coordinator.py      # 主调度器测试
uv run pytest tests/test_multi_ocr.py        # OCR处理测试
uv run pytest tests/test_ollama_filter.py    # AI过滤测试
uv run pytest tests/test_cli.py              # CLI接口测试
```

### 测试覆盖的功能模块

✅ **数据模型测试** - Pydantic v2 模型验证和类型检查
✅ **配置管理测试** - 多层配置合并和参数覆盖
✅ **内存管理测试** - 动态内存调整和性能基准
✅ **OCR 处理测试** - 多引擎优先级和缓存机制
✅ **内容过滤测试** - Ollama 客户端重试和批处理
✅ **PDF 处理测试** - 智能分块和流式处理
✅ **CLI 接口测试** - 参数解析和环境检查
✅ **断点续传测试** - 状态保存和恢复机制
✅ **输出管理测试** - 多格式输出生成
✅ **集成测试** - 端到端处理流程

## 🔍 环境检查工具

项目内置完整的环境检查功能：

```bash
# 运行完整环境检查
uv run python -m pdf2markdown --check-only

# 跳过环境检查直接运行
uv run python -m pdf2markdown document.pdf --skip-checks

# 严格模式检查
uv run python -m pdf2markdown --check-only --strict-check
```

### 检查项目

- ✅ **Python 版本检查** - 确保使用 Python 3.13+
- ✅ **依赖包检查** - 验证所有必需包的安装状态
- ✅ **OCR 引擎检查** - 检查 PaddleOCR 和 Tesseract 可用性
- ✅ **Ollama 服务检查** - 验证 Ollama 服务运行状态
- ✅ **模型可用性检查** - 确认指定模型已下载
- ✅ **系统资源检查** - 评估可用内存和存储空间

## 🛠️ 高级配置示例

### 针对不同场景的优化配置

#### 高质量处理配置

```python
# config/high_quality.yaml
max_memory_gb: 8.0
confidence_threshold: 0.9
ocr_engines: [paddleocr, tesseract]
chunk_size_pages: 10        # 更小分块提高质量
pdf_render_dpi: 300         # 更高DPI提高识别率
ollama_num_ctx: 16384       # 更大上下文窗口
```

#### 快速处理配置

```python
# config/fast_processing.yaml
max_memory_gb: 2.0
confidence_threshold: 0.7
ocr_engines: [paddleocr]    # 仅使用最快引擎
chunk_size_pages: 50        # 更大分块提高速度
max_workers: 2              # 减少并发降低内存
pdf_render_dpi: 150         # 降低DPI提高速度
```

#### 低资源配置

```python
# config/low_resource.yaml
max_memory_gb: 1.5
chunk_size_pages: 5
max_workers: 1
pdf_render_format: jpeg     # 使用更省空间的格式
ollama_batch_size: 2        # 减少批处理大小
```

### 命令行配置示例

```bash
# 高质量模式
uv run python -m pdf2markdown document.pdf \
  --environment high_quality \
  --model qwen3:8b \
  --formats markdown,json

# 快速模式
uv run python -m pdf2markdown document.pdf \
  --environment fast_processing \
  --workers 1 \
  --memory 2

# 低资源模式
uv run python -m pdf2markdown document.pdf \
  --environment low_resource \
  --chunk-size 5 \
  --workers 1
```

## 🔧 开发指南

### 项目结构说明

```
pdf2markdown/
├── src/                    # 源代码目录
│   └── pdf2markdown/       # 主要包
│       ├── models/         # 数据模型
│       ├── utils/          # 工具模块
│       └── [核心模块].py   # 各功能模块
├── config/                 # 配置文件
├── tests/                  # 测试文件
├── output/                 # 默认输出目录
├── checkpoints/            # 断点续传文件
├── temp/                   # 临时文件
├── pyproject.toml          # 项目配置
└── uv.lock                 # 依赖锁定文件
```

### 代码质量工具

```bash
# 代码格式化
uv run ruff format src/

# 代码检查
uv run ruff check src/

# 类型检查
uv run mypy src/

# 运行所有检查
uv run ruff check src/ && uv run mypy src/ && uv run pytest
```

### 扩展开发

#### 添加新的 OCR 引擎

```python
# 在 multi_ocr_processor.py 中添加
class CustomOCREngine(BaseOCREngine):
    def process_image(self, image: np.ndarray) -> OCRResult:
        # 实现自定义OCR逻辑
        pass

# 注册新引擎
ocr_processor.register_engine("custom", CustomOCREngine())
```

#### 自定义输出格式

```python
# 在 output_manager.py 中添加
class CustomFormatter(BaseOutputFormatter):
    def format_output(self, result: ProcessingResult) -> str:
        # 实现自定义格式化逻辑
        pass
```

## ❓ 常见问题与解决方案

### Q: 处理大文件时内存不足怎么办？

**A**: 可以通过以下方式优化内存使用：

- 使用 `--memory` 参数限制内存使用
- 减小 `--chunk-size` 参数值
- 减少并发工作数 `--workers`
- 使用 `low_resource` 配置环境

### Q: OCR 识别质量不理想？

**A**: 推荐以下优化策略：

- 检查原 PDF 分辨率（推荐 300DPI+）
- 尝试不同的 OCR 引擎组合
- 调整 `confidence_threshold` 参数
- 使用高质量扫描件重新处理

### Q: Ollama 模型调用失败？

**A**: 检查以下项目：

- 确保 Ollama 服务正在运行：`ollama serve`
- 验证模型是否已下载：`ollama list`
- 检查模型名称是否正确：`qwen3:8b`

### Q: 处理速度太慢如何优化？

**A**: 可以尝试以下优化：

- 增加并行工作数（内存允许时）
- 使用 GPU 加速（如果有 CUDA）
- 选择更小的 AI 模型
- 使用 `fast_processing` 配置

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 贡献方式

- 🐛 **报告 Bug**: 通过 Issues 报告问题
- 💡 **功能建议**: 提出新功能想法
- 📝 **文档改进**: 完善文档和示例
- 🔧 **代码贡献**: 提交 Pull Request

### 开发流程

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

### 代码规范

- 遵循 PEP 8 代码风格
- 使用 ruff 进行代码格式化
- 通过 mypy 类型检查
- 编写相应的测试用例

## 📝 更新日志

### v1.0.0 (当前版本)

#### ✨ 新功能

- ✅ 完整的 PDF 处理管道实现
- ✅ 多引擎 OCR 支持（PaddleOCR + Tesseract）
- ✅ Ollama AI 内容过滤集成
- ✅ 断点续传功能
- ✅ 多格式输出支持（Markdown, JSON, Text）
- ✅ 智能内存管理
- ✅ 环境自检工具
- ✅ 丰富的 CLI 参数支持
- ✅ 完整的测试覆盖

#### 🏗️ 技术实现

- ✅ 基于 Pydantic v2 的类型安全数据模型
- ✅ 模块化架构设计
- ✅ 多层配置系统
- ✅ 错误处理和容错机制
- ✅ 性能优化和缓存机制

---

**PDF2Markdown** - 专注于大型 PDF 文档智能文章提取的现代化解决方案 🚀

