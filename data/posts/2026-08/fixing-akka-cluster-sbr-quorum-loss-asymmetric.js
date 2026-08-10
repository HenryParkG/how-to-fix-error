window.onPostDataLoaded({
    "title": "Fixing Akka Cluster Split-Brain Quorum Loss in Network Cut",
    "slug": "fixing-akka-cluster-sbr-quorum-loss-asymmetric",
    "language": "Java",
    "code": "SBR_QUORUM_LOSS",
    "tags": [
        "Java",
        "Akka",
        "Distributed Systems",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>During asymmetric network partitions (where Node A can observe Node B, but Node B cannot respond to Node A), Akka Cluster's default Split-Brain Resolver (SBR) static strategies misinterpret member reachability. This results in both sides of the cluster believing they lost majority quorum, triggering unexpected self-downing across the entire cluster.</p>",
    "root_cause": "Unidirectional packet filtering causes asymmetrical failure detector metrics. Under standard `keep-majority` or `static-quorum` strategies, unreachable status nodes are counted inconsistently across partitions, leading SBR engine instances on both sides to down themselves.",
    "bad_code": "akka.cluster.split-brain-resolver {\n  active-strategy = keep-majority\n  keep-majority {\n    role = \"\"\n  }\n  down-removal-margin = 10s\n}",
    "solution_desc": "Replace static/majority reachability assumptions with dynamic lease-backed quorum strategies (`lease-majority`) using an external coordinator (such as Kubernetes Leases or Consul). Ensure heartbeat intervals account for asymmetric node evaluation.",
    "good_code": "akka.cluster.split-brain-resolver {\n  active-strategy = lease-majority\n  lease-majority {\n    lease-implementation = \"akka.coordination.lease.kubernetes\"\n    role = \"compute\"\n    acquire-lease-delay-for-minority = 5s\n    release-after-downed = 10s\n  }\n  stable-after = 20s\n  down-removal-margin = 20s\n}\n\nakka.coordination.lease.kubernetes {\n  lease-class = \"akka.coordination.lease.kubernetes.KubernetesLease\"\n  heartbeat-timeout = 12s\n}",
    "verification": "Simulate asymmetric link failure using `iptables -A OUTPUT -d <target_ip> -j DROP` on selected node and verify via Akka Cluster HTTP Management API that only the unhealthy partition self-downs while the healthy partition holds the Kubernetes lease.",
    "date": "2026-08-10",
    "id": 1786335760,
    "type": "error"
});