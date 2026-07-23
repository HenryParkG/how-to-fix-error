window.onPostDataLoaded({
    "title": "Fixing Kubernetes IPVS Silent TCP Drops in Service Meshes",
    "slug": "fixing-k8s-ipvs-silent-tcp-drops-service-mesh",
    "language": "Kubernetes",
    "code": "TCPTimeout",
    "tags": [
        "Kubernetes",
        "Infra",
        "Networking",
        "ServiceMesh",
        "Error Fix"
    ],
    "analysis": "<p>When operating high-throughput Kubernetes clusters with kube-proxy in IPVS mode, microservice workloads often experience intermittent, unexplainable connection resets or silent TCP timeouts. This issue is particularly acute in service meshes like Istio or Linkerd with persistent HTTP/2 connection pooling.</p><p>The root cause stems from a timeout mismatch between IPVS table entries and Linux kernel TCP keepalives. The Linux IPVS kernel module defaults to an explicit TCP connection state timeout (900 seconds for ESTABLISHED connections). If persistent pool connections stay idle longer than the IPVS timeout setting, IPVS quietly purges the connection tracking state without sending TCP RST packets. Subsequent packets are dropped silently or dropped by IPVS, forcing clients to wait until TCP retransmissions time out (up to 15 minutes).</p>",
    "root_cause": "IPVS TCP session idle timeout (default 900s) is shorter than application keepalives and service mesh proxy connection pool lifetimes, causing silent connection entry purging in IPVS kernel tables.",
    "bad_code": "apiVersion: kubeproxy.config.k8s.io/v1alpha1\nkind: KubeProxyConfiguration\nmode: \"ipvs\"\nipvs:\n  tcpTimeout: 0s # Defaults to kernel standard 900s (15 mins)\n  tcpFinTimeout: 0s\n  udpTimeout: 0s\n# Host Kernel defaults:\n# net.ipv4.tcp_keepalive_time = 7200 (2 hours > 900s IPVS timeout)",
    "solution_desc": "Configure kube-proxy IPVS timeouts to exceed kernel TCP keepalive settings, or explicitly lower node kernel `net.ipv4.tcp_keepalive_time` and Envoy proxy TCP keepalive probes so keepalive packets continuously refresh IPVS connection entries before expiration.",
    "good_code": "apiVersion: kubeproxy.config.k8s.io/v1alpha1\nkind: KubeProxyConfiguration\nmode: \"ipvs\"\nipvs:\n  tcpTimeout: 86400s # Increase IPVS TCP established timeout to 24 hours\n  tcpFinTimeout: 120s\n  udpTimeout: 300s\n---\n# Ensure Node Kernel sysctl tuning via DaemonSet / sysctl.conf:\n# net.ipv4.tcp_keepalive_time = 600   (Sends keepalives every 10 min < 24h)\n# net.ipv4.tcp_keepalive_intvl = 30\n# net.ipv4.tcp_keepalive_probes = 5",
    "verification": "Execute `ipvsadm -l --timeout` on cluster nodes to confirm active TCP timeout settings. Run continuous idle TCP connection benchmarks using `nc` or mesh telemetry to verify zero TCP dropped connection spikes over 30-minute idle windows.",
    "date": "2026-07-23",
    "id": 1784785511,
    "type": "error"
});