window.onPostDataLoaded({
    "title": "Fixing eBPF Tail Call Stack Overflow in XDP Pipelines",
    "slug": "fix-ebpf-tail-call-stack-overflow-xdp",
    "language": "Go",
    "code": "BPF_STACK_LIMIT_EXCEEDED",
    "tags": [
        "Go",
        "Infra",
        "Networking",
        "Error Fix"
    ],
    "analysis": "<p>When chaining multiple eBPF programs using tail calls in high-throughput XDP pipelines, developers often encounter a 'Stack limit exceeded' error or a verifier rejection. In eBPF, each program is limited to a 512-byte stack. While tail calls are designed to replace the current program's stack frame with the target's, cumulative stack usage or deep nesting can trigger safety checks in the Linux kernel JIT compiler.</p><p>This is particularly problematic in complex packet processors (e.g., Load Balancers) where each stage (parsing, routing, filtering) declares its own local variables on the stack.</p>",
    "root_cause": "Each tail call in a chain might not fully release the stack memory of the caller in older kernels or when specific compiler optimizations prevent the jump from being a pure tail-call, leading to stack overflow across program boundaries.",
    "bad_code": "SEC(\"xdp\")\nint xdp_processor(struct xdp_md *ctx) {\n    struct hdr_metadata meta = {0};\n    char buffer[256]; // Heavy stack usage\n    // ... processing logic ...\n    bpf_tail_call(ctx, &jmp_table, NEXT_PROG);\n    return XDP_PASS;\n}",
    "solution_desc": "Utilize a Per-CPU Array Map as a 'scratch buffer' to store large data structures instead of the stack. This keeps stack usage minimal (just a pointer) across tail calls.",
    "good_code": "struct { \n    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);\n    __uint(max_entries, 1);\n    __type(key, uint32_t);\n    __type(value, struct hdr_metadata);\n} scratch_map SEC(\".maps\");\n\nSEC(\"xdp\")\nint xdp_processor(struct xdp_md *ctx) {\n    uint32_t key = 0;\n    struct hdr_metadata *meta = bpf_map_lookup_elem(&scratch_map, &key);\n    if (!meta) return XDP_ABORTED;\n    // Use meta-> instead of stack local variables\n    bpf_tail_call(ctx, &jmp_table, NEXT_PROG);\n    return XDP_PASS;\n}",
    "verification": "Run 'bpftool prog load' and check 'ulimit -l' to ensure memory lock limits are sufficient; verify the program passes the BPF Verifier without 'combined stack size' errors.",
    "date": "2026-02-21",
    "id": 1771647833,
    "type": "error"
});