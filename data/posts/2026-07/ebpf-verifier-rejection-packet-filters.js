window.onPostDataLoaded({
    "title": "Resolving eBPF Verifier Packet Filter Rejections",
    "slug": "ebpf-verifier-rejection-packet-filters",
    "language": "Go",
    "code": "VerifierError",
    "tags": [
        "Go",
        "Kubernetes",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>When loading complex eBPF programs for packet filtering (such as TC or XDP programs), the eBPF verifier often rejects bytecode with errors like <code>invalid access to packet</code> or <code>infinite loop detected</code>. The kernel verifier performs static analysis to guarantee that the eBPF program cannot crash, access illegal memory, or hang the kernel. Because the packet length is dynamic, the verifier cannot guarantee at compile time that reading an offset (e.g., parsing an inner TCP header) is safe unless the program explicitly proves that the offset lies within the bounds of the packet data buffers.</p>",
    "root_cause": "The root cause is the failure to perform explicit boundary checks against the packet's end pointer (data_end) before dereferencing packet fields, combined with the compiler unrolling loops in a way that exceeds the verifier's maximum instruction limit.",
    "bad_code": "unsigned long long parse_packet(struct __sk_buff *skb) {\n    void *data = (void *)(long)skb->data;\n    void *data_end = (void *)(long)skb->data_end;\n    struct ethhdr *eth = data;\n\n    // BUG: Dereferencing eth without verifying if eth + 1 fits in the packet size\n    struct iphdr *ip = (void *)(eth + 1);\n    if (ip->protocol == IPPROTO_TCP) {\n        struct tcphdr *tcp = (void *)(ip + 1);\n        return tcp->dest;\n    }\n    return 0;\n}",
    "solution_desc": "To fix this, we must insert explicit boundary checks before every pointer dereference. The verifier tracks register states; if we compare the computed offset pointer to the packet's data_end pointer, the verifier registers that the access within that range is safe. Additionally, use inline pragmas to limit instruction explosion.",
    "good_code": "unsigned long long parse_packet(struct __sk_buff *skb) {\n    void *data = (void *)(long)skb->data;\n    void *data_end = (void *)(long)skb->data_end;\n\n    struct ethhdr *eth = data;\n    if ((void *)(eth + 1) > data_end) {\n        return 0; // Return safe drop/pass\n    }\n\n    struct iphdr *ip = (void *)(eth + 1);\n    if ((void *)(ip + 1) > data_end) {\n        return 0;\n    }\n\n    if (ip->protocol == IPPROTO_TCP) {\n        struct tcphdr *tcp = (void *)(ip + 1);\n        if ((void *)(tcp + 1) > data_end) {\n            return 0;\n        }\n        return tcp->dest;\n    }\n    return 0;\n}",
    "verification": "Compile the eBPF code using clang with option `-O2 -target bpf` and attempt to load it using `bpftool prog load` or standard Go packages like `cilium/ebpf`. The loader will complete without emitting verifier instruction traces or exit code errors.",
    "date": "2026-07-03",
    "id": 1783044090,
    "type": "error"
});