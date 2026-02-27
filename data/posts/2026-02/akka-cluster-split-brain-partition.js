window.onPostDataLoaded({
    "title": "Resolving Akka Cluster Split-Brain Scenarios",
    "slug": "akka-cluster-split-brain-partition",
    "language": "Java / Scala",
    "code": "ClusterUnreachable",
    "tags": [
        "Java",
        "Backend",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>In Akka Cluster deployments, partial network partitions can lead to a 'Split-Brain' scenario where multiple sub-clusters believe they are the sole survivors. This causes duplicate Cluster Singletons and Sharded Entities, leading to data corruption and inconsistent state across the distributed system.</p>",
    "root_cause": "The default 'auto-down-unreachable-after' setting is non-deterministic and fails to reach a quorum under unstable network conditions.",
    "bad_code": "akka.cluster {\n  auto-down-unreachable-after = 10s\n  # Dangerous in production!\n}",
    "solution_desc": "Implement a deterministic Split Brain Resolver (SBR). Use the 'keep-majority' or 'static-quorum' strategy to ensure that only the side of the partition with the most nodes remains active, while the other side shuts itself down.",
    "good_code": "akka.cluster.split-brain-resolver {\n  active-strategy = keep-majority\n  stable-after = 20s\n}\nakka.cluster.downing-provider-class = \"akka.cluster.sbr.SplitBrainResolverProvider\"",
    "verification": "Simulate a network partition using 'iptables' and verify via the Akka Management HTTP API that only one partition stays UP.",
    "date": "2026-02-27",
    "id": 1772174521,
    "type": "error"
});