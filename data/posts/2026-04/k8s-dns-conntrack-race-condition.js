window.onPostDataLoaded({
    "title": "Fix DNS Latency Spikes from Conntrack Race Conditions",
    "slug": "k8s-dns-conntrack-race-condition",
    "language": "Kubernetes",
    "code": "DNS_TIMEOUT_UDP",
    "tags": [
        "Kubernetes",
        "Docker",
        "Infra",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>High-traffic Kubernetes clusters frequently experience intermittent 5-second DNS lookup delays. This occurs because of a race condition in the Linux kernel's Netfilter conntrack module. When multiple threads simultaneously send UDP packets (like A and AAAA DNS lookups) over the same socket, they compete to create a conntrack entry. If one fails to insert, the packet is dropped, leading to a timeout and retry.</p>",
    "root_cause": "The conntrack table insertion logic for UDP is non-atomic across parallel requests from the same source port, causing packet drops on collisions.",
    "bad_code": "apiVersion: v1\nkind: Pod\nspec:\n  containers:\n  - name: app\n    image: my-app:latest\n# Standard config prone to race conditions",
    "solution_desc": "Deploy NodeLocal DNSCache to handle lookups locally via TCP/caching, and inject 'single-request-reopen' into the Pod's resolv.conf to force separate sockets for A and AAAA records.",
    "good_code": "apiVersion: v1\nkind: Pod\nspec:\n  dnsConfig:\n    options:\n      - name: single-request-reopen\n      - name: ndots\n        value: \"2\"\n  containers:\n  - name: app\n    image: my-app:latest",
    "verification": "Monitor 'conntrack -S' for 'insert_failed' increments and use 'dig' in a loop to check for 5s latencies.",
    "date": "2026-04-30",
    "id": 1777514625,
    "type": "error"
});