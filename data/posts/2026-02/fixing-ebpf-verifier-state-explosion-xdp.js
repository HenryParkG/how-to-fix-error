window.onPostDataLoaded({
    "title": "Fixing eBPF Verifier State Explosion in Complex XDP Programs",
    "slug": "fixing-ebpf-verifier-state-explosion-xdp",
    "language": "C / eBPF",
    "code": "BPF_VERIFIER_ERR",
    "tags": [
        "Go",
        "Infra",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>When developing high-performance XDP programs, developers often encounter 'State Explosion' where the BPF verifier exhausts its complexity limit (1 million instructions) or state limit. This typically occurs because the verifier explores every possible branch combination to ensure safety. In complex packet parsing or multi-tenant filtering, the number of logical paths grows exponentially, leading the verifier to prune states inefficiently or reject the program entirely despite the logic being sound.</p>",
    "root_cause": "Excessive branching and deep function call chains cause the verifier's state-tracking engine to hit its limit before it can prove program termination and memory safety.",
    "bad_code": "for (int i = 0; i < MAX_HEADERS; i++) {\n    struct hdr *h = data + offset;\n    if (h + 1 > data_end) break;\n    if (h->type == TYPE_A) { /* complex logic */ }\n    else if (h->type == TYPE_B) { /* more complex logic */ }\n    // ... 10 more branches\n    offset += sizeof(struct hdr);\n}",
    "solution_desc": "Refactor the logic to use BPF tail calls to split the program into smaller, independently verified chunks, or use the `bpf_loop` helper (available in kernels 5.17+) to reduce the instruction count compared to manual loop unrolling.",
    "good_code": "static __always_inline int handle_hdr(struct xdp_md *ctx) {\n    // Specific logic for one header\n}\n\nSEC(\"xdp\")\nint xdp_prog(struct xdp_md *ctx) {\n    // Use tail calls to jump to specific logic handlers\n    bpf_tail_call(ctx, &jmp_table, hdr_type);\n    return XDP_PASS;\n}",
    "verification": "Run `bpftool prog load` and check the 'insns processed' count in the verifier log; it should be significantly lower than the 1M limit.",
    "date": "2026-02-22",
    "id": 1771752200,
    "type": "error"
});