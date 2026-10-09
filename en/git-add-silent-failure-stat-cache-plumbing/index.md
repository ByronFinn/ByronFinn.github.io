# When git add Exits 0 but Stages Nothing: Debugging Git Stat-Cache

- Date: 2026-10-09
- Author: ByF
- URL: https://blog.baifan.site/en/git-add-silent-failure-stat-cache-plumbing/
- Description: A modified file in the working tree, diffs clearly visible, yet git add exits 0 without updating any index entries. Digging into Git's read-cache.c stat-cache optimizations, Racy Git races, and how low-level update-index commands bypass high-level caching.

---


When writing automation scripts or working in the terminal, developers assume a simple rule: as long as `git add <file>` exits with code 0, the change is staged. Today, while updating author metadata on the blog, I hit an elusive silent failure: real file modifications on disk, `git diff` clearly printing the hunk, `git add` returning 0, yet `git status` stubbornly insisting the file was untracked, with `git diff --cached` remaining completely empty.

<!-- more -->

## The Symptom: Real Changes on Disk, but Nothing Gets Staged

The reproduction environment:
- **Operating System**: macOS Darwin 24.6.0 (arm64, APFS filesystem)
- **Git Version**: git version 2.50.1 (Apple Git-155)
- **Trigger**: Modifying the leading comment in `data/authors/ByF.toml` while committing updates alongside 《{{< ref "posts/2026-10-08-evaluating-agent-skills-first-principles" >}}》.

The state was straightforward:

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

The difference was indisputable. I ran the routine staging command:

```bash
$ git add data/authors/ByF.toml
$ echo $?
0
```

Zero exit code. Yet checking status immediately afterwards yielded:

```bash
$ git status
Changes not staged for commit:
	modified:   data/authors/ByF.toml

no changes added to commit (use "git add" and/or "git commit -a")

$ git diff --cached
# No output at all
```

Trying forceful options changed nothing:

```bash
$ git add -u
$ git add -f data/authors/ByF.toml
$ git commit -a -m "chore: test"
On branch main
Changes not staged for commit:
	modified:   data/authors/ByF.toml
no changes added to commit
```

Every routine high-level command failed silently. No matter what flags were passed, the staging index refused to ingest the file change, emitting zero warnings or errors.

## Inspecting the Low Level: Divergence Between Object Store and Index

To isolate the fault, we have to drop down from high-level user commands and inspect Git's raw plumbing data:

```bash
# Calculate the blob SHA of the file currently on disk
$ git hash-object data/authors/ByF.toml
de320197c11de72a4b1a648d67cbba9a5ba60a39

# Inspect what .git/index actually holds for this path
$ git ls-files --stage data/authors/ByF.toml
100644 881fa632c8de2f5b24386e405dbf80f41583f435 0	data/authors/ByF.toml

# Check the blob recorded in the current HEAD commit
$ git ls-tree HEAD data/authors/ByF.toml
100644 blob 881fa632c8de2f5b24386e405dbf80f41583f435	data/authors/ByF.toml
```

The telemetry confirmed an outright contradiction:
1. The working tree held new content hashing to `de32019...`.
2. The index `.git/index` clung to the old blob `881fa63...`.
3. `git add` returned 0, yet **it neither wrote the new blob into the object database nor updated the hash pointer in the index entry**.

Next, rule out filesystem locks or dirty index bitflags:

```bash
# Check for abandoned lock files
$ ls -la .git/index.lock
ls: .git/index.lock: No such file or directory

# Verify file status flags in the index
$ git ls-files -v data/authors/ByF.toml
H data/authors/ByF.toml
```

The output letter was uppercase `H`, signifying a normal, unmerged tracked entry (as opposed to lowercase `h` for assume-unchanged or `S` for skip-worktree). The path was neither ignored nor locked.

## The Root Cause: Git's Stat Cache Took a Shortcut

The root cause lies in Git's performance optimization: **the Stat Cache**.

In repositories containing thousands of files, reading every working tree file byte-by-byte to compute SHA hashes during a simple `git status` or `git add` would destroy disk I/O and CPU throughput. Consequently, Git caches raw operating system metadata inside each `cache_entry` in `.git/index`.

As declared in Git's source tree (`read-cache.c`):

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
    /* ... bitflags and name ... */
};
```

When determining whether a file has changed, Git does not initially invoke a hashing function. It invokes the POSIX system call `lstat()`. The core evaluator `ie_match_stat()` compares:
1. Modification timestamp (`mtime`, seconds and nanoseconds)
2. Status change timestamp (`ctime`)
3. Device identifier (`dev`) and Inode number (`ino`)
4. File size (`size`)

Only when these stat metrics diverge does Git classify the file as "dirty," prompting it to open the descriptor and digest content.

### Why Did `git diff` See It While `git add` Bypassed It?

- `git diff` follows the diff inspection path. When generating hunks, it reads working tree content directly.
- `git add` follows `builtin/add.c` -> `refresh_cache()`.
- Prior to this run, an execution inside a restricted sandbox attempted to touch `.git/index.lock` and failed with `Operation not permitted`. The subsequent hand-off created a timestamp collision between the host filesystem buffer and Git's cached index metadata.
- Under sub-second granularity or filesystem writeback delays (the classic **Racy Git** problem), `ie_match_stat()` short-circuited: **Git falsely concluded that the filesystem metadata matched the index record, deducing that the file was clean**.

Because Git deemed that no changes existed to begin with, `git add` considered its job done and exited with status 0.

## Breaking Out: Low-Level Plumbing Overrides the Cache

When high-level commands get stuck on the Stat Cache, the resolution is to bypass heuristic shortcuts and issue explicit plumbing instructions.

### Diagnostic & Remediation Cheat Sheet

| Step | Plumbing Command | Expected Normal State | Failure / Stale State Symptom |
| :--- | :--- | :--- | :--- |
| **1. Verify disk hash** | `git hash-object <file>` | Prints current updated blob SHA | Differs from expected if unwritten |
| **2. Inspect index entry** | `git ls-files --stage <file>` | Should match disk blob SHA | **Old SHA** (proves `git add` skipped update) |
| **3. Puncture Stat Cache** | `git update-index --really-refresh` | Silent exit (0) | Outputs `<file>: needs update` |
| **4. Force index write** | `git update-index --add <file>` | Exits 0 and rewrites entry | Index SHA immediately matches disk |

### Step 1: Forcing a Raw-Byte Verification

Execute the plumbing tool `git update-index` with `--really-refresh`:

```bash
$ git update-index --really-refresh
data/authors/ByF.toml: needs update
```

The terminal instantly responded with `data/authors/ByF.toml: needs update`.

The explicit purpose of `--really-refresh` is to instruct Git to **bypass all lstat() metadata shortcuts**, reading disk content directly to hash and compare against the index SHA. This punctured the stale cache, forcing Git's state machine to acknowledge the path as dirty.

### Step 2: Direct Plumbing Ingestion

To prevent any lingering tree-cache filters from interfering, update the entry via plumbing:

```bash
# Bypass high-level filters; hash the file into objects and rewrite the index entry
$ git update-index --add data/authors/ByF.toml

# Verify the index SHA
$ git ls-files --stage data/authors/ByF.toml
100644 de320197c11de72a4b1a648d67cbba9a5ba60a39 0	data/authors/ByF.toml
```

The index entry instantly matched the working tree hash `de32019...`.

Staging and committing proceeded normally:

```bash
$ git status
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	modified:   data/authors/ByF.toml

$ git commit -m "chore: update ByF.toml comment wording"
[main 5a70ed9] chore: update ByF.toml comment wording
 1 file changed, 2 insertions(+), 1 deletion(-)
```

The blockage evaporated, and the commit was pushed upstream without friction.

## Engineering Takeaways

When orchestrating automation pipelines, continuous delivery agents, or terminal coding harnesses like those dissected in 《{{< ref "posts/2026-06-22-claude-code-skills-system" >}}》, keep these lessons in mind:

1. **Exit code 0 guarantees no side effects**: `git add` means "stage designated modifications." If its internal optimizer concludes that zero modifications exist, the operation naturally succeeds with nothing done. Returning 0 is mathematically consistent to the command, but represents a fatal silent failure to the caller.
2. **Assert index hashes in mission-critical scripts**: In automated workflows where file staging must be verified, checking the command exit code is insufficient. Verify that `git diff --cached --quiet` fails (confirming staged changes) or query `git ls-files --stage` directly.
3. **Low-level plumbing is the fastest way out when standard commands misbehave**: When standard commands get tangled in cached state heuristics, don't waste time retrying flag variations. Dropping down to `update-index`, `hash-object`, and `cat-file` operates directly on Git's object graph and index tree, cutting through the confusion cleanly.

