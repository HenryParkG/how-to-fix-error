window.onPostDataLoaded({
    "title": "Fixing eBPF Verifier Path-Explosion in XDP Programs",
    "slug": "ebpf-verifier-path-explosion-xdp",
    "language": "Go",
    "code": "Verifier Rejection",
    "tags": [
        "Go",
        "Infra",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Path explosion in the eBPF verifier occurs when the program contains too many branching possibilities (if/else, switches, loops). The verifier attempts to explore every possible execution path to ensure memory safety. If the number of states to explore exceeds the kernel's limit (often 1 million instructions or a specific state complexity threshold), it rejects the program even if the logic is technically sound.</p>",
    "root_cause": "Deeply nested conditional logic combined with bounded loops that the verifier cannot efficiently prune, leading to exponential state growth.",
    "bad_code": "SEC(\"xdp\")\nint xdp_prog(struct xdp_md *ctx) {\n    void *data = (void *)(long)ctx->data;\n    void *data_end = (void *)(long)ctx->data_end;\n    // Complex nested logic causing path explosion\n    for (int i = 0; i < 64; i++) {\n        if (data + (i * 8) + 8 > data_end) break;\n        if (*(u64*)(data + i) == 0x1) { /* do A */ }\n        else if (*(u64*)(data + i) == 0x2) { /* do B */ }\n        // ... more branches ...\n    }\n    return XDP_PASS;\n}",
    "solution_desc": "Refactor the logic to use 'bpf_loop' (available in kernel 5.17+) or split the program into smaller tail calls to reset the verifier complexity counter. Alternatively, simplify the branching logic by using lookup tables or bitmasks.",
    "good_code": "#include <bpf/bpf_helpers.h>\n\nstatic int loop_fn(u32 index, void *ctx) {\n    // Logic moved here reduces the per-path complexity\n    return 0; \n}\n\nSEC(\"xdp\")\nint xdp_prog_fixed(struct xdp_md *ctx) {\n    bpf_loop(64, loop_fn, ctx, 0);\n    return XDP_PASS;\n}",
    "verification": "Run `bpftool prog load` and check if the verifier output shows 'processed N instructions' within the allowed limit without 'back-edge' or 'complexity' errors.",
    "date": "2026-04-14",
    "id": 1776143746,
    "type": "error"
});