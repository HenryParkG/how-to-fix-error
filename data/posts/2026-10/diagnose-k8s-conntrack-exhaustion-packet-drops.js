window.onPostDataLoaded({
    "title": "Diagnose Silent TCP Packet Drops from Conntrack Exhaustion",
    "slug": "diagnose-k8s-conntrack-exhaustion-packet-drops",
    "language": "Kubernetes",
    "code": "NF_CONNTRACK_FULL",
    "tags": [
        "Kubernetes",
        "Docker",
        "Networking",
        "Error Fix"
    ],
    "analysis": "<p>In Kubernetes clusters handling high throughput or large quantities of microservices, applications often experience unexplained TCP connection timeouts, DNS resolution failures (EAI_AGAIN), and intermittent 502/504 errors. When inspecting application logs, connection attempts to standard Service ClusterIPs simply hang or abort after standard SYN retry limits.</p><p>Kubernetes depends on Linux Netfilter and IPTables/IPVS to route Service traffic via NAT. Every tracked connection (including UDP DNS queries and short-lived TCP streams) requires an entry in the kernel's connection tracking table (<code>nf_conntrack</code>). When this table reaches capacity, the kernel silently discards new inbound and outbound connection attempts without returning TCP RST or ICMP port unreachable packets, leading to invisible network degradation.</p>",
    "root_cause": "Ephemeral connections and high connection churn deplete the Linux kernel 'nf_conntrack_max' limit. Once full, the netfilter subsystem drops incoming SYN packets with the kernel error 'nf_conntrack: table full, dropping packet'.",
    "bad_code": "# Default / poorly configured host sysctl parameters on high-concurrency node\nsysctl net.netfilter.nf_conntrack_max\n# Returns: net.netfilter.nf_conntrack_max = 65536\n\n# Node kernel log shows silent dropping:\ndmesg -T | grep -E \"nf_conntrack.*full\"\n# Output: [Wed Jan 10 03:15:22 2024] nf_conntrack: table full, dropping packet\n# Output: [Wed Jan 10 03:15:23 2024] nf_conntrack: table full, dropping packet\n\n# Application initiating HTTP requests without persistent keep-alives:\ncurl -s -k https://service-api.internal/v1/ping > /dev/null\n# Spawns new TCP handshake on every call, maintaining TIME_WAIT state in conntrack for up to 120s",
    "solution_desc": "Calculate appropriate conntrack table sizes based on node RAM, increase 'nf_conntrack_max' and the corresponding hash bucket size 'hashsize', reduce excessive TCP timeout periods for closed connections, and enforce HTTP Keep-Alive pooling in workloads and NodeLocal DNSCache in Kubernetes.",
    "good_code": "# 1. Apply kernel sysctl tuning via DaemonSet or /etc/sysctl.d/99-conntrack.conf\ncat << 'EOF' | sudo tee /etc/sysctl.d/99-conntrack.conf\nnet.netfilter.nf_conntrack_max = 1048576\nnet.netfilter.nf_conntrack_tcp_timeout_established = 432000\nnet.netfilter.nf_conntrack_tcp_timeout_close_wait = 30\nnet.netfilter.nf_conntrack_tcp_timeout_fin_wait = 30\nnet.netfilter.nf_conntrack_tcp_timeout_time_wait = 30\nEOF\nsudo sysctl --system\n\n# 2. Adjust hashsize to balance bucket distribution (hashsize = nf_conntrack_max / 4)\necho 262144 | sudo tee /sys/module/nf_conntrack/parameters/hashsize\n\n# 3. Deploy Kubernetes NodeLocal DNSCache to cache UDP connections locally:\n# kubectl apply -f https://raw.githubusercontent.com/kubernetes/kubernetes/master/cluster/addons/dns/nodelocaldns/nodelocaldns.yaml",
    "verification": "Run 'conntrack -S' to verify 'drop' and 'early_drop' counters are 0. Compare current usage using 'cat /proc/sys/net/netfilter/nf_conntrack_count' against 'net.netfilter.nf_conntrack_max' to ensure sufficient headroom under load.",
    "date": "2026-10-26",
    "id": 1792981593,
    "type": "error"
});