window.onPostDataLoaded({
    "title": "Solving Akka Cluster Split-Brain Scenarios",
    "slug": "akka-cluster-split-brain-fix",
    "language": "Java / Scala",
    "code": "SplitBrain",
    "tags": [
        "Java",
        "Infra",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Split-brain is a critical failure state in Akka Clusters where a network partition divides the cluster into two or more independent groups. Each group believes the other has failed, leading to multiple 'Singleton' actors or concurrent write operations on shared data (like Akka Persistence). This occurs because the default 'downing' mechanism is manual or naive, failing to reach a consensus on which nodes should be removed from the cluster during a partition.</p>",
    "root_cause": "Missing automated Split Brain Resolver (SBR) configuration or using 'auto-down-unreachable-after' which is unsafe for partitions.",
    "bad_code": "akka {\n  cluster {\n    # DANGEROUS: Leads to split-brain during network blips\n    auto-down-unreachable-after = 10s\n    seed-nodes = [\"akka://Sys@host1:2552\"]\n  }\n}",
    "solution_desc": "Configure the Akka Split Brain Resolver (SBR) with a strategy like 'keep-majority'. This ensures that during a partition, only the partition with the majority of nodes remains active, while the minority partition shuts itself down (or 'downs' itself), preserving data consistency.",
    "good_code": "akka {\n  cluster {\n    # Enable SBR\n    downing-provider-class = \"akka.cluster.sbr.SplitBrainResolverProvider\"\n    split-brain-resolver {\n      active-strategy = \"keep-majority\"\n      keep-majority {\n        # If exactly 50/50, keep the one with the lowest address\n        role = \"\"\n      }\n    }\n  }\n}",
    "verification": "Simulate a network partition using 'iptables -A INPUT -s <node_ip> -j DROP' and verify that the minority group nodes terminate while the majority group remains healthy.",
    "date": "2026-05-14",
    "id": 1778724849,
    "type": "error"
});