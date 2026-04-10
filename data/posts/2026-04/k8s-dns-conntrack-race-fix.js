window.onPostDataLoaded({
    "title": "Mitigating Kubernetes DNS Latency Conntrack Race",
    "slug": "k8s-dns-conntrack-race-fix",
    "language": "Kubernetes",
    "code": "DNSLatencySpikes",
    "tags": [
        "Kubernetes",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Kubernetes users often observe intermittent 5-second latency spikes in DNS lookups. This is usually caused by a race condition in the Linux kernel's Netfilter/conntrack module. When two UDP packets (A and AAAA records) are sent from the same socket concurrently, they compete for the same conntrack entry. One packet gets dropped, forcing the client to wait for a 5-second timeout before retrying.</p>",
    "root_cause": "Race condition in conntrack during source port allocation for concurrent UDP DNS queries.",
    "bad_code": "apiVersion: v1\nkind: Pod\nmetadata:\n  name: web-app\nspec:\n  containers:\n  - name: app\n    image: my-app:latest",
    "solution_desc": "Configure the Pod's dnsConfig to use 'single-request-reopen' or 'use-vc'. 'single-request-reopen' forces the resolver to close the socket and open a new one for the second request, avoiding the race.",
    "good_code": "apiVersion: v1\nkind: Pod\nmetadata:\n  name: web-app\nspec:\n  dnsConfig:\n    options:\n      - name: single-request-reopen\n  containers:\n  - name: app\n    image: my-app:latest",
    "verification": "Monitor DNS latency metrics. The 5000ms bucket in Prometheus should show zero hits after the change.",
    "date": "2026-04-10",
    "id": 1775784535,
    "type": "error"
});