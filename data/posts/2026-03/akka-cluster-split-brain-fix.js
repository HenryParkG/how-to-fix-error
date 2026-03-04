window.onPostDataLoaded({
    "title": "Resolving Akka Cluster Split-Brain Scenarios",
    "slug": "akka-cluster-split-brain-fix",
    "language": "Java",
    "code": "Split-Brain",
    "tags": [
        "Java",
        "Kubernetes",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In distributed Akka systems, network partitions can lead to a 'Split-Brain' where two halves of a cluster both believe they are the remaining healthy nodes. This results in duplicate singletons, inconsistent sharding, and data corruption. Relying on the deprecated 'auto-down' feature is dangerous as it doesn't guarantee a consensus on which side should terminate.</p>",
    "root_cause": "Lack of a deterministic downing strategy to handle unreachable nodes during a network partition.",
    "bad_code": "akka.cluster {\n  # DANGEROUS: Leads to split brain\n  auto-down-unreachable-after = 10s\n}",
    "solution_desc": "Implement the Akka Split Brain Resolver (SBR). For production, the 'Keep Majority' or 'Static Quorum' strategies are recommended. In Kubernetes, use the Lease-based SBR which utilizes K8s API primitives to ensure only one side of the partition survives.",
    "good_code": "akka.cluster.split-brain-resolver {\n  active-strategy = \"keep-majority\"\n  stable-after = 20s\n}\n\nakka.cluster.downing-provider-class = \"akka.cluster.sbr.SplitBrainResolverProvider\"",
    "verification": "Simulate a partition using 'iptables -A INPUT -s [IP] -j DROP' and verify that only the majority partition remains Up.",
    "date": "2026-03-04",
    "id": 1772606171,
    "type": "error"
});