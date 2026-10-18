window.onPostDataLoaded({
    "title": "Fixing eBPF Verifier Complexity & Spill Failures",
    "slug": "fixing-ebpf-verifier-complexity-spill-failures",
    "language": "C / eBPF",
    "code": "BPF_VERIFIER_ERR",
    "tags": [
        "eBPF",
        "Linux",
        "Kernel",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>When compiling non-trivial eBPF programs, developers frequently encounter the dreaded <code>BPF program is too large</code> or verifier rejection errors. The Linux kernel's BPF verifier enforces strict computational limits: historically 4,096 instructions, and 1,000,000 verified states in modern kernels (Kernels 5.2+). The verifier performs static analysis via abstract interpretation, tracking register types, min/max value bounds, and stack memory slots.</p><p>A critical source of verifier path explosion is bounded loop unrolling combined with variable stack spills. When compiling loops with <code>#pragma unroll</code>, LLVM generates sequences that allocate stack slots for intermediate states. If an inner operation performs an indirect memory access with an unknown or loosely bounded register offset, the verifier loses track of register scalar ranges (precision loss). Consequently, the verifier cannot prune equivalent states and evaluates every permutation of the loop, exceeding the <code>BPF_COMPLEXITY_LIMIT_INSNS</code> threshold or triggering an invalid stack offset spill rejection.</p>",
    "root_cause": "State space combinatorial explosion triggered by full loop unrolling, paired with dynamic stack spills where pointer arithmetic or variable index lookups destroy verifier precision bounds.",
    "bad_code": "#include <linux/bpf.h>\n#include <bpf/bpf_helpers.h>\n\n#define MAX_ITEMS 64\n\nSEC(\"xdp\")\nint parse_payload(struct xdp_md *ctx) {\n    void *data = (void *)(long)ctx->data;\n    void *data_end = (void *)(long)ctx->data_end;\n    __u32 indices[MAX_ITEMS]; // Stack spill candidate (256 bytes on 512B stack)\n\n    // Fully unrolling large bounded loop causes state explosion\n    #pragma unroll\n    for (int i = 0; i < MAX_ITEMS; i++) {\n        __u32 *ptr = data + (i * sizeof(__u32));\n        if ((void *)(ptr + 1) > data_end)\n            break;\n        // Non-constant variable stack index forces verifier precision loss\n        indices[i] = *ptr;\n    }\n\n    return XDP_PASS;\n}",
    "solution_desc": "Mitigate verifier state exhaustion by: 1) Replacing full compile-time unrolling (`#pragma unroll`) with bounded loops (supported since Linux 5.3) or the `bpf_loop()` helper (Kernel 5.17+); 2) Constraining bounded loop indices with explicit bitwise masks; 3) Utilizing a BPF Per-CPU Array Map instead of the 512-byte BPF stack for large intermediate buffers to avoid stack register spilling.",
    "good_code": "#include <linux/bpf.h>\n#include <bpf/bpf_helpers.h>\n\nstruct {\n    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);\n    __type(key, __u32);\n    __type(value, __u32[64]);\n    __uint(max_entries, 1);\n} scratchpad SEC(\".maps\");\n\nstatic long process_element(__u32 index, void *ctx) {\n    // Callback executed via kernel-managed bpf_loop\n    // Keeps verifier complexity linear: O(1) loop validation\n    __u32 *accum = (__u32 *)ctx;\n    *accum += index;\n    return 0;\n}\n\nSEC(\"xdp\")\nint parse_payload(struct xdp_md *ctx) {\n    __u32 zero = 0;\n    __u32 *buf = bpf_map_lookup_elem(&scratchpad, &zero);\n    if (!buf)\n        return XDP_DROP;\n\n    __u32 total = 0;\n    // bpf_loop validates the callback once without expanding states\n    bpf_loop(64, process_element, &total, 0);\n\n    return XDP_PASS;\n}",
    "verification": "Compile with `clang -O2 -target bpf` and verify program loading using `bpftool prog load <prog.o> /sys/fs/bpf/test -d`. Monitor verifier log output to ensure `processed X insns` is well below 1,000,000 and stack depth stays below 512 bytes.",
    "date": "2026-10-18",
    "id": 1792308849,
    "type": "error"
});