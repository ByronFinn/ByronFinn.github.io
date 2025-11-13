# 分布式系统中的心跳机制：原理、实现与最佳实践


{{< figure src="/pictures/note/distributed-heartbeat-featured.png" alt="分布式系统中的心跳机制" caption="分布式系统中的心跳机制" >}}

# 分布式系统中的心跳机制：原理、实现与最佳实践

## 引言

在分布式系统中，如何知道一个节点或服务是否存活并正常运行。与单体应用程序不同——单体应用中所有组件都在单个进程内运行，分布式系统横跨多台机器、多个网络和多个数据中心。当这些节点在地理上分隔时，这个问题变得更加突出。这正是心跳机制发挥作用的场景。

如果有一个超大分布式系统，有成百上千个微服务运行在几百台分布在不同数据中心的服务器上，如果一台服务器突然挂了，系统能多快检测到这一故障并作出反应？我们如何区分服务器宕机还是网络卡了？这就是心跳机制成为分布式系统核心一部分的重要原因。

## 什么是心跳消息

心跳机制简单来说就是从分布式系统中的一个组件发送给另一个组件的周期性消息，用以表明发送方运行正常。

心跳消息通常很小且轻量，通常只包含时间戳、序列号或标识符。其关键特征是它们以固定的间隔定期发送，形成其他组件可以监控的可预测模式。

该机制通过在双方——发送方和接收方之间建立一个简单的契约来工作。发送方承诺以固定间隔广播其心跳，比如每 2 秒一次。接收方监控这些传入的心跳，并维护一条记录，标明最后一次收到心跳的时间。如果接收方在预期的时间范围内没有收到发送方的消息，就可以合理地判断出问题了。

```python
class HeartbeatSender:
    def __init__(self, interval_seconds):
        self.interval = interval_seconds
        self.sequence_number = 0

    def send_heartbeat(self, target):
        message = {
            'node_id': self.get_node_id(),
            'timestamp': time.time(),
            'sequence': self.sequence_number
        }
        send_to(message, target)
        self.sequence_number += 1

    def run(self):
        while True:
            self.send_heartbeat(target_node)
            time.sleep(self.interval)
```

当节点崩溃、服务停止响应或因网络出现故障时，对应的心跳就会停止。监控系统随后可以采取适当的措施，例如将故障节点从负载均衡池中移除、将流量重定向到健康节点，或触发故障转移程序。

## 心跳系统的核心组件

第一个组件是心跳发送方。这是定期生成和传输心跳信号的节点或服务。在大多数实现中，发送方运行在单独的线程或后台任务中，以避免干扰主应用逻辑。

第二个组件是心跳接收方或监控器。该组件监听传入的心跳并跟踪每个心跳的接收时间。监控器维护其跟踪的所有节点的状态，通常存储每个节点最后一次收到心跳的时间戳。在评估节点健康状态时，监控器会将当前时间与最后一次收到心跳的时间进行比较，以判断节点是否应被视为故障。

```python
class HeartbeatMonitor:
    def __init__(self, timeout_seconds):
        self.timeout = timeout_seconds
        self.last_heartbeats = {}

    def receive_heartbeat(self, message):
        node_id = message['node_id']
        self.last_heartbeats[node_id] = {
            'timestamp': message['timestamp'],
            'sequence': message['sequence'],
            'received_at': time.time()
        }

    def check_node_health(self, node_id):
        if node_id not in self.last_heartbeats:
            return False

        last_heartbeat_time = self.last_heartbeats[node_id]['received_at']
        time_since_heartbeat = time.time() - last_heartbeat_time

        return time_since_heartbeat < self.timeout

    def get_failed_nodes(self):
        failed_nodes = []
        current_time = time.time()

        for node_id, data in self.last_heartbeats.items():
            if current_time - data['received_at'] > self.timeout:
                failed_nodes.append(node_id)

        return failed_nodes
```

第三个参数是心跳间隔，它决定了心跳发送的频率。这个间隔代表了分布式系统中的一个基本权衡。心跳发送过于频繁，会浪费网络带宽和 CPU。发送得不够频繁，故障检测就会变慢。大多数系统根据应用需求和网络特性，使用 1 到 10 秒不等的间隔。

第四个参数是超时或故障阈值。这定义了监控器在未收到心跳时等待多长时间才会宣布节点故障。

请注意，超时的选择必须谨慎，以平衡两个相互竞争的问题：快速故障检测与对暂时性网络延迟或处理暂停的容忍。一个典型的经验法则是**将超时设置为心跳间隔的至少 2 到 3 倍**，允许错过一些心跳后才宣布故障。

## 决定心跳间隔和超时

当系统使用非常短的间隔（比如每 500 毫秒发送一次心跳）时，可以快速检测故障。然而，这是有代价的。每个心跳都会消耗网络带宽，在拥有数百或数千个节点的大型集群中，累积的流量会变得相当可观。此外，非常短的间隔使系统对短暂的网络拥塞或垃圾回收暂停等瞬态问题更加敏感。

考虑一个拥有 1000 个节点的系统，每个节点每 500 毫秒向中央监控器发送一次心跳。这会导致每秒仅健康监控就产生 2000 条心跳消息。在繁忙的生产环境中，这种开销可能会干扰实际的应用流量。

相反，如果心跳间隔过长，比如 30 秒，系统就会变得迟缓，无法及时检测故障。一个节点可能已经崩溃，但系统要过 30 秒或更久才会注意到。在这个时间窗口内，请求可能继续被路由到故障节点，导致面向用户的错误。

同样，超时值也必须考虑网络特性。在横跨多个数据中心的分布式系统中，网络延迟各不相同。从位于加州的节点发送到位于弗吉尼亚的监控器的心跳，在正常条件下可能需要 80 毫秒，但在拥塞期间可能飙升到 200 毫秒。

因此，如果超时设置得过于激进，这些瞬态延迟就会触发误报。

一种实用的方法是测量网络的实际往返时间，并将其作为基准。许多系统遵循的规则是，**超时至少应为往返时间的 10 倍**。例如，如果平均往返时间是 10 毫秒，超时至少应为 100 毫秒，以应对变化。

```python
def calculate_timeout(round_trip_time_ms, heartbeat_interval_ms):
    # 超时是RTT的10倍
    rtt_based_timeout = round_trip_time_ms * 10

    # 超时也至少应为心跳间隔的2-3倍
    interval_based_timeout = heartbeat_interval_ms * 3

    # 取两者中较大的值
    return max(rtt_based_timeout, interval_based_timeout)
```

另一个重要的考虑因素是，在宣布故障前需要多个连续心跳丢失的概念。系统不会在错过一次心跳后就将节点标记为死亡，而是会等待连续多次心跳丢失。这种方法减少了因丢包或短暂延迟导致的误报。

例如，如果我们每 2 秒发送一次心跳，并且要求在宣布故障前丢失 3 次心跳，那么节点至少需要无响应 6 秒才会被标记为故障。这在快速故障检测和对瞬态问题的容忍之间提供了良好的平衡。

## pull vs push 心跳模型

心跳机制可以使用两种不同的通信模型来实现：推和拉。

在推模型中，被监控的节点主动向监控系统以固定间隔发送心跳消息。节点负责广播自己的健康状态。被监控的服务只需运行一个后台线程，定期发送心跳消息即可。

```python
class PushHeartbeat:
    def __init__(self, monitor_address, interval):
        self.monitor_address = monitor_address
        self.interval = interval
        self.running = False

    def start(self):
        self.running = True
        self.heartbeat_thread = threading.Thread(target=self._send_loop)
        self.heartbeat_thread.daemon = True
        self.heartbeat_thread.start()

    def _send_loop(self):
        while self.running:
            try:
                self._send_heartbeat()
            except Exception as e:
                logging.error(f"发送心跳失败: {e}")
            time.sleep(self.interval)

    def _send_heartbeat(self):
        message = {
            'node_id': self.get_node_id(),
            'timestamp': time.time(),
            'status': 'alive'
        }
        requests.post(self.monitor_address, json=message)
```

push 模型在许多场景下工作得很好，但它有局限性。如果节点本身变得完全无响应或崩溃，它显然无法发送心跳。此外，在有严格防火墙规则的网络中，被监控的节点可能无法主动向监控系统发起出站连接。

- Kubernetes 节点心跳
- Hadoop YARN NodeManagers 向 ResourceManager 推送心跳
- Celery 和 Airflow 工作节点向调度器推送心跳

在 pull 模型中，监控系统定期主动查询节点以检查其健康状态。监控器不再等待心跳到达，而是主动询问“你还活着吗？”被监控的服务暴露一个健康端点来响应这些查询。

```python
class PullHeartbeat:
    def __init__(self, nodes, interval):
        self.nodes = nodes  # 要监控的节点列表
        self.interval = interval
        self.health_status = {}

    def start(self):
        self.running = True
        self.poll_thread = threading.Thread(target=self._poll_loop)
        self.poll_thread.daemon = True
        self.poll_thread.start()

    def _poll_loop(self):
        while self.running:
            for node in self.nodes:
                self._check_node(node)
            time.sleep(self.interval)

    def _check_node(self, node):
        try:
            response = requests.get(f"http://{node}/health", timeout=2)
            if response.status_code == 200:
                self.health_status[node] = {
                    'alive': True,
                    'last_check': time.time()
                }
            else:
                self.mark_node_unhealthy(node)
        except Exception as e:
            self.mark_node_unhealthy(node)
```

pull 模型为监控系统提供了更多控制权，在某些场景下更加可靠。由于监控器发起连接，它在具有不对称网络配置的环境中工作得更好。然而，它也为监控器带来了额外负载，尤其是在大型集群中需要定期轮询数百或数千个节点时。

- 负载均衡器主动探测后端服务器
- Prometheus 拉取每个目标的指标端点
- Redis Sentinel 使用 PING 监控和轮询 Redis 实例

正常来说，大型系统都会使用混合方法，结合两种 push 和 pull。例如，节点可能主动发送心跳（push），但监控系统也定期轮询关键节点（pull）作为备份机制。这种冗余提高了整体可靠性。

## 故障检测算法

虽然基本的心跳机制很有效，但它们在区分实际故障和暂时性减速方面存在挑战。这正是更复杂的故障检测算法发挥作用的地方。

最简单的故障检测算法使用固定超时。如果在指定的超时期间内没有收到心跳，节点就被宣布为故障。虽然易于实现，但这种二元方法不够灵活，在延迟可变的网络中容易出现误报。

```python
class FixedTimeoutDetector:
    def __init__(self, timeout):
        self.timeout = timeout
        self.last_heartbeats = {}

    def is_node_alive(self, node_id):
        if node_id not in self.last_heartbeats:
            return False

        elapsed = time.time() - self.last_heartbeats[node_id]
        return elapsed < self.timeout
```

### Phi 增量故障检测

一种更复杂的方法是 phi 增量故障检测器，最初是为 Cassandra 数据库开发的。phi 增量检测器不是提供二元输出（存活或死亡），而是在连续尺度上计算怀疑级别。怀疑值越高，节点故障的可能性就越大。

phi 值使用对历史心跳到达时间的统计分析来计算。该算法维护一个最近到达间隔时间的滑动窗口，并利用这些数据来估计下一次心跳应该到达的时间的概率分布。如果心跳延迟到达，phi 值会逐渐增加，而不是立即跳转到故障状态。

phi 值代表节点故障的置信水平。例如，phi 值为 1 对应约 90%的置信度，phi 为 2 对应 99%置信度，phi 为 3 对应 99.9%置信度。

## 用于心跳的 Gossip 协议

随着分布式系统规模的扩大，集中式心跳监控成为瓶颈。负责跟踪数千台服务器的单个监控节点会造成单点故障，且扩展性不佳。这正是 Gossip 协议发挥作用的地方。

Gossip 协议将故障检测的责任分布到集群的所有节点上。所有节点不再向中央权威报告，而是定期与随机选择的节点子集交换心跳信息。随着时间的推移，关于每个节点健康状态的信息在整个集群中传播，就像社交网络中的八卦一样。

基本的 Gossip 算法：每个节点维护一个本地成员列表，包含集群中所有已知节点的信息，包括它们的心跳计数器。定期地，节点选择一个或多个随机节点，并与它们交换整个成员列表。当从节点接收到成员列表时，节点将其与自己的列表合并，保留每个节点最新的信息。

```python
class GossipNode:
    def __init__(self, node_id, peers):
        self.node_id = node_id
        self.peers = peers
        self.membership_list = {}
        self.heartbeat_counter = 0

    def update_heartbeat(self):
        self.heartbeat_counter += 1
        self.membership_list[self.node_id] = {
            'heartbeat': self.heartbeat_counter,
            'timestamp': time.time()
        }

    def gossip_round(self):
        # 更新自己的心跳
        self.update_heartbeat()

        # 选择随机节点进行Gossip
        num_peers = min(3, len(self.peers))
        selected_peers = random.sample(self.peers, num_peers)

        # 向选定的节点发送成员列表
        for peer in selected_peers:
            self._send_gossip(peer)

    def _send_gossip(self, peer):
        try:
            response = requests.post(
                f"http://{peer}/gossip",
                json=self.membership_list
            )
            received_list = response.json()
            self._merge_membership_list(received_list)
        except Exception as e:
            logging.error(f"与{peer} Gossip失败: {e}")

    def _merge_membership_list(self, received_list):
        for node_id, info in received_list.items():
            if node_id not in self.membership_list:
                self.membership_list[node_id] = info
            else:
                # 保留心跳计数器更大的条目
                if info['heartbeat'] > self.membership_list[node_id]['heartbeat']:
                    self.membership_list[node_id] = info

    def detect_failures(self, timeout_seconds):
        failed_nodes = []
        current_time = time.time()

        for node_id, info in self.membership_list.items():
            if node_id != self.node_id:
                time_since_update = current_time - info['timestamp']
                if time_since_update > timeout_seconds:
                    failed_nodes.append(node_id)

        return failed_nodes
```

Gossip 协议消除了单点故障，因为每个节点都参与故障检测。它扩展性良好，因为每个节点发送的消息数量不会随着集群大小而变化。它也对节点故障具有弹性，因为只要部分节点保持连接，信息就会继续传播。

然而，Gossip 协议也引入了复杂性。由于信息逐渐传播，所有节点得知故障可能存在延迟。这种最终一致性模型意味着不同节点可能暂时对集群状态有不同的视图。该协议还会产生更多的总网络流量，因为信息在许多 Gossip 交换中被复制，尽管这通常可以接受，因为 Gossip 消息很小。

许多生产系统使用基于 Gossip 的故障检测。例如，Cassandra 使用 Gossip 协议，每个节点每秒与最多三个其他节点进行 Gossip。节点同时跟踪心跳生成号（每当节点重启时递增）和心跳版本号（每次 Gossip 轮次递增）。该协议还包括处理网络分区和防止脑裂场景的机制。

## 协议： TCP/UDP

一个重要的实现考虑因素是传输协议。

心跳应该使用 TCP 还是 UDP？TCP 提供可靠交付并保证消息按顺序到达，但也引入开销，并且由于连接建立和确认机制而可能更慢。

UDP 更快更轻量，但数据包可能丢失或乱序到达。许多系统对心跳消息使用 UDP，因为偶尔的丢包是可以接受的——接收方可以在不宣布节点死亡的情况下容忍丢失几次心跳。

然而，当心跳消息携带关键状态信息且不能丢失时，通常更倾向于使用 TCP。
如在 etcd 的 Raft consensus protocol 中，leader 发送的 heartbeat（实际上是 AppendEntries RPC）不仅包含"我还活着"的信号，还携带了，当前 term(用于维护集群 leader 的一致性)，日志索引(确保 followers 的日志与 leader 同步)，提交索引(告知 followers 哪些日志条目已安全提交)

另一个考虑因素是网络拓扑。在跨越多个数据中心的系统中，不同路径之间的网络延迟和可靠性差异显著。同一数据中心内两个节点之间的心跳可能具有 1 毫秒的往返时间，而跨越大洲的心跳可能需要 100 毫秒或更长。系统应考虑这些差异，可能为本地节点与远程节点使用不同的超时值。

```python
class AdaptiveHeartbeatConfig:
    def __init__(self):
        self.configs = {}

    def configure_for_node(self, node_id, location):
        if location == 'local':
            config = {
                'interval': 1000,  # 1秒
                'timeout': 3000,   # 3秒
                'protocol': 'UDP'
            }
        elif location == 'same_datacenter':
            config = {
                'interval': 2000,  # 2秒
                'timeout': 6000,   # 6秒
                'protocol': 'UDP'
            }
        else:  # remote_datacenter
            config = {
                'interval': 5000,  # 5秒
                'timeout': 15000,  # 15秒
                'protocol': 'TCP'
            }

        self.configs[node_id] = config
        return config
```

另一个重要的实现考虑因素是确保心跳处理路径中没有阻塞操作。心跳处理器应该快速执行，并将任何昂贵的操作推迟到单独的工作线程。

资源管理也至关重要。在拥有数千个节点的系统中，为每个节点维护单独的线程或定时器可能会耗尽系统资源。我们应该优先考虑事件驱动架构或线程池，以高效管理并发心跳处理。连接池也会减少为每条心跳消息建立新连接的开销。

## 网络分区与脑裂

网络分区发生在网络连接中断时，将集群分割成两个或更多孤立组。每个分区内的节点可以相互通信，但无法到达其他分区中的节点。

在分区期间，两侧的节点都会停止从另一侧接收心跳。这造成了双方可能都认为对方已失败的模糊情况。如果不妥善处理，这可能导致脑裂场景，即两侧继续独立运行，可能导致数据不一致或资源冲突。

考虑一个横跨两个数据中心的三个节点的数据库集群。如果数据中心之间的网络连接失败，每个数据中心的节点将形成独立的分区。如果没有适当的保护措施，两个分区都可能选举自己的领导者、接受写入并彼此分叉。

为了正确处理网络分区，系统通常使用基于仲裁的方法。仲裁是采取某些行动前必须同意的最小节点数。例如，五个节点的集群可能要求三个节点的仲裁才能选举领导者或接受写入。

在分区期间，只有包含至少三个节点的分区才能继续正常运行。少数分区认识到它已失去仲裁，并停止接受写入。

```python
class QuorumBasedFailureHandler:
    def __init__(self, total_nodes, quorum_size):
        self.total_nodes = total_nodes
        self.quorum_size = quorum_size
        self.reachable_nodes = set()

    def update_reachable_nodes(self, node_list):
        self.reachable_nodes = set(node_list)

    def has_quorum(self):
        return len(self.reachable_nodes) >= self.quorum_size

    def can_accept_writes(self):
        return self.has_quorum()

    def should_step_down_as_leader(self):
        return not self.has_quorum()
```

## 实际应用

Kubernetes 集群中的每个节点都运行一个 kubelet 代理，定期向 API 服务器发送节点状态更新。默认情况下，kubelets 每 10 秒发送一次更新。如果 API 服务器在 40 秒内未收到更新，它会将节点标记为 NotReady。

Kubernetes 还在 Pod 级别实现了存活探针和就绪探针。存活探针检查容器是否正常运行，如果探针反复失败，Kubernetes 会重启容器。就绪探针决定容器是否准备好接受流量，就绪探针失败会导致 Pod 从服务端点中移除。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: example-pod
spec:
  containers:
    - name: app
      image: myapp:latest
      livenessProbe:
        httpGet:
          path: /healthz
          port: 8080
        initialDelaySeconds: 15
        periodSeconds: 10
        timeoutSeconds: 2
        failureThreshold: 3
      readinessProbe:
        httpGet:
          path: /ready
          port: 8080
        initialDelaySeconds: 5
        periodSeconds: 5
        timeoutSeconds: 2
```

Cassandra 是一个分布式 NoSQL 数据库，使用基于 Gossip 的心跳来维护集群成员关系。每个 Cassandra 节点每秒与最多三个其他随机节点进行 Gossip。Gossip 消息包括心跳生成号（每当节点重启时递增）和心跳版本号（每次 Gossip 轮次递增）。

Cassandra 使用 phi 增量故障检测器来判断节点是否宕机。默认 phi 阈值为 8，意味着当算法约 99.9999%确信节点已失败时，该节点才被视为宕机。这种自适应方法使 Cassandra 能够在各种网络环境中可靠工作。

etcd 是 Kubernetes 使用的分布式键值存储，在其 Raft 共识协议中实现了心跳。Raft 领导者默认每 100 毫秒向跟随者发送心跳消息。如果跟随者在选举超时（通常为 1000 毫秒）内未收到心跳，它会发起新的领导者选举。

## 结论

心跳对分布式系统至关重要。从简单的周期性消息到复杂的自适应算法，心跳使系统能够维护对组件健康状态的认知并快速响应故障。

有效心跳设计的关键在于平衡相互竞争的考虑。快速故障检测需要频繁的心跳和激进的超时，但这会增加网络开销和对瞬态问题的敏感性。慢速检测减少了资源消耗和误报，但使系统面临更长时间的中断。

当我们设计分布式系统时，应尽早考虑心跳机制。心跳间隔、超时值和故障检测算法的选择会显著影响系统在故障条件下的行为。

无论我们正在构建什么，心跳始终是维护可靠性的基本工具。

