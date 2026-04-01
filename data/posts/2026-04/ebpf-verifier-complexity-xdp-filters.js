window.onPostDataLoaded({
    "title": "Fix eBPF Verifier Complexity in XDP Filters",
    "slug": "ebpf-verifier-complexity-xdp-filters",
    "language": "Go",
    "code": "BPF_VERIFIER_ERR",
    "tags": [
        "Go",
        "Networking",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>When developing high-throughput XDP (eXpress Data Path) programs, developers often encounter the 'BPF Verifier Complexity Limit'. The Linux kernel verifier simulates all possible execution paths to ensure safety. In complex packet filters\u2014especially those involving deep packet inspection or multiple header lookups\u2014the number of instructions processed by the verifier can exceed the 1-million instruction limit (or the complexity state limit), causing the program to fail to load even if the code is logically sound.</p>",
    "root_cause": "The verifier reaches the maximum complexity limit due to unrolled loops, excessive conditional branching, or insufficient state pruning in the kernel's verification engine.",
    "bad_code": "/* Excessive unrolling or complex branching */\n#pragma unroll\nfor (int i = 0; i < MAX_HEADERS; i++) {\n    if (data + offset > data_end) return XDP_DROP;\n    // Complex nested logic here\n    struct header *h = data + offset;\n    if (h->type == TYPE_A) { /* ... */ }\n    else if (h->type == TYPE_B) { /* ... */ }\n    offset += sizeof(struct header);\n}",
    "solution_desc": "Utilize bounded loops supported in modern kernels (5.17+) or break down the logic using Tail Calls. Tail calls allow one BPF program to call another, effectively resetting the verifier's complexity budget for each segment of the processing pipeline.",
    "good_code": "/* Using Tail Calls to split complexity */\nSEC(\"xdp\")\nint xdp_entry(struct xdp_md *ctx) {\n    // Initial parsing\n    bpf_tail_call(ctx, &jmp_table, NEXT_STAGE_ID);\n    return XDP_PASS;\n}\n\nSEC(\"xdp/next_stage\")\nint xdp_stage_2(struct xdp_md *ctx) {\n    // Continued complex logic with fresh verifier budget\n    return XDP_PASS;\n}",
    "verification": "Check the verifier output using 'bpftool prog load' and verify that 'insns_processed' is distributed across tail-called programs.",
    "date": "2026-04-01",
    "id": 1775037821,
    "type": "error"
});