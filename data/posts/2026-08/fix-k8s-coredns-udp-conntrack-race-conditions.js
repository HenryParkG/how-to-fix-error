window.onPostDataLoaded({
    "title": "Fix Kubernetes CoreDNS UDP & Conntrack Races",
    "slug": "fix-k8s-coredns-udp-conntrack-race-conditions",
    "language": "Go",
    "code": "ConntrackRaceUDPTimeout",
    "tags": [
        "Kubernetes",
        "CoreDNS",
        "Networking",
        "Go",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>In Kubernetes clusters, applications intermittently experience 5-second DNS resolution latencies. This issue stems from the Linux kernel Netfilter connection tracking (<code>nf_conntrack</code>) subsystem when handling concurrent UDP requests over the same socket.</p><p>Glibc performs parallel DNS lookups for IPv4 (A) and IPv6 (AAAA) records using distinct UDP queries sent almost simultaneously from the same local socket. When both packets pass through Netfilter SNAT/DNAT translation rules, a kernel race condition occurs in <code>__nf_conntrack_confirm</code>. The kernel detects an entry collision for the second tuple and drops the packet, forcing the glibc resolver to wait for its default 5000ms UDP retransmission timeout.</p>",
    "root_cause": "Simultaneous A and AAAA DNS queries sent over UDP share an identical socket and destination IP/port, causing a conntrack entry insertion race in Netfilter that drops one response and triggers glibc's 5-second timeout.",
    "bad_code": "# Default Pod specification without DNS optimization\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: payment-service\nspec:\n  template:\n    spec:\n      containers:\n      - name: app\n        image: payment-service:v1.2.0\n        # Uses standard glibc resolving: dual UDP lookups without single-request-reopen",
    "solution_desc": "Mitigate conntrack UDP races by deploying NodeLocal DNSCache to terminate UDP traffic locally on each node and forward requests upstream via TCP, or configure `single-request-reopen` in the Pod's `dnsConfig` to force sequential socket creation for dual lookups.",
    "good_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: payment-service\nspec:\n  template:\n    spec:\n      dnsPolicy: \"None\"\n      dnsConfig:\n        nameservers:\n          - 169.254.20.10 # NodeLocal DNSCache Virtual IP\n        searches:\n          - default.svc.cluster.local\n          - svc.cluster.local\n          - cluster.local\n        options:\n          - name: ndots\n            value: \"2\"\n          - name: single-request-reopen\n          - name: timeout\n            value: \"1\"\n          - name: attempts\n            value: \"3\"\n      containers:\n      - name: app\n        image: payment-service:v1.2.0",
    "verification": "Simulate concurrent DNS lookups using `dnstracer` or `kube-dns-bench`. Monitor conntrack drop counters with `conntrack -S` and observe whether `insert_failed` and `drop` metrics remain at 0 during high-concurrency bursts.",
    "date": "2026-08-23",
    "id": 1787445838,
    "type": "error"
});