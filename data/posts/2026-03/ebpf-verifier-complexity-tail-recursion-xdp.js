window.onPostDataLoaded({
    "title": "Fixing eBPF Verifier Complexity in Tail-Recursive XDP",
    "slug": "ebpf-verifier-complexity-tail-recursion-xdp",
    "language": "Go",
    "code": "VerifierError",
    "tags": [
        "eBPF",
        "XDP",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>The eBPF verifier performs a static analysis of the program to ensure memory safety and termination. When using tail calls (jumping from one eBPF program to another), the verifier tracks the cumulative complexity. If the path through multiple programs exceeds the 1-million-instruction limit or causes state explosion in the control flow graph, the program is rejected with a 'complexity limit reached' error.</p><p>This is common in high-performance networking where XDP programs are chained to handle different protocol layers. The verifier must explore every possible jump destination in the program array, leading to exponential state growth if the logic is not carefully bounded.</p>",
    "root_cause": "Exponential state growth in the verifier's path exploration due to deep tail-call chaining and lack of explicit bounds on loops within individual program segments.",
    "bad_code": "SEC(\"xdp\")\nint xdp_prog_main(struct xdp_md *ctx) {\n    int key = 0;\n    // Unbounded or complex logic before tail call\n    for (int i = 0; i < 256; i++) {\n        // ... complex processing ...\n    }\n    bpf_tail_call(ctx, &jmp_table, key);\n    return XDP_PASS;\n}",
    "solution_desc": "Refactor the program to reduce the per-program instruction count. Use 'bpf_loop' (available in newer kernels) or ensure loops are strictly bounded and small. More importantly, minimize the amount of context/stack data that needs to be tracked across tail calls by clearing registers or using shared maps for state preservation.",
    "good_code": "SEC(\"xdp\")\nint xdp_prog_main(struct xdp_md *ctx) {\n    // Use bounded loops and minimize local variables\n    #pragma unroll\n    for (int i = 0; i < 16; i++) {\n        // Simplified logic\n    }\n    // Ensure the tail call is the final action to prevent register spill tracking\n    bpf_tail_call(ctx, &jmp_table, 0);\n    return XDP_DROP;\n}",
    "verification": "Run 'bpftool prog load' and check the verifier log for 'insns analyzed' count; ensure it stays well below the 1,000,000 threshold.",
    "date": "2026-03-01",
    "id": 1772340539,
    "type": "error"
});