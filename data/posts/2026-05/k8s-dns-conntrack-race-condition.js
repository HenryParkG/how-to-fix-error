window.onPostDataLoaded({
    "title": "Mitigating K8s DNS Latency from Conntrack Races",
    "slug": "k8s-dns-conntrack-race-condition",
    "language": "Go",
    "code": "DNS_TIMEOUT_5S",
    "tags": [
        "Kubernetes",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In Kubernetes environments, applications frequently experience intermittent 5-second DNS resolution delays. This is caused by a race condition in the Linux kernel's netfilter conntrack module. When two UDP packets (e.g., A and AAAA DNS queries) are sent simultaneously from the same socket, they compete for the same conntrack entry. One packet wins, and the other is dropped or delayed because the kernel cannot create a duplicate entry, leading to a timeout and a retransmission after the default 5-second window.</p>",
    "root_cause": "A race condition in the __nf_conntrack_confirm function where multiple threads try to insert conntrack entries for the same flow simultaneously.",
    "bad_code": "apiVersion: v1\nkind: Pod\nmetadata:\n  name: web-app\nspec:\n  containers:\n  - name: app\n    image: node:alpine\n    # Uses default DNS settings, prone to conntrack race",
    "solution_desc": "Deploy NodeLocal DNSCache to the cluster. This acts as a caching agent on each node, reducing the number of conntrack entries created by using TCP for upstream queries or by keeping UDP traffic local to the node's loopback interface. Alternatively, use the 'single-request-reopen' option in resolv.conf.",
    "good_code": "apiVersion: v1\nkind: Pod\nspec:\n  dnsConfig:\n    options:\n      - name: single-request-reopen\n      - name: timeout\n        value: \"2\"\n      - name: attempts\n        value: \"3\"",
    "verification": "Run a load test using 'dnsperf' inside a pod and monitor the 'conntrack_allowance_available' metrics or look for 'insert_failed' counters in /proc/net/stat/nf_conntrack.",
    "date": "2026-05-03",
    "id": 1777773438,
    "type": "error"
});