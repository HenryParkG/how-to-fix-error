window.onPostDataLoaded({
    "title": "Eliminating Akka Cluster Split-Brain Scenarios",
    "slug": "akka-cluster-split-brain-fix",
    "language": "Java",
    "code": "SplitBrainInconsistency",
    "tags": [
        "Java",
        "Backend",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>In distributed systems, network partitions can lead to a 'Split-Brain' where a cluster splits into two or more independent factions. In Akka Cluster, if the failure detector marks nodes as unreachable, and both sides of the partition decide to 'down' the other side, both will continue as independent clusters. This leads to dual leaders and catastrophic data corruption when using Single Writers or Sharding.</p>",
    "root_cause": "Usage of the legacy 'auto-down-unreachable-after' setting or lack of a deterministic consensus strategy for node removal during network instability.",
    "bad_code": "akka {\n  cluster {\n    # DANGEROUS: Leads to split-brain during partitions\n    auto-down-unreachable-after = 10s\n  }\n}",
    "solution_desc": "Implement the Akka Split Brain Resolver (SBR). For fixed-size clusters or Kubernetes, use the 'keep-majority' or 'static-quorum' strategy to ensure only one partition survives the failure.",
    "good_code": "akka.cluster {\n  downing-provider-class = \"akka.cluster.sbr.SplitBrainResolverProvider\"\n  split-brain-resolver {\n    active-strategy = \"keep-majority\"\n    keep-majority {\n      role = \"worker\"\n    }\n  }\n  # Disable legacy auto-down\n  allow-weakly-up-members = on\n}",
    "verification": "Use a 'Chaos Mesh' tool to inject network partitions in a staging Kubernetes environment and verify that only the majority partition remains functional while the minority shuts down.",
    "date": "2026-03-12",
    "id": 1773277713,
    "type": "error"
});