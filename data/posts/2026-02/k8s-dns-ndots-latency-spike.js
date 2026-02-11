window.onPostDataLoaded({
    "title": "Kubernetes DNS Latency: The Silent ndots:5 Penalty",
    "slug": "k8s-dns-ndots-latency-spike",
    "language": "Kubernetes Networking",
    "code": "DNSResolutionLatency",
    "tags": [
        "Kubernetes",
        "DNS",
        "CoreDNS",
        "Networking",
        "Error Fix"
    ],
    "analysis": "<p>In Kubernetes, the default /etc/resolv.conf inside a Pod is configured with 'options ndots:5'. This means that if a hostname contains fewer than five dots, the DNS resolver will first attempt to resolve it by appending the cluster's internal search paths (e.g., namespace.svc.cluster.local) before attempting to resolve it as a Fully Qualified Domain Name (FQDN).</p><p>When an application calls an external API like 'api.example.com', which only has two dots, the resolver generates a sequence of unsuccessful queries: 'api.example.com.namespace.svc.cluster.local', then 'api.example.com.svc.cluster.local', and so on. Each of these triggers an NXDOMAIN response from CoreDNS. Only after these internal attempts fail does the resolver query for the actual external domain. This adds significant millisecond-level latency to every outbound connection and places unnecessary load on the cluster's DNS infrastructure.</p>",
    "root_cause": "The default ndots:5 configuration forces multiple redundant internal DNS lookups for any external hostname with fewer than 5 dots.",
    "bad_code": "apiVersion: v1\nkind: Pod\nmetadata:\n  name: latency-prone-app\nspec:\n  containers:\n  - name: web-client\n    image: alpine\n    command: [\"sh\", \"-c\", \"wget https://api.stripe.com\"]",
    "solution_desc": "Manually override the pod's DNS configuration to set ndots to 1, or append a trailing dot to the external hostname in your application code to signal it is already an FQDN.",
    "good_code": "apiVersion: v1\nkind: Pod\nmetadata:\n  name: optimized-app\nspec:\n  dnsConfig:\n    options:\n      - name: ndots\n        value: \"1\"\n  containers:\n  - name: web-client\n    image: alpine\n    command: [\"sh\", \"-c\", \"wget https://api.stripe.com\"]",
    "verification": "Execute 'kubectl exec -it <pod_name> -- cat /etc/resolv.conf' to confirm ndots:1, and use 'tcpdump' or CoreDNS logs to verify that resolution for external hosts no longer attempts internal search paths first.",
    "date": "2026-02-11",
    "id": 1770793176
});