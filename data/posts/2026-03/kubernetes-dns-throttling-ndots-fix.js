window.onPostDataLoaded({
    "title": "Resolving Kubernetes DNS Throttling (ndots:5) in Microservices",
    "slug": "kubernetes-dns-throttling-ndots-fix",
    "language": "Go",
    "code": "DNSLookupTimeout",
    "tags": [
        "Kubernetes",
        "Networking",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>The default Kubernetes 'ndots:5' setting in /etc/resolv.conf causes the DNS resolver to append search suffixes for any hostname with fewer than 5 dots. For a microservice calling 'api.external.com', the resolver first tries 'api.external.com.svc.cluster.local', then 'api.external.com.cluster.local', etc. In high-traffic environments, this 5x amplification of DNS queries overwhelms CoreDNS and triggers Linux conntrack race conditions, leading to 5-second timeouts.</p>",
    "root_cause": "The high value of 'ndots' in the default Pod spec forces the resolver to perform multiple unsuccessful searches through the internal cluster domain hierarchy before attempting a public resolution.",
    "bad_code": "apiVersion: v1\nkind: Pod\nmetadata:\n  name: microservice\nspec:\n  containers:\n  - name: app\n    image: app:latest # Uses default ndots:5",
    "solution_desc": "Explicitly lower the 'ndots' value to 1 in the Pod's 'dnsConfig'. This tells the resolver to treat any name with at least one dot as an absolute name first, bypassing the internal search path overhead.",
    "good_code": "spec:\n  dnsConfig:\n    options:\n      - name: ndots\n        value: \"1\"\n  containers:\n  - name: app\n    image: app:latest",
    "verification": "Use 'kubectl exec' to check /etc/resolv.conf inside the pod and run 'tcpdump' on the CoreDNS pods to verify a 1:1 ratio of external requests to DNS queries.",
    "date": "2026-03-21",
    "id": 1774055478,
    "type": "error"
});