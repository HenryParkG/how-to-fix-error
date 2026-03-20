window.onPostDataLoaded({
    "title": "Resolving eBPF Verifier Limits in XDP Tail Calls",
    "slug": "ebpf-verifier-complexity-xdp-tail-calls",
    "language": "Go",
    "code": "BPF_VERIFY_LIMIT",
    "tags": [
        "Go",
        "Infra",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>High-performance XDP programs often exceed the eBPF verifier's complexity limit (1 million instructions) when utilizing tail calls. The verifier performs a depth-first search of all execution paths. When complex logic precedes a <code>bpf_tail_call</code>, the state explosion causes the verifier to reject the program even if the logic is technically sound.</p>",
    "root_cause": "The verifier tracks register states across program boundaries; excessive branching or large loop unrolling before a tail call exhausts the complexity budget.",
    "bad_code": "SEC(\"xdp\")\nint xdp_prog(struct xdp_md *ctx) {\n    // Complex packet parsing logic\n    for (int i = 0; i < 64; i++) { \n        /* Excessive logic here */ \n    }\n    bpf_tail_call(ctx, &jmp_table, next_prog_idx);\n    return XDP_PASS;\n}",
    "solution_desc": "Refactor the program to minimize the register state tracked before the tail call. Move heavy computation into the tail-called programs rather than the dispatcher, and use tail calls as early as possible to 'reset' the complexity counter for the next program segment.",
    "good_code": "SEC(\"xdp\")\nint xdp_prog(struct xdp_md *ctx) {\n    __u32 idx = lookup_protocol(ctx);\n    // Minimal logic before jumping\n    bpf_tail_call(ctx, &jmp_table, idx);\n    return XDP_PASS;\n}\n\nSEC(\"xdp/logic\")\nint xdp_logic_child(struct xdp_md *ctx) {\n    // Heavy processing here in a separate verifier pass\n    return XDP_DROP;\n}",
    "verification": "Run 'bpftool prog load' and check the 'insns processed' count in the verifier log to ensure it stays below the 1M limit.",
    "date": "2026-03-20",
    "id": 1773969352,
    "type": "error"
});