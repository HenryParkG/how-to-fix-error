window.onPostDataLoaded({
    "title": "Fixing eBPF Verifier Complexity in XDP Programs",
    "slug": "fixing-ebpf-verifier-complexity-xdp",
    "language": "C / Go",
    "code": "VerifierLimitReached",
    "tags": [
        "Go",
        "Infra",
        "Networking",
        "Error Fix"
    ],
    "analysis": "<p>High-throughput XDP programs often fail during loading because they exceed the BPF verifier's complexity limit (historically 1 million instructions). The verifier performs a depth-first search of all possible execution paths. When using large loops or complex packet parsing logic, the state explosion causes the verifier to bail out to protect kernel stability.</p>",
    "root_cause": "The verifier reaches the instruction limit due to path explosion or excessive loop unrolling in the control flow graph.",
    "bad_code": "#define MAX_STEPS 128\n\nSEC(\"xdp\")\nint xdp_prog(struct xdp_md *ctx) {\n    // Large unrolled loop triggers complexity limits\n    #pragma unroll\n    for (int i = 0; i < MAX_STEPS; i++) {\n        if (parse_and_check(ctx, i)) return XDP_DROP;\n    }\n    return XDP_PASS;\n}",
    "solution_desc": "Refactor logic to use bounded loops (supported in newer kernels) or use 'bpf_loop' helpers. Additionally, move logic into sub-programs and use tail calls to reset the verifier's complexity budget for each segment.",
    "good_code": "static __attribute__((noinline))\nint handle_step(struct xdp_md *ctx, int i) {\n    return parse_and_check(ctx, i);\n}\n\nSEC(\"xdp\")\nint xdp_prog(struct xdp_md *ctx) {\n    // Using bpf_loop (Kernel 5.17+) to keep verifier complexity linear\n    bpf_loop(MAX_STEPS, handle_step, ctx, 0);\n    return XDP_PASS;\n}",
    "verification": "Run 'bpftool prog load' and check the 'verifier_stats' to ensure the 'insn_processed' count is well below the limit.",
    "date": "2026-03-09",
    "id": 1773039094,
    "type": "error"
});