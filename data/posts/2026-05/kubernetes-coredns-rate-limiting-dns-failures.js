window.onPostDataLoaded({
    "title": "Fixing CoreDNS Rate-Limiting Pod CrashLoopBackOffs",
    "slug": "kubernetes-coredns-rate-limiting-dns-failures",
    "language": "Go",
    "code": "K8s-DNS-Timeout",
    "tags": [
        "Kubernetes",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In high-concurrency microservice ecosystems running on Kubernetes, sudden traffic surges lead to intensive lookup request spikes. Applications running on Node architectures resolve internal and external addresses via CoreDNS. Under heavy concurrency load, CoreDNS instances can hit connection limits or processing constraints, drop packets, or return rate-limiting errors.</p><p>These failure events manifest as persistent DNS query timeouts inside application pods. Consequently, synchronous startup, liveness, or readiness health probes fail to resolve critical service hosts, marking the workloads as unhealthy and forcing them into a state of continuous <code>CrashLoopBackOff</code>.</p>",
    "root_cause": "The reliance on default resolver search lists (glibc's ndots:5 configuration) causes multiple sequential invalid searches (e.g. cluster.local suffixes) for every single external endpoint lookup, amplifying lookup traffic and flooding the centralized CoreDNS deployments until socket drops and timeouts occur.",
    "bad_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: core-api-service\nspec:\n  template:\n    spec:\n      containers:\n      - name: api\n        image: api:v1\n      dnsConfig:\n        options:\n        - name: ndots\n          value: \"5\" # Inherits default high search query multiplication",
    "solution_desc": "Deploy NodeLocal DNSCache as an active DaemonSet to process resolution requests directly on each Kubernetes node, caching responses and reducing central load. Optimize the client-side configuration parameters inside the Deployment specifications by minimizing 'ndots' constraints.",
    "good_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: core-api-service\nspec:\n  template:\n    spec:\n      containers:\n      - name: api\n        image: api:v1\n      dnsPolicy: ClusterFirst\n      dnsConfig:\n        nameservers:\n        - 169.254.20.10 # Intercept requests local to NodeLocal DNSCache\n        searches:\n        - default.svc.cluster.local\n        - svc.cluster.local\n        - cluster.local\n        options:\n        - name: ndots\n          value: \"1\" # Bypass query suffix multiplication loops\n        - name: timeout\n          value: \"2\"\n        - name: attempts\n          value: \"2\"",
    "verification": "Check active NodeLocal pods via `kubectl get daemonset -n kube-system`. Execute connection tests within the container environment by querying records sequentially with utilities like `nslookup` or `dig` to measure lookup duration and packet drop rates.",
    "date": "2026-05-24",
    "id": 1779618415,
    "type": "error"
});