window.onPostDataLoaded({
    "title": "Resolving DNS Conntrack Race Conditions in Kubernetes",
    "slug": "kubernetes-dns-conntrack-race",
    "language": "Kubernetes",
    "code": "Packet Drop",
    "tags": [
        "Kubernetes",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>High-density Kubernetes clusters often encounter 5-second DNS lookup timeouts. This is caused by a race condition in the Linux kernel's netfilter conntrack module. When two UDP packets (typically A and AAAA DNS queries) are sent simultaneously from the same socket, they compete for the same conntrack bucket. One packet succeeds, while the other is dropped by the kernel because it\u2019s seen as a duplicate/invalid entry, leading to a timeout until the client retries.</p>",
    "root_cause": "Parallel DNS queries from the same port result in a race condition during the __nf_conntrack_confirm step in the Linux kernel.",
    "bad_code": "apiVersion: v1\nkind: Pod\nmetadata:\n  name: dns-buggy-pod\nspec:\n  containers:\n  - name: app\n    image: alpine:latest",
    "solution_desc": "Configure the Pod's DNS options to use 'single-request-reopen' which forces the resolver to close the socket and open a new one for the second request, or deploy NodeLocal DNSCache to handle lookups via TCP/locally.",
    "good_code": "spec:\n  dnsConfig:\n    options:\n      - name: single-request-reopen\n      - name: ndots\n        value: \"2\"",
    "verification": "Use 'conntrack -S' to monitor 'insert_failed' counters or track DNS latency percentiles using Prometheus.",
    "date": "2026-05-12",
    "id": 1778574953,
    "type": "error"
});