# Heartbeats in Distributed Systems: Principles and Practice


{{< figure src="/pictures/note/distributed-heartbeat-featured.png" alt="Heartbeat mechanism in distributed systems" caption="Heartbeat mechanism in distributed systems" >}}

# Heartbeat Mechanisms in Distributed Systems: Principles, Implementation, and Best Practices

## Introduction

In a distributed system, how do you know whether a node or service is alive and running as it should? Unlike a monolithic application, where all components run inside a single process, a distributed system spans many machines, multiple networks, and several data centers. The question becomes even more pressing when the nodes are geographically separated. That is exactly where heartbeat mechanisms come in.

Picture a massive distributed system with hundreds or thousands of microservices running on hundreds of servers spread across different data centers. If one server suddenly dies, how quickly can the system detect the failure and react? How do we tell a crashed server from a stalled network? That is a big part of why the heartbeat mechanism is a core piece of distributed systems.

## What Is a Heartbeat Message

Simply put, a heartbeat is a periodic message sent from one component in a distributed system to another to signal that the sender is running fine.

Heartbeat messages are typically small and lightweight, often carrying nothing more than a timestamp, a sequence number, or an identifier. Their defining trait is that they are sent at regular, fixed intervals, creating a predictable pattern that other components can monitor.

The mechanism works through a simple contract between the two sides — sender and receiver. The sender promises to broadcast its heartbeat at a fixed interval, say every 2 seconds. The receiver watches for incoming heartbeats and keeps a record of when the last one arrived. If nothing arrives within the expected window, the receiver can reasonably conclude that something is wrong.

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

When a node crashes, a service stops responding, or the network fails, the corresponding heartbeats stop. The monitoring system can then take appropriate action: remove the failed node from the load balancing pool, redirect traffic to healthy nodes, or trigger a failover procedure.

## Core Components of a Heartbeat System

The first component is the heartbeat sender — the node or service that generates and transmits heartbeat signals on a schedule. In most implementations the sender runs in its own thread or background task so it does not interfere with the main application logic.

The second component is the heartbeat receiver, or monitor. It listens for incoming heartbeats and tracks when each one arrives. The monitor maintains state for every node it watches, typically storing the timestamp of the last heartbeat received from each. To assess a node's health, it compares the current time against that last-heartbeat time to decide whether the node should be considered failed.

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

The third parameter is the heartbeat interval, which determines how often heartbeats are sent. This interval embodies a fundamental trade-off in distributed systems. Send heartbeats too often and you waste network bandwidth and CPU; send them too rarely and failure detection slows down. Most systems use intervals ranging from 1 to 10 seconds, tuned to application needs and network characteristics.

The fourth parameter is the timeout, or failure threshold. It defines how long the monitor waits without receiving a heartbeat before declaring a node failed.

Note that the timeout must be chosen carefully to balance two competing concerns: fast failure detection versus tolerance of transient network delays or processing pauses. A common rule of thumb is to **set the timeout to at least 2 to 3 times the heartbeat interval**, allowing a few missed heartbeats before declaring failure.

## Choosing the Heartbeat Interval and Timeout

With a very short interval — say a heartbeat every 500 milliseconds — failures are detected quickly. But this comes at a cost. Every heartbeat consumes network bandwidth, and in large clusters of hundreds or thousands of nodes the accumulated traffic becomes substantial. Very short intervals also make the system more sensitive to transient issues such as brief network congestion or garbage collection pauses.

Consider a system with 1,000 nodes, each sending a heartbeat to a central monitor every 500 milliseconds. That works out to 2,000 heartbeat messages per second just for health monitoring. In a busy production environment, that overhead can interfere with real application traffic.

At the other extreme, an interval that is too long — say 30 seconds — makes the system sluggish at detecting failures. A node may have already crashed, yet the system will not notice for 30 seconds or more. During that window, requests may keep being routed to the failed node, producing user-facing errors.

Similarly, the timeout must account for network characteristics. In distributed systems spanning multiple data centers, network latency varies. A heartbeat from a node in California to a monitor in Virginia might take 80 milliseconds under normal conditions but spike to 200 milliseconds during congestion.

So if the timeout is set too aggressively, these transient delays will trigger false positives.

A practical approach is to measure the network's actual round-trip time and use it as a baseline. The rule many systems follow is that **the timeout should be at least 10 times the round-trip time**. For example, if the average round-trip time is 10 milliseconds, the timeout should be at least 100 milliseconds to absorb variation.

```python
def calculate_timeout(round_trip_time_ms, heartbeat_interval_ms):
    # Timeout is 10x the RTT
    rtt_based_timeout = round_trip_time_ms * 10

    # Timeout should also be at least 2-3x the heartbeat interval
    interval_based_timeout = heartbeat_interval_ms * 3

    # Take the larger of the two
    return max(rtt_based_timeout, interval_based_timeout)
```

Another important consideration is the notion of requiring multiple consecutive missed heartbeats before declaring failure. Instead of marking a node dead after a single missed heartbeat, the system waits for several consecutive misses. This reduces false positives caused by packet loss or brief delays.

For example, if we send heartbeats every 2 seconds and require 3 missed heartbeats before declaring failure, a node must be unresponsive for at least 6 seconds before being marked as failed. This strikes a good balance between fast failure detection and tolerance of transient issues.

## Pull vs Push Heartbeat Models

Heartbeat mechanisms can be built on two different communication models: push and pull.

In the push model, the monitored node proactively sends heartbeat messages to the monitoring system at fixed intervals. The node is responsible for broadcasting its own health. The monitored service simply runs a background thread that periodically sends heartbeats.

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

The push model works well in many scenarios, but it has limits. If the node itself becomes completely unresponsive or crashes, it obviously cannot send heartbeats. Moreover, in networks with strict firewall rules, monitored nodes may not be able to initiate outbound connections to the monitoring system.

- Kubernetes node heartbeats
- Hadoop YARN NodeManagers pushing heartbeats to the ResourceManager
- Celery and Airflow workers pushing heartbeats to the scheduler

In the pull model, the monitoring system actively queries nodes on a schedule to check their health. Instead of waiting for heartbeats to arrive, the monitor goes asking, "Are you alive?" The monitored service exposes a health endpoint that answers these queries.

```python
class PullHeartbeat:
    def __init__(self, nodes, interval):
        self.nodes = nodes  # list of nodes to monitor
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

The pull model gives the monitoring system more control and is more reliable in certain scenarios. Because the monitor initiates the connections, it works better in environments with asymmetric network configurations. However, it also places extra load on the monitor, especially in large clusters where hundreds or thousands of nodes must be polled regularly.

- Load balancers actively probing backend servers
- Prometheus scraping each target's metrics endpoint
- Redis Sentinel monitoring and polling Redis instances with PING

Typically, large systems use a hybrid approach that combines push and pull. For instance, nodes may proactively send heartbeats (push), while the monitoring system also polls critical nodes periodically (pull) as a backup mechanism. This redundancy improves overall reliability.

## Failure Detection Algorithms

Basic heartbeat mechanisms work well, but they struggle to distinguish actual failures from temporary slowdowns. That is where more sophisticated failure detection algorithms come in.

The simplest failure detection algorithm uses a fixed timeout. If no heartbeat arrives within the specified timeout period, the node is declared failed. Easy to implement, but this binary approach is inflexible and prone to false positives in networks with variable latency.

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

### Phi Accrual Failure Detection

A more sophisticated approach is the phi accrual failure detector, originally developed for the Cassandra database. Rather than producing a binary output (alive or dead), the phi accrual detector computes a level of suspicion on a continuous scale. The higher the suspicion value, the more likely the node has failed.

The phi value is computed from statistical analysis of historical heartbeat arrival times. The algorithm maintains a sliding window of recent inter-arrival times and uses that data to estimate a probability distribution for when the next heartbeat should arrive. If a heartbeat is late, the phi value increases gradually rather than jumping straight to a failed state.

The phi value represents a confidence level that the node has failed. For example, phi = 1 corresponds to roughly 90% confidence, phi = 2 to 99%, and phi = 3 to 99.9%.

## Gossip Protocols for Heartbeats

As distributed systems scale up, centralized heartbeat monitoring becomes a bottleneck. A single monitor responsible for tracking thousands of servers is both a single point of failure and a poor scaling story. This is where Gossip protocols come in.

Gossip protocols distribute the responsibility for failure detection across all nodes in the cluster. Instead of every node reporting to a central authority, nodes periodically exchange heartbeat information with a randomly chosen subset of peers. Over time, knowledge of each node's health spreads throughout the cluster, much like gossip in a social network.

The basic Gossip algorithm: each node maintains a local membership list containing information about every known node in the cluster, including their heartbeat counters. Periodically, a node picks one or more random nodes and exchanges its entire membership list with them. When a membership list arrives from another node, the node merges it with its own, keeping the most recent information for each node.

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
        # Update our own heartbeat
        self.update_heartbeat()

        # Pick random nodes to gossip with
        num_peers = min(3, len(self.peers))
        selected_peers = random.sample(self.peers, num_peers)

        # Send the membership list to the selected nodes
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
                # Keep the entry with the larger heartbeat counter
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

Gossip eliminates the single point of failure because every node takes part in failure detection. It scales well because the number of messages each node sends does not grow with cluster size. It is also resilient to node failures: as long as some nodes remain connected, information keeps propagating.

However, Gossip also introduces complexity. Because information spreads gradually, there can be a delay before every node learns of a failure. This eventually consistent model means different nodes may temporarily hold different views of the cluster state. The protocol also generates more total network traffic, since information is duplicated across many Gossip exchanges — though this is usually acceptable because Gossip messages are small.

Many production systems use Gossip-based failure detection. Cassandra, for example, runs a Gossip protocol in which each node gossips with up to three other nodes per second. Nodes track both a heartbeat generation number (incremented on every node restart) and a heartbeat version number (incremented on every Gossip round). The protocol also includes mechanisms for handling network partitions and preventing split-brain scenarios.

## Protocol: TCP/UDP

One important implementation consideration is the transport protocol.

Should heartbeats use TCP or UDP? TCP provides reliable delivery and guarantees messages arrive in order, but it introduces overhead and can be slower due to connection setup and acknowledgment mechanics.

UDP is faster and lighter, but packets can be lost or arrive out of order. Many systems use UDP for heartbeat messages because occasional loss is acceptable — the receiver can tolerate a few missed heartbeats without declaring a node dead.

When heartbeat messages carry critical state information that cannot be lost, however, TCP is generally preferred.
In etcd's Raft consensus protocol, for instance, the heartbeat sent by the leader (actually an AppendEntries RPC) contains not just an "I am alive" signal but also carries the current term (used to keep the cluster's leader consistent), log indexes (ensuring followers' logs stay in sync with the leader's), and the commit index (telling followers which log entries are safely committed).

Another consideration is network topology. In systems spanning multiple data centers, network latency and reliability differ significantly across paths. A heartbeat between two nodes in the same data center might have a 1-millisecond round-trip time, while one crossing continents could take 100 milliseconds or longer. Systems should account for these differences, potentially using different timeout values for local and remote nodes.

```python
class AdaptiveHeartbeatConfig:
    def __init__(self):
        self.configs = {}

    def configure_for_node(self, node_id, location):
        if location == 'local':
            config = {
                'interval': 1000,  # 1 second
                'timeout': 3000,   # 3 seconds
                'protocol': 'UDP'
            }
        elif location == 'same_datacenter':
            config = {
                'interval': 2000,  # 2 seconds
                'timeout': 6000,   # 6 seconds
                'protocol': 'UDP'
            }
        else:  # remote_datacenter
            config = {
                'interval': 5000,  # 5 seconds
                'timeout': 15000,  # 15 seconds
                'protocol': 'TCP'
            }

        self.configs[node_id] = config
        return config
```

Another important implementation consideration is keeping blocking operations out of the heartbeat handling path. Heartbeat handlers should execute quickly and defer any expensive work to separate worker threads.

Resource management matters too. In systems with thousands of nodes, maintaining a dedicated thread or timer per node can exhaust system resources. We should favor event-driven architectures or thread pools to manage concurrent heartbeat processing efficiently. Connection pooling also cuts the overhead of establishing a new connection for every heartbeat message.

## Network Partitions and Split-Brain

A network partition occurs when network connectivity breaks, splitting the cluster into two or more isolated groups. Nodes within each partition can talk to each other but cannot reach nodes in the other partitions.

During a partition, nodes on both sides stop receiving heartbeats from the other side. This creates an ambiguous situation where each side may believe the other has failed. Handled poorly, it can lead to a split-brain scenario in which both sides keep operating independently, potentially causing data inconsistency or resource conflicts.

Consider a three-node database cluster spread across two data centers. If the network link between the data centers fails, the nodes in each data center form their own partition. Without proper safeguards, both partitions could elect their own leader, accept writes, and fork apart.

To handle network partitions correctly, systems typically use a quorum-based approach. A quorum is the minimum number of nodes that must agree before certain actions are taken. For example, a five-node cluster might require a quorum of three nodes to elect a leader or accept writes.

During a partition, only the side containing at least three nodes can keep operating normally. The minority side recognizes it has lost quorum and stops accepting writes.

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

## Real-World Applications

Every node in a Kubernetes cluster runs a kubelet agent that periodically sends node status updates to the API server. By default, kubelets send updates every 10 seconds. If the API server receives no update within 40 seconds, it marks the node as NotReady.

Kubernetes also implements liveness and readiness probes at the Pod level. Liveness probes check whether a container is running properly; if the probe keeps failing, Kubernetes restarts the container. Readiness probes determine whether a container is ready to receive traffic, and a failed readiness probe removes the Pod from the service's endpoints.

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

Cassandra, a distributed NoSQL database, uses Gossip-based heartbeats to maintain cluster membership. Each Cassandra node gossips with up to three other random nodes per second. Gossip messages include a heartbeat generation number (incremented whenever the node restarts) and a heartbeat version number (incremented on each Gossip round).

Cassandra uses a phi accrual failure detector to decide whether a node is down. The default phi threshold is 8, meaning a node is considered down only when the algorithm is about 99.9999% confident it has failed. This adaptive approach lets Cassandra work reliably across a wide range of network environments.

etcd, the distributed key-value store used by Kubernetes, implements heartbeats in its Raft consensus protocol. By default, the Raft leader sends heartbeat messages to followers every 100 milliseconds. If a follower receives no heartbeat within the election timeout (typically 1,000 milliseconds), it initiates a new leader election.

## Conclusion

Heartbeats are essential to distributed systems. From simple periodic messages to sophisticated adaptive algorithms, heartbeats let systems maintain awareness of component health and respond quickly to failures.

The key to effective heartbeat design is balancing competing concerns. Fast failure detection calls for frequent heartbeats and aggressive timeouts, but that increases network overhead and sensitivity to transient issues. Slower detection reduces resource consumption and false positives but leaves the system exposed to longer outages.

When we design distributed systems, we should think about the heartbeat mechanism early. The choices of heartbeat interval, timeout values, and failure detection algorithm significantly shape how the system behaves under failure conditions.

Whatever we are building, the heartbeat remains a fundamental tool for maintaining reliability.

