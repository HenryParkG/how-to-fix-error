window.onPostDataLoaded({
    "title": "Resolving eBPF Verifier Complexity Limits in XDP",
    "slug": "ebpf-verifier-complexity-xdp",
    "language": "Rust",
    "code": "BPF_VERIFIER_ERR_LIMIT_REACHED",
    "tags": [
        "Rust",
        "Kubernetes",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When developing high-performance XDP (eXpress Data Path) programs, developers often encounter the 'complexity limit exceeded' error. The eBPF verifier performs a static analysis to ensure memory safety and termination. It explores all possible execution paths, but it has a hard limit on the number of instructions (1 million) and state complexity. In dense networking logic with many conditional branches or deep loops, the verifier state explosion prevents the program from loading, even if the code is logically sound.</p>",
    "root_cause": "The verifier exceeds the maximum complexity tracking state (BFP_COMPLEXITY_LIMIT_STATES) due to too many conditional branches or unrolled loops that create a combinatorial explosion of execution paths.",
    "bad_code": "SEC(\"xdp\")\nint xdp_prog(struct xdp_md *ctx) {\n    void *data = (void *)(long)ctx->data;\n    void *data_end = (void *)(long)ctx->data_end;\n    // Too many nested checks and huge unrolled loops\n    #pragma clang loop unroll(full)\n    for (int i = 0; i < 256; i++) {\n        if (data + i + 1 > data_end) break;\n        if (((char*)data)[i] == 0xFF) { /* complex logic */ }\n    }\n    return XDP_PASS;\n}",
    "solution_desc": "Refactor the program to use tail calls or BPF sub-programs. Tail calls allow you to transition from one BPF program to another, effectively resetting the verifier's complexity budget for the next segment. Alternatively, use bounded loops (available in newer kernels) or move shared state into BPF maps to reduce the number of live registers the verifier must track.",
    "good_code": "struct { \n    __uint(type, BPF_MAP_TYPE_PROG_ARRAY); \n    __uint(max_entries, 1); \n    __type(key, u32); \n    __type(value, u32); \n} jmp_table SEC(\".maps\");\n\nSEC(\"xdp\")\nint xdp_prog_main(struct xdp_md *ctx) {\n    // logic segment 1\n    bpf_tail_call(ctx, &jmp_table, 0);\n    return XDP_PASS; // Fallback\n}\n\nSEC(\"xdp/1\")\nint xdp_prog_part2(struct xdp_md *ctx) {\n    // logic segment 2 (Complexity budget reset)\n    return XDP_PASS;\n}",
    "verification": "Run 'bpftool prog load' and check 'verifier_stats'. Verify that 'processed_insn' stays below the limit and 'complexity' metrics are distributed across tail calls.",
    "date": "2026-03-15",
    "id": 1773557117,
    "type": "error"
});