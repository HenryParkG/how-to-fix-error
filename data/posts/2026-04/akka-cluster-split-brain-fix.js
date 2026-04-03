window.onPostDataLoaded({
    "title": "Resolving Akka Cluster Split-Brain Scenarios",
    "slug": "akka-cluster-split-brain-fix",
    "language": "Java",
    "code": "ClusterPartitionException",
    "tags": [
        "Java",
        "Backend",
        "Distributed Systems",
        "Error Fix"
    ],
    "analysis": "<p>In multi-region Akka deployments, transient network latency between regions can trigger a 'Split-Brain' scenario. The cluster failure detector incorrectly marks nodes in the remote region as unreachable. If both sides of the partition decide to remain active (quorum failure), the system enters an inconsistent state where two leaders are elected, leading to data corruption in persistent actors (Event Sourcing).</p>",
    "root_cause": "The default 'Keep Majority' strategy fails when network partitioning results in equal-sized clusters or when heartbeat timeouts are too aggressive for cross-region latency.",
    "bad_code": "akka.cluster {\n  downing-provider-class = \"akka.cluster.sbr.SplitBrainResolverProvider\"\n  split-brain-resolver {\n    active-strategy = keep-majority\n  }\n  # Too aggressive for multi-region\n  failure-detector.threshold = 8.0\n}",
    "good_code": "akka.cluster {\n  downing-provider-class = \"akka.cluster.sbr.SplitBrainResolverProvider\"\n  split-brain-resolver {\n    active-strategy = \"static-quorum\"\n    static-quorum {\n      quorum-size = 3 # Fixed size for odd-numbered core clusters\n      role = \"core-node\"\n    }\n    stable-after = 15s # Increase stability window for WAN\n  }\n  failure-detector.threshold = 12.0\n}",
    "solution_desc": "Switch to a 'static-quorum' strategy for regional stability and increase the 'stable-after' duration to ensure the partition isn't just a temporary network spike.",
    "verification": "Simulate a network partition using 'iptables' to drop traffic between regions; verify that the minority partition downs itself correctly.",
    "date": "2026-04-03",
    "id": 1775209532,
    "type": "error"
});