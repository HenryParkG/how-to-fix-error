window.onPostDataLoaded({
    "title": "Fixing CoreDNS UDP Drops via Linux Conntrack Races",
    "slug": "k8s-coredns-conntrack-race-packet-drops",
    "language": "Kubernetes",
    "code": "ConntrackDropRace",
    "tags": [
        "Kubernetes",
        "Docker",
        "Linux",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>High-throughput microservices running on Kubernetes frequently experience intermittent 5-second DNS resolution latencies. In deep network traces, these manifests as sporadic silent packet drops between application pods and CoreDNS pods.</p><p>By default, glibc performs parallel DNS lookups for IPv4 (A) and IPv6 (AAAA) records using the same UDP socket. When both queries depart the network stack nearly simultaneously, Linux netfilter evaluates Destination NAT (DNAT) rules for the Kubernetes Service VIP. Because both packets share identical 5-tuples (same source IP, source port, protocol, and destination IP/port), they trigger a race condition inside the kernel's <code>__nf_conntrack_confirm</code> function. Only one entry successfully commits to the connection tracking table; the competing packet is rejected and silently dropped by the kernel.</p>",
    "root_cause": "Concurrent A and AAAA DNS queries from glibc on identical UDP source ports compete in Linux kernel netfilter conntrack table insertion. The second packet fails insertion due to a 5-tuple collision before NAT confirmation completes, causing the kernel to drop it with NF_CT_STAT(net, insert_failed). The client must wait for a 5-second UDP retransmission timeout.",
    "bad_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: payment-service\nspec:\n  replicas: 5\n  template:\n    spec:\n      containers:\n      - name: app\n        image: payment-service:v1.2.0\n        # BUG: Relies on default alpine/glibc DNS lookup behavior with parallel UDP A/AAAA queries\n        # causing conntrack table insertion conflicts against CoreDNS ClusterIP",
    "solution_desc": "Architecturally mitigate UDP conntrack collisions by deploying NodeLocal DNSCache, enforcing TCP fallback, or reconfiguring the pod DNS resolver with `single-request-reopen` and `ndots:2`. NodeLocal DNSCache terminates pod DNS requests on a local dummy interface (169.254.20.10) over UDP without NAT, while querying CoreDNS upstream over reliable TCP connections.",
    "good_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: payment-service\nspec:\n  replicas: 5\n  template:\n    spec:\n      dnsConfig:\n        options:\n          - name: single-request-reopen\n          - name: ndots\n            value: \"2\"\n          - name: timeout\n            value: \"1\"\n          - name: attempts\n            value: \"3\"\n      containers:\n      - name: app\n        image: payment-service:v1.2.0",
    "verification": "Run `conntrack -S` on the underlying Linux worker nodes and check that `insert_failed` counters stop incrementing. Run continuous synthetic DNS benchmarks using `dnsping` or `k6` to verify that 5000ms p99 latency spikes are eliminated.",
    "date": "2026-10-20",
    "id": 1792505205,
    "type": "error"
});