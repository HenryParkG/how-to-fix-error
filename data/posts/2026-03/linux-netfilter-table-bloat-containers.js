window.onPostDataLoaded({
    "title": "Fixing Linux Netfilter Table Bloat in Kubernetes",
    "slug": "linux-netfilter-table-bloat-containers",
    "language": "Bash/C",
    "code": "nf_conntrack: table full",
    "tags": [
        "Docker",
        "Kubernetes",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In high-churn container environments where pods are frequently created and destroyed, the Linux kernel's Netfilter conntrack table can become saturated. Each network connection (even short-lived DNS queries) creates an entry that persists for a timeout period. When the `nf_conntrack_max` limit is reached, the kernel starts dropping incoming and outgoing packets, leading to intermittent 'Connection Refused' or 'Timeout' errors across the entire node cluster.</p>",
    "root_cause": "Stale connection entries from short-lived containers lingering in the conntrack table due to high default timeout values (e.g., 432,000s for ESTABLISHED).",
    "bad_code": "# Default settings on many distros\nnet.netfilter.nf_conntrack_max = 262144\nnet.netfilter.nf_conntrack_tcp_timeout_established = 432000",
    "solution_desc": "Increase the conntrack table size and aggressively tune the timeout periods for established and closing connections via sysctl to ensure faster garbage collection of stale entries.",
    "good_code": "sysctl -w net.netfilter.nf_conntrack_max=1048576\nsysctl -w net.netfilter.nf_conntrack_tcp_timeout_established=3600\nsysctl -w net.netfilter.nf_conntrack_tcp_timeout_close_wait=60",
    "verification": "Run 'conntrack -C' to check the current count and ensure it stays well below the new maximum limit.",
    "date": "2026-03-14",
    "id": 1773470132,
    "type": "error"
});