window.onPostDataLoaded({
    "title": "Resolving Akka Cluster Split-Brain Scenarios",
    "slug": "akka-cluster-split-brain-fix",
    "language": "Java / Scala",
    "code": "Cluster-Partitioning",
    "tags": [
        "Java",
        "Backend",
        "Akka",
        "Distributed Systems",
        "Error Fix"
    ],
    "analysis": "<p>In cross-region Akka deployments, transient network partitions can split a single cluster into two or more independent islands. This is the 'Split-Brain' scenario. If both sides believe they are the authoritative cluster, they will both start singleton actors, manage shards independently, and cause massive data corruption in persistent stores as they compete for the same entity IDs.</p>",
    "root_cause": "Relying on default 'auto-downing' which downs unreachable nodes without consensus, or failing to configure a Split Brain Resolver (SBR) that accounts for regional quorum requirements.",
    "bad_code": "akka.cluster {\n  # DANGEROUS: Automatically downs nodes after 10s\n  auto-down-unreachable-after = 10s\n  allow-weakly-up-members = on\n}",
    "solution_desc": "Enable the Akka Split Brain Resolver with a 'keep-majority' or 'static-quorum' strategy. In cross-region setups, 'keep-majority' is preferred as it ensures that only the partition with more than half the nodes survives, while the smaller partition shuts itself down.",
    "good_code": "akka.cluster.split-brain-resolver {\n  active-strategy = keep-majority\n  stable-after = 20s\n  keep-majority {\n    role = \"backend-node\"\n  }\n}",
    "verification": "Simulate a network partition using 'tc qdisc' (packet loss) between regions and verify via logs that the minority partition performs a CoordinatedShutdown.",
    "date": "2026-05-19",
    "id": 1779191763,
    "type": "error"
});