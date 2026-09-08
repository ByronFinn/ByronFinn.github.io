# PDF2Markdown: Complete Guide to Smart PDF Article Extraction


# PDF2Markdown - An Intelligent Article Extraction Tool for Large PDF Documents

[![Python Version](https://img.shields.io/badge/python-3.13+-blue.svg)](https://python.org)
[![Code Style](https://img.shields.io/badge/code%20style-ruff-green.svg)](https://github.com/astral-sh/ruff)
[![Type Checking](https://img.shields.io/badge/type%20checking-mypy-blue.svg)](https://mypy.readthedocs.io/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## Project Overview

PDF2Markdown is an intelligent content extraction tool built specifically for large scanned PDF files. It combines traditional OCR technology with modern AI large language models to intelligently extract pure article content from documents, automatically filtering out non-article elements such as images and tables. Mixed Chinese-English documents are fully supported.

### ✨ Key Features

- 🚀 **Large file support**: Optimized for 500M+ PDF files, using streaming processing to avoid memory overflow
- 🧠 **AI-powered extraction**: Integrates local Ollama LLMs to precisely identify and extract pure article content
- 🌐 **Bilingual support**: Full support for mixed Chinese-English documents with intelligent language detection
- 🔄 **Checkpoint resume**: Supports interrupt-and-resume, avoiding redundant processing and saving time
- 💾 **Smart memory management**: Dynamic memory monitoring that automatically tunes processing parameters for different hardware configurations
- 🔧 **Multi-engine OCR**: Integrates PaddleOCR and Tesseract, intelligently selecting the best recognition engine
- 📊 **Quality assurance**: Multiple validation mechanisms and confidence scoring to guarantee output quality
- 🎯 **Flexible configuration**: Rich configuration options supporting different processing strategies

## 📦 Quick Installation

This project uses `uv` to manage the Python version and dependencies uniformly, ensuring environment consistency.

### System Requirements

- Python 3.13+
- Memory: 8GB+ (16GB recommended)
- Storage: an extra 5GB for temporary files
- GPU: optional, CUDA acceleration supported

### Installation Steps

```bash
# 1. Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# 2. Install and pin the Python version
uv python install 3.13

# 3. Clone the project
git clone https://github.com/ByronFinn/pdf2markdown.git
cd pdf2markdown

# 4. Sync base dependencies
uv sync --locked

# 5. Install optional components as needed
uv sync --locked --group pdf-processing --group ocr-support --group ai-models

# 6. Install dev/test tooling (optional)
uv sync --locked --group dev
```

### System Dependencies

```bash
# Ubuntu/Debian
sudo apt-get install tesseract-ocr tesseract-ocr-chi-sim poppler-utils

# macOS
brew install tesseract poppler

# Windows (manual installation required)
# - Tesseract OCR: https://github.com/UB-Mannheim/tesseract/wiki
# - Poppler: https://github.com/oschwartz10612/poppler-windows
```

### Ollama Model Installation

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start the Ollama service
ollama serve

# Download the recommended model
ollama pull qwen3:8b
```

## 🚀 Quick Start

### Basic Usage

```bash
# The simplest usage
uv run python -m pdf2markdown your_document.pdf

# Full parameter example
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

### Command-Line Arguments In Depth

**Required:**

- `pdf` or `--input <path>` - Path to the PDF file

**Configuration management:**

- `--environment <env>` - Configuration environment (development/production)
- `--chunk-size <int>` - Pages per chunk (default: 20)
- `--ocr-engine <engine>` - Specify an OCR engine (can be repeated)
- `--model <model_name>` - Ollama model name (default: qwen3:8b)

**Performance tuning:**

- `--workers <int>` - Number of concurrent workers (default: 4)
- `--memory <float>` - Maximum memory limit in GB (default: 4.0)

**Output control:**

- `--output <dir>` - Output directory (default: ./output)
- `--formats <format>` - Output formats: markdown,json,text (default: markdown,json)

**Debug options:**

- `--log-level <level>` - Log level: DEBUG,INFO,WARNING,ERROR
- `--log-file <path>` - Log file path
- `--verbose` - Verbose logging mode
- `--quiet` - Quiet mode

**Environment checks:**

- `--skip-checks` - Skip environment self-checks
- `--check-only` - Run environment checks only
- `--strict-check` - Treat warnings as errors

### Development and Testing

```bash
# Run tests
uv run pytest

# Type checking
uv run mypy src

# Lint checks
uv run ruff check

# Verify the environment
uv run python -m pdf2markdown --check-only
```

## ⚙️ Configuration System

This project uses a layered configuration system with a flexible override strategy:

### Configuration File Hierarchy

1. **`config/default.yaml`** - Default baseline configuration
2. **`config/{environment}.yaml`** - Environment-specific configuration overrides
3. **Command-line arguments** - Runtime parameter overrides

### Default Configuration In Depth

```yaml
# Resource limits
max_memory_gb: 4.0
confidence_threshold: 0.8

# OCR configuration
ocr_engines:
  - paddleocr # Preferred for Chinese recognition
  - tesseract # Fallback for English recognition
chunk_size_pages: 20
max_workers: 4

# Ollama AI configuration
ollama_model: qwen3:8b
ollama_timeout_seconds: 600.0
ollama_max_retries: 2
ollama_batch_size: 4
ollama_cache_size: 128
ollama_num_ctx: 8192
ollama_max_prompt_chars: 12000
ollama_format: json

# Output configuration
output_formats:
  - markdown
  - json
checkpoint_dir: ./checkpoints
temp_dir: ./temp

# PDF rendering settings
pdf_render_dpi: 200
pdf_render_format: jpeg
```

## 🏗️ Technical Architecture

### Core Processing Pipeline

```
PDF input → Intelligent document analysis → Dynamic chunking → Multi-engine OCR → AI content filtering → Quality checks → Multi-format output
```

### Module Structure

```
pdf2markdown/
├── 📁 models/                   # Data model layer
│   ├── __init__.py             # Model exports
│   └── data_models.py          # Core data model definitions
├── 📁 utils/                    # Utility modules
│   ├── __init__.py             # Utility module exports
│   ├── logging.py              # Loguru logging configuration
│   ├── progress.py             # Terminal progress bar
│   └── env_check.py            # Environment self-check utilities
├── 📄 __init__.py               # Main public interface
├── 📄 __main__.py               # CLI entry point
├── 📄 main.py                   # Main application logic
├── 📄 config_manager.py         # Configuration manager
├── 📄 memory_manager.py         # Memory management module
├── 📄 checkpoint_manager.py     # Checkpoint resume manager
├── 📄 enhanced_coordinator.py   # Main coordinator
├── 📄 smart_pdf_processor.py    # PDF document processor
├── 📄 multi_ocr_processor.py    # Multi-engine OCR processor
├── 📄 ollama_content_filter.py  # Ollama AI content filter
└── 📄 output_manager.py         # Output manager
```

### Data Model Architecture

A type-safe data model system built on **Pydantic v2**:

```python
# Core type definitions
LanguageTag = Literal["zh", "en", "mixed"]
OutputFormat = Literal["markdown", "json", "text"]
ChunkStatus = Literal["pending", "processing", "completed", "failed", "skipped"]

# Main data models
- PageSpan           # Page range representation
- ContentChunk       # Content chunk object
- DocumentInfo       # PDF document structure information
- ProcessingConfig   # Processing pipeline configuration
- OCRLPayload/Result # OCR input/output data structures
- FilteredContent    # Post-AI-filter results
- OutputArtifact     # Output artifact description
- CheckpointRecord   # Checkpoint resume records
- ProcessingState    # Runtime state and final results
```

## 🔧 Core Modules In Depth

### 1. Smart PDF Processing Module (`smart_pdf_processor.py`)

**Core capabilities**

- **Intelligent document analysis**: Automatically identifies document type, section boundaries, and language distribution
- **Adaptive chunking**: Dynamically chunks documents according to structure and content density
- **Streaming processing**: Avoids memory overflow on large files
- **Quality assessment**: Evaluates scan quality during preprocessing to optimize processing parameters

**Key characteristics**

- Handles PDF files up to 500M+
- Intelligent language detection with support for mixed Chinese-English documents
- Memory optimization strategies that adapt to different hardware configurations

### 2. Multi-Engine OCR Integration (`multi_ocr_processor.py`)

**Supported OCR engines**

- **PaddleOCR**: Strong Chinese recognition, handles complex page layouts
- **Tesseract**: Fallback option for English recognition, handles unusual fonts
- **PassThroughEngine**: Debug mode, passes pre-extracted text straight through

**Intelligent features**

- **Language adaptation**: Automatically detects Chinese and English passages and dispatches the matching OCR engine
- **Quality retries**: Low-quality pages are automatically enhanced and retried
- **Result fusion**: Intelligently merges multi-engine results for higher accuracy
- **Caching**: Avoids reprocessing identical content

### 3. AI Content Filtering (`ollama_content_filter.py`)

**Core capabilities**

- **Intelligent extraction**: Uses an LLM to identify and extract pure article content
- **Automatic filtering**: Filters out image descriptions, table contents, headers and footers
- **Structure preservation**: Maintains the paragraph structure and hierarchy of the original text
- **Confidence scoring**: Assesses the quality of extraction results

**Technical highlights**

- Supports segmented processing of long texts
- Intelligent batch processing optimization
- Result caching
- Structured JSON output

### 4. Memory Management (`memory_manager.py`)

**Dynamic optimization strategies**

- Real-time memory usage monitoring
- Dynamically adjusts batch size according to available memory
- Automatic garbage collection
- Memory warnings and limit enforcement

**Performance**

- 10,000 memory monitoring calls in < 0.2 seconds
- Smart batch-size adjustment algorithm
- Multi-process memory isolation

### 5. Checkpoint Resume (`checkpoint_manager.py`)

**State management**

- JSON-format checkpoint files
- Supports saving and restoring processing progress
- Intelligently skips already-processed pages
- Detailed error state records

**Fault tolerance**

- A single chunk failure does not affect overall processing
- Automatic error recovery and retry
- Complete processing history tracking

### 6. Output Management (`output_manager.py`)

**Supported formats**

- **Markdown**: Preserves the original hierarchy, ready for further editing
- **JSON**: Structured data, easy for programs to consume
- **Text**: Minimal format, easy to read

**Quality assurance**

- Output quality assessment
- Detailed processing statistics
- Error reports and suggestions
- Metadata integrity checks

## 📊 Performance Benchmarks

### Benchmark Results

| Metric                            | Expected    | Notes                                          |
| --------------------------------- | ----------- | ---------------------------------------------- |
| **Processing speed**              | 2-4 hours   | 500M file, depending on hardware and OCR engine |
| **Memory usage**                  | 2-4GB       | Peak memory use, dynamically tuned             |
| **Recognition accuracy**          | 90%+        | Accuracy on article content                    |
| **Supported file size**           | 1GB+        | Larger files theoretically possible, limited only by memory |
| **Concurrent workers**            | 2-8 processes | Adjusted automatically based on memory       |
| **Memory monitoring performance** | <0.2s       | Benchmark of 10,000 calls                      |

### Performance Optimization Strategies

- **Smart chunking**: Dynamically adjusts chunk size according to content density
- **Caching**: Dual caching of OCR results and AI filtering results
- **Memory management**: Real-time monitoring with dynamic batch-size adjustment
- **Parallel processing**: Multi-process execution with intelligent resource scheduling

## 🧪 Test Coverage

The project includes 10 test files, fully covering all core functionality:

```bash
# Run all tests
uv run pytest

# Run tests for a specific module
uv run pytest tests/test_models.py          # Data model tests
uv run pytest tests/test_coordinator.py      # Coordinator tests
uv run pytest tests/test_multi_ocr.py        # OCR processing tests
uv run pytest tests/test_ollama_filter.py    # AI filter tests
uv run pytest tests/test_cli.py              # CLI interface tests
```

### Functional Areas Covered by Tests

✅ **Data model tests** - Pydantic v2 model validation and type checking
✅ **Configuration management tests** - Multi-layer config merging and parameter overrides
✅ **Memory management tests** - Dynamic memory adjustment and performance benchmarks
✅ **OCR processing tests** - Multi-engine priority and caching mechanisms
✅ **Content filtering tests** - Ollama client retries and batch processing
✅ **PDF processing tests** - Smart chunking and streaming processing
✅ **CLI interface tests** - Argument parsing and environment checks
✅ **Checkpoint resume tests** - State saving and restoration mechanisms
✅ **Output management tests** - Multi-format output generation
✅ **Integration tests** - End-to-end processing pipeline

## 🔍 Environment Check Tool

The project ships with a complete environment check:

```bash
# Run the full environment check
uv run python -m pdf2markdown --check-only

# Skip environment checks and run directly
uv run python -m pdf2markdown document.pdf --skip-checks

# Strict-mode check
uv run python -m pdf2markdown --check-only --strict-check
```

### What Gets Checked

- ✅ **Python version check** - Ensures Python 3.13+ is in use
- ✅ **Dependency check** - Verifies the installation status of every required package
- ✅ **OCR engine check** - Checks PaddleOCR and Tesseract availability
- ✅ **Ollama service check** - Verifies the Ollama service is running
- ✅ **Model availability check** - Confirms the specified model has been downloaded
- ✅ **System resource check** - Assesses available memory and storage

## 🛠️ Advanced Configuration Examples

### Optimized Configurations for Different Scenarios

#### High-Quality Processing Configuration

```python
# config/high_quality.yaml
max_memory_gb: 8.0
confidence_threshold: 0.9
ocr_engines: [paddleocr, tesseract]
chunk_size_pages: 10        # Smaller chunks improve quality
pdf_render_dpi: 300         # Higher DPI improves recognition
ollama_num_ctx: 16384       # Larger context window
```

#### Fast Processing Configuration

```python
# config/fast_processing.yaml
max_memory_gb: 2.0
confidence_threshold: 0.7
ocr_engines: [paddleocr]    # Use only the fastest engine
chunk_size_pages: 50        # Larger chunks improve speed
max_workers: 2              # Fewer workers, less memory
pdf_render_dpi: 150         # Lower DPI improves speed
```

#### Low-Resource Configuration

```python
# config/low_resource.yaml
max_memory_gb: 1.5
chunk_size_pages: 5
max_workers: 1
pdf_render_format: jpeg     # Use a more space-efficient format
ollama_batch_size: 2        # Smaller batch size
```

### Command-Line Configuration Examples

```bash
# High-quality mode
uv run python -m pdf2markdown document.pdf \
  --environment high_quality \
  --model qwen3:8b \
  --formats markdown,json

# Fast mode
uv run python -m pdf2markdown document.pdf \
  --environment fast_processing \
  --workers 1 \
  --memory 2

# Low-resource mode
uv run python -m pdf2markdown document.pdf \
  --environment low_resource \
  --chunk-size 5 \
  --workers 1
```

## 🔧 Development Guide

### Project Structure

```
pdf2markdown/
├── src/                    # Source code
│   └── pdf2markdown/       # Main package
│       ├── models/         # Data models
│       ├── utils/          # Utility modules
│       └── [core modules].py   # Feature modules
├── config/                 # Configuration files
├── tests/                  # Test files
├── output/                 # Default output directory
├── checkpoints/            # Checkpoint files
├── temp/                   # Temporary files
├── pyproject.toml          # Project configuration
└── uv.lock                 # Dependency lock file
```

### Code Quality Tools

```bash
# Format code
uv run ruff format src/

# Lint code
uv run ruff check src/

# Type checking
uv run mypy src/

# Run all checks
uv run ruff check src/ && uv run mypy src/ && uv run pytest
```

### Extending the Project

#### Adding a New OCR Engine

```python
# Add in multi_ocr_processor.py
class CustomOCREngine(BaseOCREngine):
    def process_image(self, image: np.ndarray) -> OCRResult:
        # Implement custom OCR logic
        pass

# Register the new engine
ocr_processor.register_engine("custom", CustomOCREngine())
```

#### Custom Output Formats

```python
# Add in output_manager.py
class CustomFormatter(BaseOutputFormatter):
    def format_output(self, result: ProcessingResult) -> str:
        # Implement custom formatting logic
        pass
```

## ❓ FAQ and Troubleshooting

### Q: What if memory runs out when processing large files?

**A**: You can optimize memory usage by:

- Limiting memory usage with the `--memory` parameter
- Reducing the `--chunk-size` value
- Reducing the number of concurrent workers with `--workers`
- Using the `low_resource` configuration environment

### Q: OCR recognition quality is disappointing?

**A**: The following optimization strategies are recommended:

- Check the resolution of the source PDF (300DPI+ recommended)
- Try different OCR engine combinations
- Adjust the `confidence_threshold` parameter
- Re-process using a higher-quality scan

### Q: Ollama model calls failing?

**A**: Check the following:

- Make sure the Ollama service is running: `ollama serve`
- Verify the model has been downloaded: `ollama list`
- Check that the model name is correct: `qwen3:8b`

### Q: Processing is too slow — how do I speed it up?

**A**: Try the following optimizations:

- Increase the number of parallel workers (when memory allows)
- Use GPU acceleration (if you have CUDA)
- Choose a smaller AI model
- Use the `fast_processing` configuration

## 📄 License

This project is released under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions in every form are welcome!

### Ways to Contribute

- 🐛 **Report bugs**: Report issues via the issue tracker
- 💡 **Suggest features**: Propose new feature ideas
- 📝 **Improve documentation**: Polish documentation and examples
- 🔧 **Contribute code**: Submit pull requests

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push the branch: `git push origin feature/amazing-feature`
5. Open a pull request

### Code Standards

- Follow PEP 8 code style
- Use ruff for code formatting
- Pass mypy type checking
- Write corresponding test cases

## 📝 Changelog

### v1.0.0 (current version)

#### ✨ New Features

- ✅ Complete PDF processing pipeline
- ✅ Multi-engine OCR support (PaddleOCR + Tesseract)
- ✅ Ollama AI content filtering integration
- ✅ Checkpoint resume
- ✅ Multi-format output support (Markdown, JSON, Text)
- ✅ Smart memory management
- ✅ Environment self-check tooling
- ✅ Rich CLI parameter support
- ✅ Complete test coverage

#### 🏗️ Technical Implementation

- ✅ Type-safe data models built on Pydantic v2
- ✅ Modular architecture design
- ✅ Layered configuration system
- ✅ Error handling and fault tolerance mechanisms
- ✅ Performance optimization and caching

---

**PDF2Markdown** - A modern solution dedicated to intelligent article extraction from large PDF documents 🚀

