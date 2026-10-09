# git add 返回 0 却拒绝暂存：一次 Git 索引 Stat Cache 幽灵故障排查

- Date: 2026-10-09
- Author: ByF
- URL: https://blog.baifan.site/git-add-silent-failure-stat-cache-plumbing/
- Description: 工作区修改确凿，git add 退出码为 0 却未更新任何索引条目。深入 Git 源码 read-cache.c 剖析 stat-cache 优化短路与 Racy Git 竞态，演示底层 update-index 命令如何绕过常规命令的缓存判定，强制刷新索引。

---


在写自动化脚本或终端操作 Git 时，大家习惯认为：只要 `git add` 没报错、退出码是 0，改动就一定进暂存区了。但今天在提交博客作者配置时，碰到了一个非常诡异的静默失败：文件改动清清楚楚，`git diff` 能正常输出改动内容，执行 `git add` 也正常返回 0，但紧接着跑 `git status`，文件依然显示未暂存，`git diff --cached` 什么都没有。

<!-- more -->

## 故障现场：改动真实存在，但就是暂存不进去

故障发生在提交《{{< ref "posts/2026-10-08-evaluating-agent-skills-first-principles" >}}》的配套配置修改时。我在工作区编辑了 `data/authors/ByF.toml`，修改了首行注释。

工作区的状态非常直观：

```bash
$ git status
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   data/authors/ByF.toml

$ git diff data/authors/ByF.toml
diff --git a/data/authors/ByF.toml b/data/authors/ByF.toml
index 881fa63..de32019 100644
--- a/data/authors/ByF.toml
+++ b/data/authors/ByF.toml
@@ -1,4 +1,5 @@
-# 作者实体数据 —— 主题 single.html 的 SingleAuthor 按 front matter 原文大小写查 "ByF"。
+# 同 ByF.toml —— schema.html 按小写 "byf" 查询本文件，两文件内容必须一致。
+
```

改动就在那里。于是执行常规暂存：

```bash
$ git add data/authors/ByF.toml
$ echo $?
0
```

退出码是 0。但紧接着检查状态：

```bash
$ git status
Changes not staged for commit:
	modified:   data/authors/ByF.toml

no changes added to commit (use "git add" and/or "git commit -a")

$ git diff --cached
# 没有任何输出
```

换用其他常见的参数强推：

```bash
$ git add -u
$ git add -f data/authors/ByF.toml
$ git commit -a -m "chore: test"
On branch main
Changes not staged for commit:
	modified:   data/authors/ByF.toml
no changes added to commit
```

平时常用的常规命令全部失效。无论怎么加，暂存区都当它不存在，而且整个过程不报任何错误。

## 直接查底层：索引和对象库到底存了什么

既然常规的高阶命令看不出问题，只能用 Git 底层命令（Plumbing）直接查看内部的数据结构。

先看工作区文件的实际哈希，和索引里记录的哈希：

```bash
# 计算工作区文件当前的 blob 哈希
$ git hash-object data/authors/ByF.toml
de320197c11de72a4b1a648d67cbba9a5ba60a39

# 查看暂存区（.git/index）当前记录的条目
$ git ls-files --stage data/authors/ByF.toml
100644 881fa632c8de2f5b24386e405dbf80f41583f435 0	data/authors/ByF.toml

# 查看当前分支最新提交（HEAD）中的 blob 哈希
$ git ls-tree HEAD data/authors/ByF.toml
100644 blob 881fa632c8de2f5b24386e405dbf80f41583f435	data/authors/ByF.toml
```

数据呈现出直接的矛盾：
1. 工作区的最新内容哈希是 `de32019...`。
2. 暂存区 `.git/index` 里记录的依然是旧哈希 `881fa63...`。
3. `git add` 返回了 0，但**既没有把新内容写入对象库，也没有更新索引里的条目**。

再排查是否是文件系统锁残留，或者文件被设置了特殊忽略标记：

```bash
# 检查是否存在锁文件
$ ls -la .git/index.lock
ls: .git/index.lock: No such file or directory

# 检查文件在索引里的状态标记
$ git ls-files -v data/authors/ByF.toml
H data/authors/ByF.toml
```

输出大写字母 `H`，说明文件处于正常的受追踪状态（不是小写 `h` 的 assume-unchanged，也不是 `S` 的 skip-worktree）。没有忽略标记，也没有锁文件卡住。

## 为什么会这样：Git 的 Stat 缓存偷懒了

问题出在 Git 的性能优化机制：**Stat 缓存（Stat Cache）**。

在有成千上万个文件的大仓库里，如果每次跑 `git status` 或 `git add` 都要逐字读取磁盘文件去算 SHA 哈希，磁盘 I/O 很快就会撑不住。因此，Git 在二进制索引文件 `.git/index` 里维护了一个 `cache_entry` 结构。

在 Git 源码（`read-cache.c`）中是这样定义的：

```c
struct cache_time {
    uint32_t sec;
    uint32_t nsec;
};

struct cache_entry {
    struct cache_time ce_ctime;
    struct cache_time ce_mtime;
    uint32_t ce_dev;
    uint32_t ce_ino;
    uint32_t ce_mode;
    uint32_t ce_uid;
    uint32_t ce_gid;
    uint64_t ce_size;
    struct object_id oid;
    /* ... 标志位与路径名 ... */
};
```

Git 在检查文件有没有被修改时，第一步调用的不是哈希计算，而是系统调用 `lstat()`。内部函数 `ie_match_stat()` 会优先比对以下元数据：
1. 文件修改时间（`mtime` 的秒和纳秒）
2. 状态改变时间（`ctime`）
3. 设备号（`dev`）和 Inode 节点号（`ino`）
4. 文件体积（`size`）

只有当这些元数据有变动时，Git 才会认为文件“可能被改动了”，进而打开文件读取实际内容。

### 为什么 `git diff` 看得到，而 `git add` 却跳过了？

- `git diff` 走的是差异比对路径。当它需要生成文本差异时，会直接去读工作区内容。
- `git add` 走的是常规的索引刷新流程（`builtin/add.c` -> `refresh_cache()`）。
- 在这次操作前，沙盒环境曾因为权限问题尝试写入 `.git/index.lock` 并报错失败（`Operation not permitted`），随后切换环境重新执行，导致宿主文件系统的时间戳与索引内部记录产生短暂错位。
- 在时间戳精度截断或文件系统缓存延迟的特定窗口下（经典的 **Racy Git 竞态**），`ie_match_stat()` 发生了短路判断：**Git 误以为磁盘文件的元数据和索引记录是一致的，从而推断出“这文件没有改动过”**。

因为 Git 认为文件“根本不需要更新”，所以 `git add` 认为自己正常执行完毕，顺理成章地返回了退出码 0。

## 解决办法：用底层命令强制刷新与写入

既然常规命令被表层的 Stat 缓存卡住了，解决思路就是跳过它的启发式判断，直接用底层命令强制检查并写入。

### 第一步：强制跳过元数据比对

使用底层管道命令 `git update-index` 加上 `--really-refresh` 参数：

```bash
$ git update-index --really-refresh
data/authors/ByF.toml: needs update
```

终端立刻打印出 `data/authors/ByF.toml: needs update`。

`--really-refresh` 的作用，就是让 Git **忽略所有基于 lstat() 元数据的快速短路检查**，强制读取磁盘文件的实际内容和索引哈希对比。这一步直接打破了 Stat 缓存的误判，让 Git 内部确认该文件确实变脏了。

### 第二步：底层命令直接入库

此时即便常规 `add` 仍然可能受缓存干扰，可以直接用底层命令把文件强行压入索引：

```bash
# 强制读取文件内容计算哈希、写入对象库，并直接更新索引条目
$ git update-index --add data/authors/ByF.toml

# 验证索引中的哈希值
$ git ls-files --stage data/authors/ByF.toml
100644 de320197c11de72a4b1a648d67cbba9a5ba60a39 0	data/authors/ByF.toml
```

索引里的哈希立即变成了工作区的真实哈希 `de32019...`。

随后检查状态并提交，恢复正常：

```bash
$ git status
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	modified:   data/authors/ByF.toml

$ git commit -m "chore: update ByF.toml comment wording"
[main 5a70ed9] chore: update ByF.toml comment wording
 1 file changed, 2 insertions(+), 1 deletion(-)
```

阻塞解除，提交顺利推送。

## 排查后的几点经验

在编写自动化构建脚本、CI 流程，或者类似《{{< ref "posts/2026-06-22-claude-code-skills-system" >}}》中提到的终端自动化工具时，有几点值得注意：

1. **退出码 0 不等于真正产生了预期改动**：`git add` 的职责是“把改动加入暂存区”。当它的内部判断认为“没有改动”时，目标自然算作完成，返回 0 属于逻辑自洽，但对上层调用方来说就是隐蔽的静默失败。
2. **自动化脚本不要只看命令返回值**：对于必须确保暂存成功的流程，检查退出码是不够的。通过 `git diff --cached --quiet` 确认暂存区非空，或者用 `git ls-files --stage` 直接核验哈希，才算真正闭环。
3. **遇到诡异状态时多看底层命令**：常规高阶命令（Porcelain）为了体验做了很多隐式缓存与优化。当遇到状态错乱、常规命令不讲道理时，直接用底层命令（Plumbing，如 `update-index`、`hash-object`、`cat-file`）去查对象库和索引，往往是排查问题最快的捷径。

