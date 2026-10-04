window.onPostDataLoaded({
    "title": "Kubernetes IPVS: Conntrack Table Exhaustion & DNS Drops",
    "slug": "k8s-ipvs-conntrack-exhaustion-silent-dns-drops",
    "language": "Go",
    "code": "NF_CONNTRACK_FULL",
    "tags": [
        "Kubernetes",
        "Go",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>When Kubernetes clusters operate in IPVS proxy mode (<code>kube-proxy --proxy-mode=ipvs</code>), IPVS leverages the Netfilter connection tracking framework (<code>nf_conntrack</code>) to maintain state for both TCP connections and UDP flows. In microservice environments with heavy service-to-service communication, applications make rapid, unpooled UDP DNS queries to CoreDNS.</p><p>Because UDP is stateless, Netfilter sets an arbitrary conntrack entry timeout (defaulting to 30 seconds for generic UDP). When massive bursts of ephemeral DNS queries occur, these entries linger inside the kernel conntrack table. Once the table hits <code>nf_conntrack_max</code>, the kernel silently discards new UDP packets without responding via ICMP, inducing catastrophic 5-second DNS lookup timeouts across worker nodes.</p>",
    "root_cause": "Unbounded ephemeral UDP DNS requests exhausting the host kernel `nf_conntrack` state table due to conservative conntrack retention timers and unpooled resolver configurations in client pods.",
    "bad_code": "# Default CoreDNS deployment with unoptimized host conntrack limits\napiVersion: apps/v1\nkind: DaemonSet\nmetadata:\n  name: microservice-worker\nspec:\n  template:\n    spec:\n      containers:\n      - name: client\n        image: alpine:latest\n        command: [\"sh\", \"-c\", \"while true; do nslookup my-svc.default.svc.cluster.local; done\"]",
    "solution_desc": "Deploy NodeLocal DNSCache to absorb client UDP queries locally using TCP upstreams, tune host kernel `nf_conntrack_max` and UDP timeouts, and inject `ndots:2` and `single-request-reopen` into client resolv.conf policies.",
    "good_code": "# 1. Sysctl tuning on worker node init or DaemonSet\nsysctl -w net.netfilter.nf_conntrack_max=1048576\nsysctl -w net.netfilter.nf_conntrack_udp_timeout=3\nsysctl -w net.netfilter.nf_conntrack_udp_timeout_stream=10\n\n# 2. Optimized pod DNSConfig to reduce lookup multiplicity\napiVersion: v1\nkind: Pod\nmetadata:\n  name: client-pod\nspec:\n  dnsConfig:\n    options:\n      - name: ndots\n        value: \"2\"\n      - name: single-request-reopen\n  containers:\n  - name: app\n    image: my-service:latest",
    "verification": "Check dropped packets via `conntrack -S` to inspect `drop` and `insert_failed` counters. Monitor host kernel messages with `dmesg -T | grep 'nf_conntrack: table full'` to ensure drops cease entirely under load.",
    "date": "2026-10-04",
    "id": 1791113568,
    "type": "error"
});