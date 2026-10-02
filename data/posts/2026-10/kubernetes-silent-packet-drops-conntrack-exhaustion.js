window.onPostDataLoaded({
    "title": "Fix Silent Packet Drops: Kube Conntrack Table Exhaustion",
    "slug": "kubernetes-silent-packet-drops-conntrack-exhaustion",
    "language": "Kubernetes",
    "code": "NF_CONNTRACK_DROP",
    "tags": [
        "Kubernetes",
        "Linux",
        "Docker",
        "DevOps",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput Kubernetes clusters, services communicating over iptables-based or IPVS-based kube-proxy rely heavily on Netfilter's connection tracking subsystem (<code>nf_conntrack</code>). When connection turnover spikes\u2014such as during microservice bursts, HTTP/1.0 connections lacking keep-alives, or unthrottled DNS queries\u2014the conntrack hash table fills up. Once <code>nf_conntrack_max</code> is reached, the Linux kernel drops incoming packets immediately without sending TCP RST or ICMP Destination Unreachable frames.</p><p>This results in silent network timeouts, sporadic 502/504 gateway errors, and sudden P99 latency anomalies. Because drops occur at the Netfilter layer inside the kernel, standard container network interfaces (CNI) and application logs show no explicit connection reset, obscuring the root cause unless kernel ring buffers and socket diagnostics are monitored.</p>",
    "root_cause": "The kernel parameter net.netfilter.nf_conntrack_max is set too low for the cluster's connection rate, or conntrack entries linger too long in TIME_WAIT/CLOSE_WAIT states, causing nf_conntrack_alloc() to fail and silently drop packets via the NF_DROP verdict.",
    "bad_code": "# Default /etc/sysctl.conf on node with high connection churn\nnet.netfilter.nf_conntrack_max = 262144\nnet.netfilter.nf_conntrack_tcp_timeout_time_wait = 120\nnet.netfilter.nf_conntrack_tcp_timeout_close_wait = 60\n\n# Application missing keep-alive headers\ncurl -s -H \"Connection: close\" http://microservice.internal/api/v1/event",
    "solution_desc": "Scale nf_conntrack_max proportionally to the available system memory (RAM in GB * 16384). Proportionally adjust nf_conntrack_buckets to maintain a low hash collision bucket length (target ~1-2 entries per bucket). Reduce TCP timeout windows for TIME_WAIT and CLOSE_WAIT, tune kube-proxy conntrack allocation thresholds, and enforce HTTP keep-alive pooling in microservices.",
    "good_code": "# Tuned /etc/sysctl.d/99-kubernetes-conntrack.conf\nnet.netfilter.nf_conntrack_max = 1048576\nnet.netfilter.nf_conntrack_buckets = 262144\nnet.netfilter.nf_conntrack_tcp_timeout_time_wait = 30\nnet.netfilter.nf_conntrack_tcp_timeout_close_wait = 15\nnet.netfilter.nf_conntrack_tcp_timeout_established = 43200\n\n# Configure kube-proxy conntrack arguments in kube-proxy-config.yaml\nconntrack:\n  maxPerCore: 65536\n  min: 1048576\n  tcpCloseWaitTimeout: 15s\n  tcpEstablishedTimeout: 12h",
    "verification": "Check dropped packets with `conntrack -S` (verify `drop` counter remains 0) and monitor `dmesg -T | grep 'nf_conntrack: table full'`. In Prometheus, alert when `node_nf_conntrack_entries / node_nf_conntrack_entries_limit > 0.8`.",
    "date": "2026-10-02",
    "id": 1790910693,
    "type": "error"
});