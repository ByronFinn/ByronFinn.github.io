# Linux Out of Memory? ZRAM Compression and Practical Config


<!-- more -->

Running out of memory is the norm on Linux devices — especially small-memory VPSes, Raspberry Pis, and old laptops. The traditional fix is adding a SWAP partition, but many people find the box actually gets laggier after adding one.

Starting from how things work under the hood, this post compares SWAP and ZRAM so you know exactly **which to use in which scenario, and how to configure them**.

## What SWAP Really Is: Faking Memory with Disk

SWAP is simple — data that no longer fits in memory gets written to disk and read back when needed. The problem is the word "disk".

**Disk IO and memory IO differ by orders of magnitude:**

| Operation | Latency |
|------|------|
| Memory access | ~100 ns |
| SSD random read | ~100 μs (1,000x slower) |
| HDD random read | ~10 ms (100,000x slower) |

This means that once the system starts hammering SWAP (the so-called swap thrashing), processes keep getting blocked on disk IO, and **what you see is: stuttering, near-freezes, a cursor that moves while nothing responds to clicks**.

SWAP also has side effects on SSDs — frequent writes accelerate NAND wear (modern SSDs already last a long time, but under heavy SWAP load it still shouldn't be ignored).

**SWAP works when:**

- The disk is an NVMe SSD with low enough IO latency
- Memory is mostly sufficient, and SWAP is just an occasional emergency buffer
- You don't mind the occasional stutter, as long as the OOM (Out of Memory) killer doesn't take out your processes

**SWAP is wrong when:**

- The disk is an HDD or slow eMMC
- Memory is regularly tight — SWAP becomes the norm rather than the emergency
- You need stable, low-latency services (databases, API services)

## What ZRAM Really Is: Squeezing More Room Out of Memory

ZRAM never touches the disk. It creates a compressed block device in memory, storing cold memory pages compressed and decompressing them on demand.

Core advantages:

1. **Data always stays in memory** — no disk IO bottleneck; latency is in microseconds
2. **Compression ratio is typically 2:1 to 3:1** — 1 GB of physical memory works like 2–3 GB
3. **SSD-friendly** — fewer disk writes, longer lifespan

Hidden costs:

- **CPU overhead**: compression and decompression take CPU. The lz4 algorithm is already lightweight, but on devices where the CPU itself is the bottleneck (very low-end ARM chips) it still shows.
- **Compression isn't infinite**: once physical memory is exhausted, ZRAM can't save you either — you still need SWAP as a safety net.

## How to Choose: A Decision Flow

Don't just say "bad disk, use ZRAM" — decide in layers based on the actual situation:

```
What kind of disk do you have?
├── Pure NVMe SSD
│   ├── Memory mostly sufficient (occasionally short) → SWAP is enough
│   └── Memory regularly tight → ZRAM first + a small SWAP as backup
├── Pure SATA SSD
│   └── ZRAM as primary + small SWAP backup recommended
├── SSD + HDD mix
│   └── ZRAM primary, SWAP on the SSD (not the HDD)
├── Pure HDD / eMMC
│   └── ZRAM is a must; avoid SWAP where possible
└── VPS (cloud disks usually have decent IO)
    └── ZRAM primary, optionally a small SWAP to prevent OOM
```

**One-line summary: the worse the disk, the more ZRAM matters; the smaller the memory, the more necessary ZRAM becomes.**

## ZRAM Configuration in Practice

### 1. Install the tools

```bash
sudo apt update && sudo apt install -y zram-tools
```

### 2. Configure the parameters

Edit the config file:

```bash
sudo nano /etc/default/zramswap
```

Fill in the following:

```ini
ALGO=lz4          # Fast compression algorithm, balancing speed and ratio
PERCENT=50        # Use 50% of physical memory as ZRAM space
PRIORITY=100      # Prefer ZRAM over disk SWAP
```

**How to pick PERCENT?**

| Physical memory | Suggested PERCENT | Notes |
|----------|-------------|------|
| ≤ 512MB | 100% | Memory is tiny — the more compressed space the better |
| 1GB ~ 2GB | 75% ~ 100% | Tune to your workload |
| 4GB ~ 8GB | 50% | Balance compressed space and usable memory |
| > 8GB | 25% ~ 50% | Usually enough; no aggressive compression needed |

Note: a bigger PERCENT isn't better. ZRAM itself consumes physical memory; set it too high and you squeeze the memory available to normal programs, actually worsening memory pressure. 50% is a fairly safe starting point — adjust based on real usage.

### 3. Start it and enable at boot

```bash
sudo systemctl enable --now zramswap.service
```

### 4. Verify it took effect

```bash
swapon --show
```

Seeing `/dev/zram0` means success:

```
NAME       TYPE      SIZE USED PRIO
/dev/zram0 partition  XXX   0  100
```

### 5. Monitor compression status

```bash
zramctl
```

Sample output:

```
NAME       ALGORITHM DISKSIZE  DATA  COMPR  TOTAL STREAMS MOUNTPOINT
/dev/zram0 lz4         XXXG  XXXM  XXXXX  XXXXX       N  [SWAP]
```

Watch the ratio of `DATA` (raw data size) to `COMPR` (compressed size) — that's the actual compression ratio.

More detailed stats:

```bash
cat /sys/block/zram0/mm_stat
```

## ZRAM + SWAP Hybrid Strategy (Recommended)

Good as ZRAM is, physical memory is finite. When even the compressed data won't fit, the system will OOM. **Use ZRAM + disk SWAP together**, with PRIORITY controlling the order:

- ZRAM at **PRIORITY=100** as the first tier — absorbs ordinary memory pressure
- Disk SWAP at **PRIORITY=10** as the fallback — prevents OOM in extreme cases

This way the system uses ZRAM first (fast), and only when ZRAM fills up does it slowly spill onto disk SWAP (slow, but it won't die).

If you already have a SWAP partition, there's no need to delete it — just set ZRAM's PRIORITY higher, and the kernel picks by priority automatically.

## FAQ

**Q: Does ZRAM eat my available memory?**

Yes. The ZRAM device itself pre-allocates a chunk of memory. But you're trading a little memory for much more compressed space, so the net effect is positive. At a 50% ratio, a 2 GB device sets aside 1 GB for ZRAM, which after compression is equivalent to 2–3 GB of SWAP capacity — total usable memory goes up.

**Q: Does ZRAM raise CPU usage?**

A small increase. lz4's CPU cost is very low. Tested on ARM devices like the Raspberry Pi 4, the extra CPU usage during SWAP operations typically runs 3%–8%. Only extreme, high-frequency memory workloads warrant attention.

**Q: Should I turn off my existing SWAP?**

Usually not. Keep the existing SWAP at a low priority and let ZRAM handle things first. If your disk is an HDD, consider shrinking or disabling SWAP to avoid frequent disk writes.

**Q: lz4 or zstd for the compression algorithm?**

For daily use, lz4: extremely fast compression/decompression, lowest latency. If memory is desperately tight (a 256 MB device, say), consider zstd — a higher compression ratio (about 20%–30% better than lz4) but more CPU overhead. For most scenarios, lz4 is the optimal choice.

