window.onPostDataLoaded({
    "title": "Fix CoreDNS Latency & Conntrack Table Exhaustion",
    "slug": "kubernetes-coredns-conntrack-table-exhaustion-fix",
    "language": "Kubernetes",
    "code": "nf_conntrack: table full",
    "tags": [
        "Kubernetes",
        "Docker",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput Kubernetes clusters, CoreDNS latency spikes and random 1-second to 5-second DNS resolution timeouts often stem from Linux Netfilter connection tracking (conntrack) table exhaustion. Netfilter assigns tracking tuples to UDP connections, which lack explicit connection-termination handshakes like TCP FIN/RST.</p><p>When pods execute bursty, short-lived DNS queries over UDP, each request creates an entry that remains in the kernel conntrack table until its timeout expires (typically 30 seconds). If query velocity exceeds table evaporation rates, the kernel reaches <code>nf_conntrack_max</code> and systematically drops new packets, causing severe DNS lookup latency and application-level timeouts.</p>",
    "root_cause": "Bursty UDP DNS lookups generate transient conntrack entries that rapidly exhaust the kernel's nf_conntrack_max limit, leading to silent packet drops and lookup retransmissions.",
    "bad_code": "# Default kernel sysctl settings on high-density nodes\nnet.netfilter.nf_conntrack_max = 65536\nnet.netfilter.nf_conntrack_udp_timeout = 30\n\n# /etc/resolv.conf without NodeLocal DNSCache\nnameserver 10.96.0.10\noptions ndots:5",
    "solution_desc": "Mitigate conntrack exhaustion by deploying Kubernetes NodeLocal DNSCache to handle DNS lookups on a node-level loopback interface using TCP caching, alongside tuning kernel conntrack limits and reducing ndots in resolv.conf.",
    "good_code": "# 1. Tune kernel sysctl limits across worker nodes\nsysctl -w net.netfilter.nf_conntrack_max=1048576\nsysctl -w net.netfilter.nf_conntrack_udp_timeout=10\nsysctl -w net.netfilter.nf_conntrack_udp_timeout_stream=30\n\n# 2. Deploy NodeLocal DNSCache DaemonSet (CoreDNS config excerpt)\napiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: node-local-dns\n  namespace: kube-system\ndata:\n  Corefile: |\n    cluster.local:53 {\n        errors\n        cache {\n            success 9984 30\n            denial 9984 5\n        }\n        reload\n        loop\n        bind 169.254.20.10\n        forward . 10.96.0.10 {\n            force_tcp\n        }\n        prometheus :9253\n    }",
    "verification": "Inspect conntrack table utilization with `sysctl net.netfilter.nf_conntrack_count` and monitor packet drops using `conntrack -S`. Ensure `drop` counters remain at zero under peak DNS traffic.",
    "date": "2026-10-31",
    "id": 1793417256,
    "type": "error"
});