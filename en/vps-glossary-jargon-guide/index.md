# VPS Scene 101: The Complete Dictionary of Hosting Slang


<!-- more -->

The VPS scene runs on a distinctive system of slang that reads like hieroglyphics to newcomers. This post collects the common terms and abbreviations so you can get up to speed fast.

## People and Identity

### MJJ

Originally referred to users hanging around the Hostloc forum; now a blanket term for anyone obsessed with tinkering with VPSes. It comes from a Hostloc forum meme, short for 买鸡鸡/没鸡鸡 ("bought a chicken / no chicken" — interpret it however you like). It started as a slur but gradually evolved into a self-deprecating badge of in-group identity, and in most contexts today it carries no malice (though some also use MJJ for players who pay little and demand much).

## Server Types

### Chicken / Little Chicken (鸡/小鸡)

Refers to a VPS or cloud server. In Chinese, "virtual server" becomes 虚机 (xūjī), and 机 (machine) is a near-homophone of 鸡 (chicken) — the nickname is catchy and cute, so it stuck. A VPS is a server carved out with virtualization; it's the most common kind of machine end users buy, with shared resources, performance, and network.

### Mother Hen (母鸡)

Same as 母机 ("mother machine"): the dedicated server that gets sliced into little chickens via virtualization. The name comes from VPSes (little chicks) all being virtualized — hatched — from a dedicated server (mother hen).

### Dufu / Dedicated Server (杜甫/独服)

A dedicated server is an entire physical server rented by a single customer. You get all of the server's hardware — every CPU core, all the memory, all the disk space, and the network bandwidth — with no resource sharing. (Simply put: a machine on the rack that's yours alone.)

### Bare Metal (裸金属)

Bare metal is at heart just a dedicated server (Dufu) — a physical server with no preinstalled OS or virtualization layer. What the user gets is "naked metal hardware".

### VDS

Between a VPS and a dedicated server — think of it as a "maxed-out" VPS. The core difference between a VDS and a VPS is dedicated resources. In a standard VPS, the CPU cores are usually shared (vCPU), meaning your performance can suffer when neighboring VPSes hog the CPU (the effects of overselling). A VDS promises dedicated hardware resources, especially CPU cores: the provider assigns specific physical cores or threads entirely to your VDS, and no other virtual machine can grab them. Memory and disk are usually dedicated too. Simply put, a VDS = a virtual machine with dedicated-server resource guarantees (though it still depends on the provider's conscience — plenty of them sell lemons as luxury).

### Big-Disk Chicken (大盘鸡)

A VPS or server with a particularly huge disk. CPU and memory configs are usually ordinary, but disk space is extremely generous (1 TB, 2 TB, or even more) at relatively cheap prices. Mainly used for data storage, backups, downloads, running a personal cloud drive, or serving Plex/Jellyfin and the like.

### Web-Hosting Machine (建站机)

A VPS optimized for (or simply suited to) hosting websites. These usually place real demands on CPU performance, memory size, and network stability (especially connectivity to China); disk I/O can't be too shabby either — though requirements on disk capacity and traffic are low.

### Traffic Machine (流量机)

A VPS offering very large monthly traffic (or unlimited traffic) but capped port bandwidth. For example, 10 TB of monthly traffic on a port that may only be 100 Mbps. Suits workloads that need volume over burst speed — data relay, file sharing, and the like.

### Route Machine (线路机)

A VPS whose core selling point is route quality. The hardware (CPU, memory, disk) may be ordinary or even poor, but it offers optimized network connectivity to a specific region — in the overwhelming majority of cases, mainland China.

### Toy Machine (玩具机)

A low-spec, dirt-cheap VPS. Weak performance, middling network — usually good only for learning Linux commands, running light tests, or keeping as a backup node; never for anything serious. Bought purely for fun.

### NAT VPS (NAT机)

A VPS with no dedicated public IPv4 address, sharing one IP with other users. The provider assigns you a port range (10000–10020, say), and you access your services via "IP:port". Because IPv4 addresses are exhausted and expensive, NAT VPSes are extremely cheap — the entry pick and backup exit choice for cash-strapped MJJs. Downsides: anything needing standard ports 80/443 (like web hosting) gets awkward (unless the provider assigns you those two), it depends heavily on neighbors behaving, and the IP is dirty by default and often blocked by default.

### Lame-Leg Machine (瘸腿机)

Generally describes a server with badly asymmetric uplink/downlink bandwidth, or a wide quality gap between outbound and return routes — like a person with a lame leg, walking unsteadily. Examples: blazing-fast downloads (Gbit port) with only 10 Mbps upload; or CN2 GIA on the outbound leg and a US detour on the return. Such machines can be fine for specific uses, but the overall experience suffers. In some contexts, a lame-leg machine also describes a lopsided, incomplete config — something like 8C500M (8 cores paired with 500 MB of RAM).

### Curry Chicken (咖喱鸡)

Servers sitting in Indian datacenters, or run by Indian (Oneman) providers. Routes usually detour through Singapore or Europe, so latency to China is high, and the service and stability are often joked about as having a "curry flavor" — the term carries a whiff of derision and unreliability.

### Turkish Chicken (土鸡)

A homophone of "Turkey" in Chinese; refers to VPSes located in Turkey. The main draws: relatively cheap prices, and frequent use for registering or subscribing to Turkey-region-exclusive low-price services (streaming, games, etc.) — one of the MJJ bargain-hunting tools.

### Group-Buy Chicken (拼好鸡)

Borrowed from Meituan's "Pinhaofan" group-buy meals. Generally describes machines or platforms where an MJJ buys a well-performing or well-routed box, then uses LXC and similar tech to partition the resources and share them out for a fee, splitting the cost.

### Small Pipe (小水管)

A server with fairly small bandwidth. Everyone draws the line differently, but generally: under 100 Mbps for a proxy box / traffic machine, under 50 Mbps for a web-hosting machine.

## Security and Defense

### Takedown-Resistant (抗通报)

Means the provider handles takedown notices or delisting requests from governments and law enforcement leniently.

### Complaint-Resistant (抗投诉)

Mainly means the provider ignores or deals loosely with complaints from copyright holders (e.g., DMCA complaints) and anti-spam organizations (e.g., Spamhaus).

### DDoS-Protected Machine (高防机)

Specifically, a server that can withstand large-scale DDoS attacks.

### XXG Protection (防御XXG)

For example, "50G protection" means the provider promises to scrub attack traffic up to 50 Gbps. If attack traffic reaches 50 Gbps and exceeds the protection cap, the provider usually puts the server into the "blackhole".

### Blackhole (黑洞)

After attacks exceed a certain threshold, all traffic to the IP is temporarily blocked to protect the rest of the datacenter's customers. After a blackhole period (a few hours, say), the IP is usually unblocked automatically.

## Operations and Quality

### Overselling (超兽/超兽金刚)

Same as overselling. The provider crams too many little chickens onto one mother hen, leaving each with badly insufficient resources (especially CPU and disk I/O) and poor performance. A common problem with cheap VPSes (it's the norm — there are no non-oversold VPSes, only usable and unusable ones).

### Oneman

An IDC provider run by a single person. Usually cheap, but technical support, stability, and risk resilience are all weak, with a high chance of the provider vanishing.

### Bolting (跑路)

The provider shuts down and runs off with the money. Higher risk among cheap or newly opened providers.

### Hearse (灵车)

VPS deals or providers with absurdly high specs at absurdly low prices — too good to be true. Usually a new Oneman shop running promotions to grab cash fast; the risk of bolting is extremely high. Buying such a service is called "boarding the hearse" — you may lose everything at any moment.

### Song Joong-ki (宋仲基)

Reading 1: same as "see-you-to-your-grave machine" (送终机), an amped-up, jokey version of the hearse. If a "hearse" might bolt at any time, a "Song Joong-ki" is a provider that plainly opened shop to grab a round of cash and then run — one that has already nailed your coffin shut for you. The highest-risk slur in the lexicon. Reading 2: same as "get-sent-to-China machine" (送中机); judge by context.

### Stone Disk (石头盘)

Specifically, a VPS or server with pathetically slow disk read/write speeds (I/O). Not ordinary slow — outrageously slow, to the point of badly dragging down the server's overall performance.

### Diamond Disk (钻石盘)

A disk even worse than a stone disk — unusable-tier.

### Neighbor (邻居)

Other users/servers on the same network segment as your server.

### Self-Driving / Drone (无人驾驶/无人机)

Providers with little or no human customer service or ticket support, especially certain "Oneman" shops. Everything looks fine day to day, but the moment something breaks or an emergency hits (server goes dark, network failure, misconfiguration), there is no human to step in.

### Oneman Overprovisioned Cloud (Oneman 超开云)

Shaped like the name of a certain cloud provider, but actually a slur for unscrupulous vendors: prone to bolting AND overprovisioning their servers.

## Trading Terms

### PUSH

In some providers' dashboard systems, directly transferring ownership of a VPS to another account.

### Email Change (改邮)

In some providers' account dashboards, transferring VPS ownership to another account by changing the account email.

### Original Email (原油/原邮)

The original email address. Means different things in different contexts. Broadly, it refers to handing over control of the email along with the deal — e.g., registering a pile of Outlook addresses, one mailbox per dedicated use, one per machine, and transferring mailbox ownership with the sale. In more specific trades, like BandwagonHost deals, "original email" by default means the first email used to register the account: since BandwagonHost's mechanism lets the signup email recover the account, an original-email deal isn't just mailbox ownership — it specifically means ownership of the address used at signup, which is safer.

### Payment First / Machine First (先款/先机)

In a trade, whether the money goes first or the machine goes first.

### AFF

Usually a referral link with an invite kickback. Whether you like them is personal taste, but do label AFF links, e.g., phrasing it as "link (AFF included): xxxxxxx".

### Family Heirloom (传家宝)

Discontinued VPS plans with good specs, cheap prices, and excellent routes that can no longer be bought. Because the value-for-money is so high, holders rarely sell — they keep them like family heirlooms.

Sometimes it's sarcastic, meaning overvaluing what you own — e.g., "everyone on Xianyu prices their stuff like a family heirloom".

### Remaining Value (剩余价值)

In a trade, the price computed by prorating the original purchase price against the server's remaining time.

### Recurring Discount (循环优惠)

A promo code that applies not just to the first purchase but to subsequent renewals at the same discount.

### Monthly / Yearly Disposable (月抛/年抛)

Servers or accounts with short lifespans, used and discarded. They usually come from providers' free trials or low-price promos, with no expectation of long-term use or renewal.

## Virtualization and Architecture

### KVM

The mainstream, dependable virtualization technology. It creates a complete, independent virtual machine on the mother hen — just like running VMware or VirtualBox on your own PC. It has its own kernel, can run various operating systems, offers maximum flexibility, isolates well, and resists "neighbor" interference. The vast majority of reputable providers' VPSes use KVM.

### LXC/OVZ (OpenVZ)

Lightweight OS-level container virtualization. Unlike KVM's full VM, it's more like an isolated "room" carved out of the mother hen's operating system. All little chickens share the host kernel. Pros: near-zero performance overhead and low resource usage. Cons: less flexibility, and because the overhead is so low, shady providers oversell it like crazy, wrecking performance.

### XCXG (e.g., 2C2G/1C512M)

Describes a VPS config: the first number is the CPU core count (C = core), the second is the memory size (G = GB, M = MB). So "2C2G" means a 2-core CPU and 2 GB of memory; "1C512M" means 1 core and 512 MB. This is the single most important metric of a little chicken's baseline performance (though not an absolute one — one full 9950X core certainly beats 2 cores of wildly oversold e-waste E5). Note carefully: the "C" here usually means vCPU, which is not the same as a physical core; one physical core can be virtualized into countless vCPUs.

### E5/E5v2/v3/v4

Old Xeons — retired gear, datacenter e-waste. Cheap, terrible single-core, passable multi-core, questionable stability. Spot an E5 and you can bet the mother hen is well past its prime — don't hold high performance expectations, but it's cheap and plentiful.

### EPYC / Xiaolong (EPYC/霄龙)

AMD's datacenter CPUs. Almost none of the hardware is truly old — even the first generation still performs decently today (as of September 2025), and the newer generations explode with cores: standout single-core, monster multi-core, advanced process nodes. If your VPS was hatched from an EPYC mother hen, performance is usually guaranteed — one of the hallmarks of a high-end VPS.

### ARM/Ampere

The ARM architecture, made famous by Oracle's free machines, with specific models like Huawei's Kunpeng 920. Unlike the x86 architectures above, ARM's strength is extreme efficiency: massive core counts at very low power draw (Oracle's free machine is 4C24G, for example). Good for high-concurrency, non-compute-intensive workloads. The downside: the software ecosystem is less mature than x86 — some software needs special compilation or simply won't run. If you play with ARM machines, be ready to tinker.

### Gbit Port / 10Gbit Port (G口/10G口)

The server's NIC port speed: Gbit port = 1 Gbps, 10Gbit port = 10 Gbps. This is the theoretical maximum physical speed between your server and the datacenter switch. In practice, most VPSes run shared bandwidth — you can't, and generally aren't allowed to, saturate it long-term. When some providers' evening "broadband arena" opens at peak hours, getting 100 Mbps out of a Gbit port counts as a win.

## IP and Network

### Clean IP / Dirty IP (干净IP/脏IP)

An unofficial IP quality standard. A clean IP is absent from the major blacklists (some people also count unlocking and native-IP status as cleanliness criteria — again, unofficial, your call), and hasn't received special attention from the GFW. The ideal choice for hosting, streaming unlocks, and normal use. A dirty IP may be recycled from a shared IP "ridden by thousands", or a previous user misbehaved, abused it, or ran gray/black-market operations and got it blacklisted by various services — some come out of the box already "walled".

### Native IP (原生IP)

An IP whose registration location matches the physical location where it's actually used (where the datacenter sits).

### Broadcast IP (广播IP)

IPs registered in one place but used in another, via BGP announcement. For example, some big cloud providers (like Oracle Cloud and Google Cloud in the US) hold enormous IP pools. Opening a new Singapore datacenter amid local IP shortages, they may allocate a batch of IPs from their US pool to Singapore. Likewise, many small shops (AK/AC and the like) broadcast cheap IPs (from parts of Africa, say) into popular regions for use.

### Unlocking (解锁)

Means the server's IP can successfully access and use region-specific services, such as Netflix, Disney+, YouTube Premium, ChatGPT, and so on.

### Sent to China (送中)

Means the IP range is flagged in IP databases as mainland-China usage — usually caused by enabling location services and the like, though some do it deliberately for ad-free YouTube. Generally, being sent to China breaks a lot of services.

### Wrapping with WARP (套WARP)

Installing a client or script that forces all or part of the server's outbound traffic through Cloudflare's WARP network (thanks, Cyber Living Buddha) before it goes out. Essentially a VPN bolted onto the VPS — mainly to provide unlocking, or to give IPv4-only/IPv6-only little chickens a dual-stack egress. Some also try to ride Cloudflare to improve routing or slip past blocking measures.

### Port Forwarding (端口转发)

The essential skill for NAT VPSes. With no dedicated IP, you must set rules in the provider's control panel telling the server: "when someone hits port 12345 on my shared IP, forward the traffic to port 22 (SSH) inside my little chicken". That process is port forwarding.

## Routes and Routing

### The Three Networks (三网)

China Telecom, China Unicom, and China Mobile. Usually used in phrases like "direct on all three", "optimized on all three", or "detoured on all three" to describe extremely good or bad network conditions.

### Detours (绕)

Bad routing. "Detouring" means the network path takes an absurdly long way around. Providers chasing extreme cost control pick the cheapest, worst-quality international transit. The classic is the US detour: you access a Hong Kong server (most cheap HK servers are bliss for China Mobile, US-detoured for Telecom and Unicom) and your packets first fly from China to the US West Coast, then from the US to Hong Kong. Or when accessing a European server, packets first detour to the US before reaching Europe.

### Direct on All Three / Ordinary Routes (三网直/普通线路)

Ordinary routing. "Direct" sounds great, but it generally means the server connects to Chinese carriers straight through plain international exits with no specially optimized commercial bandwidth. This is the most basic route tier — "usable" grade. Telecom users most likely ride the 163 backbone (AS4134), Telecom's plainest, most heavily loaded route: decent by day, but outbound international traffic turns extremely congested at evening peak, with plunging speeds, spiking latency, and heavy packet loss. Unicom typically uses the ordinary international exit (AS10099), similar to Telecom's 163 — poor at evening peak. Mobile generally rides CMI (AS9808), passable in some regions and hours, but overall equally unable to escape evening-peak congestion.

### Optimized on All Three / Optimized Routes (三网优化/优化线路)

A marketing term providers throw around liberally, covering anything that performs better than "ordinary routes". Note that different providers' "optimization" varies wildly in substance — a big shop's (like BandwagonHost) optimized routes may already reach premium-tier quality, while a small shop's "optimization" may just be an ordinary route at higher priority. Quality sits between "ordinary" and "premium", or it means high-priority ordinary routes (the same route comes in different priorities — under resource strain, high priority gets served first; everyone's data SIMs and broadband carry priority flags in the carrier's backend, and many cheap "business broadband" lines are really high-priority home broadband). Meant to ease evening-peak congestion; think "works well" grade. The category is a free-for-all, but roughly:

1. **High-priority ordinary routes**: e.g., Unicom's 4837 CUVIP. Still part of the Unicom backbone, but with priority and bandwidth quality above ordinary routes — very friendly to Unicom users.
2. **Regional quality commercial routes**: e.g., Japan's IIJ and SoftBank. These aren't "dedicated lines" designed specifically for mainland China, but they perform excellently under specific carriers (SoftBank for Unicom) with good value.
3. **CMI in certain regions**: Mobile's CMI is optimized in Hong Kong, Singapore, and other regions, and is sometimes also called an optimized route — better for Mobile users.

Some other routes may also carry the optimized label — judge case by case.

### Premium Routes (顶级线路)

The highest tier of commercial bandwidth, bought at high prices specifically to optimize the mainland-China access experience — "VIP" grade. Characteristics: low latency, high speed, extremely low packet loss, and rock-stable performance even at evening peak. The classics are Telecom's CN2 GIA (AS4809) and its counterparts, Unicom's 9929 (CU Premium/AS9929) and Mobile's CMIN2 (pretty rare).

There's also a special category, **dedicated lines (IPLC/IEPL)**: point-to-point transmission that never touches the public internet, with ultimate stability and the lowest latency — and, of course, the steepest prices. Usually for enterprise applications or high-end personal service (though the market has "fake dedicated lines" that are really optimized routes wearing the label — verify strictly with latency tests and traceroutes).

Also note: a route is not directly equivalent to speed. Routes mostly reflect latency and stability; bandwidth, which is what reflects speed, is a separate dimension of evaluation.

### Return Route / Outbound Route (回程/去程)

"Return" = VPS → your local route; "outbound" = your local → VPS route.

### One-Way / Two-Way Optimization (单程/双程优化)

One-way optimization usually means only the "return" route has been optimized — riding CN2 GIA, say — while the "outbound" route is ordinary. Two-way optimization means both "outbound" and "return" ride optimized routes: a steadier, lower-latency access experience, at a higher price.

> Special warning: many crooked vendors claim optimized routes, or offer "one-way optimization" that is actually outbound-only — which is pointless and dishonest. Blacklist them and don't buy.

### Japan IIJ and SoftBank Routes (日本IIJ和软银线路)

IIJ and SoftBank sit far above ordinary routes (like NTT), but they aren't top-tier dedicated lines either. Between all-three-direct and all-three-optimized — premium economy, if you will. SoftBank performs best for Unicom: stable at evening peak, a "Unicom happy route", with Telecom and Mobile able to go direct. IIJ is theoretically steadier in quality than SoftBank, decent on all three networks (Unicom weaker than on SoftBank) — the balanced pick. In actual use, both are worth a try yourself. (Note from 2025-09-26: SoftBank for Telecom seems to be detouring lately — pending observation.)

### NTT/Cogent/HE

Common international providers of ordinary commercial transit. Usually cheap, unoptimized routes; connection quality to mainland China is broadly poor at evening peak.

### Route Leeching (偷线路)

Certain IDC providers using technical tricks to piggyback on someone else's premium routes (like CN2 GIA, 9929) without formally paying for the expensive bandwidth — and then marketing that as a selling point.

### Small Packets vs Large Packets (大小包)

Some providers, to attract users, specially optimize the routing for "small packets". Small packets may ride fast, low-latency premium routes, so ping tests and traceroutes show gorgeous numbers and users assume the network quality is great. But once the server carries real bulk transfers (sending "large packets"), the provider may switch those onto cheaper, middling ordinary routes.

### Evening Peak (晚高峰)

Roughly 7pm to 11pm daily, when the internet (especially international exits) turns abnormally congested, causing plunging speeds, spiking latency, and heavy packet loss when reaching overseas servers.

### The Broadband Arena (竞技场/宽带竞技场)

Describes users sharing the same egress fighting each other for bandwidth after it's been oversold — colloquially, the broadband arena. Generally happens at evening peak.

### Entry / Exit / Relay (入口/落地/中转)

Terms from proxy and relay networking. The typical multi-hop access path: your device → entry server → (one or more) relay servers → exit server → target website. The entry server is the one domestic users connect to directly; the exit server is the one that finally reaches the target website; relays generally refer to direct-connected servers located abroad. (That's the general reading — in practice the two notions of "entry" and "relay" aren't sharply distinguished, and mixing them is fine.)

### AS, BGP, Transit, Peering

The internet is a giant distributed system built from interconnected independent networks. An AS (Autonomous System) is the basic unit of internet routing; each AS is identified by a unique ASN (Autonomous System Number) and represents an independently managed network (a carrier, cloud provider, corporate network, etc.). BGP (Border Gateway Protocol) is the protocol ASes use to exchange routing information, determining the paths packets take across the global internet. Transit is a paid service where one AS carries another AS's traffic through its own network to reach other ASes. Peering is when two ASes interconnect directly and carry each other's traffic free of charge.

### IX

Internet Exchange — an interconnection node where networks (Tier 1s included) swap traffic. In MJJ usage, it usually means exiting through a domestic IX reached via a specific front server (usually a big cloud provider — Tencent Cloud nationwide, Alibaba Cloud in South China, Baidu Volcano, and other cloud vendors' servers; time-sensitive, and the line can get pulled), achieving a near-dedicated-line experience.

### Ali Immortal (阿里仙人)

Usually refers to a quarterly-paid Aliyun ECS configured with 2C2G, 1 Gbps bandwidth, and 1 TB of traffic, commonly used as an IX front server and relay.

## Everyday Terms

### Gathering Dust (吃灰)

A bought VPS sitting idle, resources going to waste.

### Probes (探针/挂探针)

Server monitoring scripts or programs that display real-time status — CPU, memory, disk usage, network speed, uptime, and so on. Often used to show off server performance to others. Nezha is a common one.

In some contexts it also means the same as "gathering dust" — the server does nothing but run a probe to make its owner happy.

### Upstream / Downstream (上游/下游)

The hierarchy between IDC providers. Upstream suppliers provide resources (physical servers, bandwidth) to other providers; downstream providers buy those resources to resell or serve end users.

### Unplugging the Line (拔线)

Generally refers to a China-located server being disconnected — logically or even physically, cable pulled or power cut — from its datacenter due to takedown notices or facility adjustments (policy, compliance, or business changes). Either way, it's no longer usable; "pulling the line" for short.

### Going Dark (失联)

The VPS becomes unreachable over the network — no ping, no SSH. Possible causes include datacenter network problems, mother-hen failure, a walled IP, or provider maintenance work. Part of daily VPS life; it usually recovers after a while. Note the distinction from "bolting" — going dark is usually due to objective causes.

### Refugees (难民)

Users forced to hunt for a new "home" because their original VPS provider ran into trouble. Common causes: the provider bolts, provider "massacres", policy changes, route meltdowns / IP bans.

### DD / DD Scripts (DD/DD脚本)

From Linux's dd command; in the VPS scene it specifically means reinstalling a standalone OS via dd. Many providers offer limited system templates in their dashboards (no Windows, or only high-version Linux distros), or MJJs worry the templates ship with monitoring/censorship components, so they use DD scripts to install their preferred clean system.

### Sustained Usage (长期占用)

Because VPSes are shared, some providers forbid sustained usage (CPU/IO/network) to prevent contention. This limit usually appears as a percentage in the plan description.

### Port Blocking (端口封禁)

To cut the management cost of their service being used for attacks and to avoid eating complaints, some providers block certain ports (mainly outbound). Commonly blocked: 25, 465, and other outbound SMTP mail ports; 22, 23, and other outbound SSH/SFTP ports. Read the ToS carefully.

### Triple-Limited / Triple-Unlimited (三限/三不限)

"Triple-limited" specifically refers to certain cheap VPS providers that strictly cap CPU usage, disk IO, and network bandwidth in the ToS or in practice. Even with high nominal specs, the moment your sustained usage climbs even a little, you get force-throttled or suspended. "Triple-unlimited" is the opposite: the provider imposes no strict limits on those three (within reasonable use).

### Support Ticket (工单)

A problem report submitted to the VPS provider, used to seek technical support or resolve issues.

### Fair Use Policy (公平使用原则)

Because VPSes are shared, some providers forbid sustained usage (CPU/IO/network) to prevent contention. When this phrase shows up in a ToS: from a big provider it defaults to triple-unlimited, from a small provider it defaults to triple-limited... to put it bluntly, the rule is meaningless boilerplate.

## Provider Abbreviations and Nicknames

### CF / Cyber Living Buddha / Cyber Patron Saint (CF/赛博活佛/赛博代善人)

Usually Cloudflare, the famous cloud services and domain provider, known for offering global CDN, DDoS protection, and more for free. Hearts of gratitude~

### Decelerator CDN / Speed Bump (减速CDN/减速器)

Also refers to CF — sites proxied through the free CF CDN without IP optimization load slowly from China. But then again, what do you want for free?

### Wrapping with CF (套CF)

Means putting a site behind the free CF CDN proxy.

### CC

CloudCone, a classic cheap little-chicken vendor. Stable but oversold (though some folks in the comments argue it beats RN).

### RN

RackNerd, another classic cheap little-chicken vendor. Stably oversold, but personally I find it better than CC.

### CCS

ColoCrossing, formerly a datacenter operator, now sells little chickens directly too. Its reputation for VPSes and dedicated servers is sharply split.

### BWG (瓦工/BWG)

BandwagonHost, famous for its optimized routes.

### AK

Akile, a well-known cheap exit-server provider.

### AC

Acck, downstream of AK (or possibly the same company — can't remember), an obscure cheap exit-server provider.

### DMIT / Auntie (DMIT/大妈)

A US provider focused on high-end optimized routes. On the pricier side, but its route quality and performance stability have a strong reputation in the scene — one of the picks for stability chasers.

### Conscience Cloud (良心云)

Tencent Cloud's old nickname. Doesn't seem all that conscientious anymore.

### Trick Cloud (套路云)

Alibaba Cloud's old nickname. On the 200 Mbps broadband deals, Alibaba Cloud seems to pull fewer tricks than Tencent and handles throttling a bit better.

### Claw Cloud / Claw (爪云/爪子)

CLAW. Everyone says it's a hearse in the making, yet it hasn't bolted (fine, it did retreat from HK).

### Turtle Shell / Turtle (乌龟壳/龟)

Oracle. Famous in the scene for its "free forever" tier (ARM/AMD). But signup vetting is strict (the ABC error), its risk control is inscrutable, and unexplained account bans and instance deletions happen from time to time.

### Getting ABC'd (申请ABC)

Refers to entering your credit card during Oracle signup and getting an error — risk-controlled.

### HZ

Hetzner, the famous German hosting provider, known for butcher-priced dedicated servers and cloud servers. Its "Server Auction" marketplace nets nicely-specced dedicated servers at extremely low prices — many an MJJ's first introduction to a dedicated server.

### HH

HostHatch, a provider known for "storage VPSes" with huge disks, huge memory, and huge traffic. The plans in its annual promotions (Black Friday) have absurd specs, but service stability, provisioning speed, and ticket response times are, well, about what the price suggests.

### Sparta (斯巴达)

SpartanHost, a US provider focused on high performance and DDoS defense. Its Seattle datacenter VPSes offer quality DDoS protection plus decent connectivity to China, with an explosive reputation among site builders and gamers (the owner is a nice guy too).

### Green Cloud (绿云)

GreenCloudVPS, a provider known for big-disk storage VPSes. Disk capacity is extremely generous at relatively cheap prices — good for storage, backups, or downloads. But its network routes and performance are generally middling (its Japan SoftBank offering is quite popular).

### NetCup

A German hosting and domain provider, modestly famous among MJJs for value, stability, and occasional server/domain flash sales. Its dirt-cheap flash-sale .de domains and the classic one-euro server are hot topics on every forum whenever they drop (lol, who wouldn't want a one-euro server?).

### OVH

The famous French hosting provider, known for powerful free DDoS protection. A giant in the DDoS-protected server space; its sub-brands SoYouStart and Kimsufi also offer cheap dedicated servers.

### HostDare

A provider focused on India/US VPSes with fairly good value (the owner is Indian and the operation seems physically in India, so the machines and network routes carry a bit of a curry flavor — many MJJs consider it a hearse...).

### DO/VU/LN

DigitalOcean, Vultr, and Linode respectively — three established, well-regarded cloud server vendors. Stable, standardized products, usage-based billing, but relatively expensive, and generally no special optimization for China-bound networks.

## Domain Terms

### Xiao Yizi (小姨子)

A pinyin pun on the .xyz TLD (x-y-z sounds like xiǎo yí zi, "wife's little sister"). Because the .xyz registry has long run aggressive low-price promotions to grow market share, domains are extremely cheap — the default choice for many an MJJ starting out, testing, or running "monthly disposable" projects. Numeric .xyz domains of 5+ digits go for $0.67/year (on Spaceship, price updated October 2025).

### Corn (玉米)

Same as "domain" — a homophone joke. For example, "buying a corn" or "this corn is a fine specimen".

### ICANN / Registry / Registrar (ICANN/注册局/注册商)

The three-tier domain management system. ICANN, the Internet Corporation for Assigned Names and Numbers, is the top-level global administrator that sets the rules. A registry is the administrator of one TLD, managing all domains under that suffix — Verisign, for instance, is the registry for .com and .net. A registrar is the retail end users deal with directly: a company authorized by ICANN and the registries to sell domains to the public — e.g., Spaceship, NameSilo, Cloudflare, Wanwang.

## Promotions and Community

### Black Friday (黑五/黑色星期五)

The major shopping event held after Thanksgiving, mainly in the US — think 618 or Double 11, except the discounts are usually big. Very big. For cloud providers this is normally when the deepest discounts land, little-chicken prices get very pretty, and many an MJJ comes running.

### PM

Private Message — a DM.

### ToS

Terms of Service.

