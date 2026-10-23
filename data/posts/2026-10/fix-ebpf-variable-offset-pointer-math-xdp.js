window.onPostDataLoaded({
    "title": "Fix eBPF Variable-Offset Pointer Math in XDP",
    "slug": "fix-ebpf-variable-offset-pointer-math-xdp",
    "language": "C",
    "code": "R2 variable-offset dereference disallowed",
    "tags": [
        "eBPF",
        "XDP",
        "Linux",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>When developing high-performance packet parsers in eBPF with XDP (e.g., reading variable-length IP options or dynamically parsing TCP header options), adding a non-constant runtime offset to a packet pointer frequently causes the Linux BPF verifier to reject the program.</p><p>The verifier uses abstract interpretation to verify memory safety. When an untrusted variable offset is added to a <code>PTR_TO_PACKET</code> register, the verifier assigns minimum and maximum variable scalar bounds. If the scalar bounds are not rigorously clamped or if bounds checks are performed before offset calculation, the pointer becomes untracked or exceeds packet limits, resulting in verifier errors like <code>variable-offset packet access disallowed</code> or <code>invalid access to packet, misaligned or unbounded</code>.</p>",
    "root_cause": "The BPF verifier enforces strict bounds verification: adding a variable scalar offset to a packet pointer produces a variable-offset packet pointer whose range must be statically proven to remain between packet start and packet end. If the offset register has an unbounded upper range (e.g., missing bitwise masks or invalid range checks), or if arithmetic is evaluated out of order, the verifier rejects any subsequent pointer dereferences.",
    "bad_code": "SEC(\"xdp\")\nint xdp_parse_bad(struct xdp_md *ctx) {\n    void *data = (void *)(long)ctx->data;\n    void *data_end = (void *)(long)ctx->data_end;\n    struct iphdr *iph = data + sizeof(struct ethhdr);\n\n    if ((void *)(iph + 1) > data_end)\n        return XDP_PASS;\n\n    // Variable offset extracted from packet\n    __u32 ihl = iph->ihl * 4;\n    \n    // Verifier loses bound context: pointer math with unconstrained scalar\n    struct tcphdr *tcph = (void *)iph + ihl;\n    if ((void *)(tcph + 1) > data_end)\n        return XDP_PASS;\n\n    // Verifier rejection occurs here during dereference\n    __u16 dest_port = tcph->dest;\n    return XDP_PASS;\n}",
    "solution_desc": "Constrain the variable scalar register using bitwise masking and explicit conditional boundaries before pointer arithmetic. Explicitly bound the variable to a known valid interval (e.g., IP header length between 20 and 60 bytes) and place safety barriers or explicit data_end checks directly against the offset pointer prior to dereferencing.",
    "good_code": "SEC(\"xdp\")\nint xdp_parse_good(struct xdp_md *ctx) {\n    void *data = (void *)(long)ctx->data;\n    void *data_end = (void *)(long)ctx->data_end;\n    struct iphdr *iph = data + sizeof(struct ethhdr);\n\n    if ((void *)(iph + 1) > data_end)\n        return XDP_PASS;\n\n    // 1. Bitwise clamp the variable offset to satisfy verifier scalar ranges\n    __u32 ihl = (iph->ihl & 0x0F) * 4;\n    \n    // 2. Strict bounds assertion\n    if (ihl < sizeof(struct iphdr) || ihl > 60)\n        return XDP_DROP;\n\n    // 3. Cast to byte pointer and re-verify against data_end after math\n    unsigned char *next_hdr = (unsigned char *)iph + ihl;\n    if ((void *)(next_hdr + sizeof(struct tcphdr)) > data_end)\n        return XDP_PASS;\n\n    struct tcphdr *tcph = (struct tcphdr *)next_hdr;\n    __u16 dest_port = tcph->dest;\n    return XDP_PASS;\n}",
    "verification": "Compile with clang using `-target bpf -O2` and load the program using `bpftool prog load` or `xdp-loader`. Inspect verifier logs with `bpftool prog load ... verifier_log_level 2` to verify that registers maintain precise scalar min/max values and packet pointer bounds are validated.",
    "date": "2026-10-23",
    "id": 1792743236,
    "type": "error"
});