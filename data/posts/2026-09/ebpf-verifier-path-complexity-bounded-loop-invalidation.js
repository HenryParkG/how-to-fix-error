window.onPostDataLoaded({
    "title": "Resolving eBPF Verifier Complexity Explosions",
    "slug": "ebpf-verifier-path-complexity-bounded-loop-invalidation",
    "language": "Rust",
    "code": "BPF_VERIFIER_ERR",
    "tags": [
        "Rust",
        "Linux",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>The Linux kernel eBPF verifier performs static analysis via abstract interpretation to validate memory safety and guarantee termination. When analyzing bounded loops or multi-branch code paths involving packet parsing or variable-length map lookups, the verifier tracks scalar register bounds across every permutation of branch conditions.</p><p>When scalar bounds cannot be strictly proven equal across divergent execution paths, the verifier cannot prune equivalent states. This triggers an exponential state explosion that exceeds <code>BPF_COMPLEXITY_LIMIT_INSNS</code> (1 million analyzed instructions on modern kernels) or leads to bounded loop invalidation (e.g., <code>loop iteration limit reached</code> or <code>R0 min value is negative</code>).</p>",
    "root_cause": "The verifier fails to prune states because scalar variable offsets lose precision across loop iterations, preventing state convergence and causing the verifier to treat deterministic iteration bounds as unbounded paths.",
    "bad_code": "int parse_headers(struct __sk_buff *skb) {\n    void *data = (void *)(long)skb->data;\n    void *data_end = (void *)(long)skb->data_end;\n    struct hdr_t *hdr = data;\n    \n    // Verifier cannot prove upper bound when step is dynamic or imprecise\n    #pragma unroll 16\n    for (int i = 0; i < 16; i++) {\n        if ((void *)(hdr + 1) > data_end)\n            break;\n        if (hdr->next_proto == 0)\n            return 0;\n        // Variable advance causes unbounded register divergence\n        hdr = (void *)hdr + (hdr->len * 4);\n    }\n    return 1;\n}",
    "solution_desc": "Constrain iteration using the modern `bpf_loop` helper (kernel 5.17+) or explicitly clamp variable increments using bitwise AND masks. For bounded loops, emit inline assembly barriers (`asm volatile(\"\" : \"+r\"(reg))`) to prevent compiler optimizations that obfuscate induction variables from the verifier's state pruning engine.",
    "good_code": "static long parse_hdr_callback(__u32 index, void *ctx) {\n    struct parse_ctx *c = ctx;\n    if ((void *)(c->hdr + 1) > c->data_end)\n        return 1; // Terminate loop early\n    \n    // Force verification mask: limit variable offset to strict upper bound\n    __u32 step = (c->hdr->len & 0x0F) * 4;\n    if (step < sizeof(struct hdr_t))\n        return 1;\n        \n    c->hdr = (void *)c->hdr + step;\n    return 0; // Continue\n}\n\nint parse_headers(struct __sk_buff *skb) {\n    struct parse_ctx ctx = {\n        .hdr = (void *)(long)skb->data,\n        .data_end = (void *)(long)skb->data_end\n    };\n    // Kernel 5.17+ verified bounded iteration helper\n    bpf_loop(16, parse_hdr_callback, &ctx, 0);\n    return 1;\n}",
    "verification": "Compile using `clang -O2 -target bpf` and verify via `bpftool prog load` with verifier log level 2 (`log_level 2`). Confirm that `processed X insns` decreases significantly and no `BPF_COMPLEXITY_LIMIT_INSNS` error is emitted.",
    "date": "2026-09-27",
    "id": 1790519119,
    "type": "error"
});