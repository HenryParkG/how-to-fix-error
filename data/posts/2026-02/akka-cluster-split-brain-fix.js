window.onPostDataLoaded({
    "title": "Resolving Akka Cluster Split-Brain Scenarios",
    "slug": "akka-cluster-split-brain-fix",
    "language": "Java",
    "code": "SplitBrain",
    "tags": [
        "Java",
        "Backend",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>In distributed systems running on unreliable network topologies, an Akka cluster can partition into sub-clusters. If both sides of the partition decide to 'down' the other, you end up with two independent leaders. This is the 'Split-Brain' scenario, which can lead to data corruption in persistent actors or dual-execution of singleton services.</p>",
    "root_cause": "Relying on the deprecated 'auto-down-unreachable-after' setting or failing to implement a deterministic Split Brain Resolver (SBR) strategy that ensures only one side of a partition survives.",
    "bad_code": "akka {\n  cluster {\n    # DANGEROUS: Leads to split-brain\n    auto-down-unreachable-after = 10s\n  }\n}",
    "solution_desc": "Disable auto-downing and implement the 'Split Brain Resolver' using a 'keep-majority' or 'static-quorum' strategy. This ensures that only the partition containing the majority of nodes remains active.",
    "good_code": "akka.cluster {\n  downing-provider-class = \"akka.cluster.sbr.SplitBrainResolverProvider\"\n  split-brain-resolver {\n    active-strategy = \"keep-majority\"\n    keep-majority {\n      role = \"\"\n    }\n  }\n}",
    "verification": "Perform a network partition test using 'iptables' to block communication between nodes and verify that only one partition remains as 'Up' while the other is terminated.",
    "date": "2026-02-21",
    "id": 1771655541,
    "type": "error"
});