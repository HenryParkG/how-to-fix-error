window.onPostDataLoaded({
    "title": "Fix K8s Ingress TCP TIME_WAIT Port Exhaustion Under Spikes",
    "slug": "k8s-ingress-tcp-timewait-port-exhaustion",
    "language": "Kubernetes / NGINX",
    "code": "EADDRNOTAVAIL",
    "tags": [
        "Kubernetes",
        "Docker",
        "NGINX",
        "DevOps",
        "Error Fix"
    ],
    "analysis": "<p>During sudden traffic surges in Kubernetes microservice clusters, NGINX Ingress controllers can start throwing 502 Bad Gateway errors with underlying <code>Cannot assign requested address (EADDRNOTAVAIL)</code> kernel logs. This occurs when all dynamic ephemeral ports on the host/container are exhausted due to thousands of backend TCP sockets lingering in the <code>TIME_WAIT</code> state after short-lived connection terminations.</p>",
    "root_cause": "Upstream connection keep-alive settings are disabled or configured with low request limits in the NGINX Ingress Controller, forcing new TCP handshakes per HTTP request and quickly depleting the Linux ephemeral socket range (32768\u201360999).",
    "bad_code": "apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: ingress-nginx-controller\ndata:\n  # Missing or zero keepalive setting forces connection closures\n  upstream-keepalive-connections: \"0\"\n  keep-alive-requests: \"100\"",
    "solution_desc": "Configure connection persistence on the NGINX upstream pool by enabling `upstream-keepalive-connections` and adjusting Linux kernel sysctl flags (`net.ipv4.tcp_tw_reuse`) to allow dynamic reuse of sockets in TIME_WAIT state.",
    "good_code": "apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: ingress-nginx-controller\ndata:\n  upstream-keepalive-connections: \"10000\"\n  upstream-keepalive-requests: \"100000\"\n  upstream-keepalive-timeout: \"60\"\n  sysctl-net.ipv4.tcp_tw_reuse: \"1\"",
    "verification": "Execute heavy load testing using `k6` or `hey`. Run `netstat -an | grep TIME_WAIT | wc -l` inside the ingress container to confirm socket counts remain capped and no 502 EADDRNOTAVAIL errors occur.",
    "date": "2026-08-09",
    "id": 1786237084,
    "type": "error"
});