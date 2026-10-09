# git add 返回 0 却拒绝暂存：一次 Git 索引 Stat Cache 幽灵故障排查

- Date: 2026-10-09
- Author: ByF
- URL: https://blog.baifan.site/git-add-silent-failure-stat-cache-plumbing/
- Description: 工作区修改确凿，git add 退出码为 0 却未更新任何索引条目。深入 Git 源码 read-cache.c 剖析 stat-cache 优化短路与 Racy Git 竞态，演示底层管道命令 update-index 如何穿透瓷器层缓存伪象。

---


在自动化流水线或沙盒环境中操作 Git，开发者通常默认一个前提：只要 `git add <file>` 的退出码为 0，工作区变更就已经稳妥写入了暂存区。但今天在维护博客并提交作者元数据时，撞上了一个罕见的静默失效：工作区内容变更确凿，`git diff` 清楚打印出差异，执行 `git add` 返回 0，随后的 `git status` 依然顽固显示文件未暂存，`git diff --cached` 空无一物。

<!-- more -->

## 故障现场：确凿的差异与瘫痪的暂存

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

变更真实存在。于是执行常规的暂存命令：

```bash
$ git add data/authors/ByF.toml
$ echo $?
0
```

退出码为 0。但紧接着检查状态：

```bash
$ git status
Changes not staged for commit:
	modified:   data/authors/ByF.toml

no changes added to commit (use "git add" and/or "git commit -a")

$ git diff --cached
# 无任何输出
```

尝试使用强制选项与全量更新：

```bash
$ git add -u
$ git add -f data/authors/ByF.toml
$ git commit -a -m "chore: test"
On branch main
Changes not staged for commit:
	modified:   data/authors/ByF.toml
no changes added to commit
```

常规的瓷器层（Porcelain）操作全部失效。无论如何添加，暂存区都拒绝吸纳这一修改，且整个过程不报任何警告。

## 探针深入：对象库与索引树的断裂

为查明原因，必须剥离日常使用的瓷器命令，下潜到 Git 的管道（Plumbing）层查看底层数据结构。

首先检查工作区文件计算出的哈希，与索引中记录的哈希：

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

数据呈现出清晰的断裂：
1. 工作区的最新内容哈希是 `de32019...`。
2. 暂存区 `.git/index` 里记录的依然是旧哈希 `881fa63...`。
3. `git add` 返回 0，但**既没有在对象库中写入新对象，也没有改写索引条目的哈希指向**。

排查是否是文件系统锁残留或索引标记问题：

```bash
# 检查是否存在锁文件
$ ls -la .git/index.lock
ls: .git/index.lock: No such file or directory

# 检查文件是否被设置了 skip-worktree 或 assume-unchanged 标记
$ git ls-files -v data/authors/ByF.toml
H data/authors/ByF.toml
```

输出字母 `H`，表示文件处于正常被追踪状态（unmerged 对应 `M`，assume-unchanged 对应小写 `h`，skip-worktree 对应 `S`）。文件没有被标记忽略，也没有锁文件卡死。

## 根因推导：Stat Cache 机制与判断短路

问题出在 Git 的性能优化核心：**Stat 缓存（Stat Cache）**。

在拥有数万甚至数十万文件的大型代码库中，如果每次执行 `git status` 或 `git add` 都去逐字节读取工作区文件并计算 SHA 哈希，磁盘 I/O 和 CPU 将难以承受。因此，Git 在二进制索引文件 `.git/index` 中维护了一个 `cache_entry` 结构。

参考 Git 源码（`read-cache.c`）中的定义：

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

每次 Git 检查文件是否改变时，调用的并非哈希函数，而是系统调用 `lstat()`。函数 `ie_match_stat()` 会逐一比对以下字段：
1. 修改时间（`mtime` 的秒与纳秒）
2. 状态改变时间（`ctime`）
3. 设备号（`dev`）与 Inode 节点号（`ino`）
4. 文件体积（`size`）

只有在上述元数据发生变动时，Git 才会认为文件“可能被修改”，进而打开文件读取内容。

### 为什么 `git diff` 能感知，而 `git add` 却跳过？

- `git diff` 内部走的是 `diff-lib.c` 的文件比对逻辑。当它检测到任何微弱的外部扰动，或者强制启用文本差异比对时，会深入读取文件缓冲区。
- `git add` 走的是 `builtin/add.c` -> `add_files_to_cache()` -> `refresh_cache()`。
- 在此之前，由于沙盒权限曾尝试操作 `.git/index.lock` 并触发了 `Operation not permitted`，导致后续宿主环境与文件系统的 mtime 发生短暂时间窗口内的冲突。
- 当高精度的纳秒时间戳由于系统截断、文件系统缓存回写延迟，或者文件被快速触碰后 mtime 恰好落入 Git 索引已记录的时间窗口（即著名的 **Racy Git 竞态**）时，`ie_match_stat()` 发生判断短路：**Git 错误地认定工作区文件元数据与索引中记录的一致，进而判定该文件无需暂存**。

因为 Git 认为文件“本来就没有变更”，所以 `git add` 认为自己圆满完成了任务，返回退出码 0。

## 破局：底层管道命令穿透缓存伪象

既然瓷器命令被表层的 Stat Cache 蒙蔽，解决方案就是绕过它，直接向底层管道命令下达强制刷新与写入指令。

### 第一步：强制穿透 Stat 缓存验证

使用管道命令 `git update-index` 携带 `--really-refresh` 参数：

```bash
$ git update-index --really-refresh
data/authors/ByF.toml: needs update
```

终端立即输出 `data/authors/ByF.toml: needs update`。

`--really-refresh` 的核心作用，正是命令 Git **忽略所有基于 lstat() 元数据的快速比对短路**，强行读取磁盘文件的实际内容与索引记录的 SHA 哈希进行比对。这一步终于戳破了 Stat 缓存的虚假平衡，让 Git 内部状态机确认该文件确实处于脏状态。

### 第二步：底层管道命令直接写盘

即便此时 `add` 仍可能受制于旧的索引树缓存，我们可以直接使用底层管道写入：

```bash
# 绕过 Porcelain 的过滤逻辑，强制将文件内容写入对象库并更新 index entry
$ git update-index --add data/authors/ByF.toml

# 验证索引中的哈希值
$ git ls-files --stage data/authors/ByF.toml
100644 de320197c11de72a4b1a648d67cbba9a5ba60a39 0	data/authors/ByF.toml
```

索引条目瞬间被更新为工作区的真实哈希 `de32019...`。

随后检查状态并提交：

```bash
$ git status
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	modified:   data/authors/ByF.toml

$ git commit -m "chore: update ByF.toml comment wording"
[main 5a70ed9] chore: update ByF.toml comment wording
 1 file changed, 2 insertions(+), 1 deletion(-)
```

阻塞彻底解除，提交顺利推送到远端仓库。

## 工程反思与避坑实践

在构建自动化构建脚本、CI/CD 流水线，或类似《{{< ref "posts/2026-06-22-claude-code-skills-system" >}}》中讨论的终端智能体系统时，过度依赖高阶封装命令往往隐藏着认知盲区。

1. **退出码 0 不代表副作用生效**：`git add` 的语义是“将指定的变更加入暂存”。如果它的内部优化器误判“不存在变更”，那么“加入暂存”的操作目标自然为 0，返回退出状态码 0 在逻辑上对它自己是自洽的，但在调用方视角却是致命的静默失败。
2. **在自动化检测中设置哈希断言**：关键流水线如果必须确认暂存成功，单看命令返回值不够充分。通过 `git diff --cached --quiet` 校验暂存区非空，或通过 `git ls-files --stage` 比对对象哈希，才是因果闭环的做法。
3. **认识管道工具的杀伤力**：当常规命令陷入诡异的死锁或状态错乱时，不要反复重试无效的选项组合。调出 `update-index`、`hash-object` 与 `cat-file` 等管道工具，直接对着 Git 的对象数据库和索引树做手术，往往是剥离玄学问题的最快途径。

