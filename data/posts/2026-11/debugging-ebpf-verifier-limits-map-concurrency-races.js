window.onPostDataLoaded({
    "title": "Debugging eBPF Verifier Limits & Map Race Conditions",
    "slug": "debugging-ebpf-verifier-limits-map-concurrency-races",
    "language": "Rust",
    "code": "BPF_VERIFIER_E2BIG",
    "tags": [
        "eBPF",
        "Linux",
        "Kernel",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>When authoring complex eBPF programs for low-overhead packet processing or kernel observability, developers frequently encounter verifier rejection errors such as <code>BPF_COMPLEXITY_LIMIT_INSNS</code> (instruction limit exceeded, traditionally 1M verified states) and race conditions across concurrent CPU cores modifying shared <code>BPF_MAP_TYPE_HASH</code> tables.</p><p>The Linux kernel eBPF verifier uses abstract interpretation to traverse all execution branches. Loops that lack explicit upper bounds, variable-length memory access, and unbounded pointer arithmetic trigger state explosions where the verifier exhausts its instruction exploration budget. Simultaneously, naive reads and writes to shared map elements across multiple CPUs result in data corruption because standard BPF hash maps do not guarantee atomic read-modify-write operations across cores.</p>",
    "root_cause": "The verifier rejects the bytecode because dynamic looping prevents path convergence within the complexity threshold. Concurrency races stem from non-atomic map lookups and writes without kernel spinlocks or per-CPU data isolation.",
    "bad_code": "SEC(\"xdp\")\nint xdp_bad_counter(struct xdp_md *ctx) {\n    void *data = (void *)(long)ctx->data;\n    void *data_end = (void *)(long)ctx->data_end;\n    __u32 key = 0;\n    \n    // Unbounded or dynamic loop causes verifier complexity explosion\n    for (int i = 0; i < ctx->data_meta; i++) {\n        if (data + i + 1 > data_end) break;\n    }\n\n    // Race condition: unsynchronized read-modify-write on shared map\n    __u64 *val = bpf_map_lookup_elem(&pkt_stats, &key);\n    if (val) {\n        *val += 1; // Lost updates across concurrent CPU executions\n    }\n    return XDP_PASS;\n}",
    "solution_desc": "Bound all loops with `#pragma unroll` or compile-time constants so the verifier can perform bounded path pruning. For map concurrency, use `bpf_spin_lock` on struct values containing a `struct bpf_spin_lock`, migrate to `BPF_MAP_TYPE_PERCPU_HASH`, or utilize `__sync_fetch_and_add` atomic builtins for scalar counters.",
    "good_code": "struct val_t {\n    struct bpf_spin_lock lock;\n    __u64 count;\n};\n\nstruct {\n    __uint(type, BPF_MAP_TYPE_HASH);\n    __uint(max_entries, 1024);\n    __type(key, __u32);\n    __type(value, struct val_t);\n} pkt_stats SEC(\".maps\");\n\nSEC(\"xdp\")\nint xdp_good_counter(struct xdp_md *ctx) {\n    __u32 key = 0;\n    struct val_t *val = bpf_map_lookup_elem(&pkt_stats, &key);\n    if (!val) return XDP_PASS;\n\n    // Spinlock ensures synchronized map update across all CPUs\n    bpf_spin_lock(&val->lock);\n    val->count++;\n    bpf_spin_unlock(&val->lock);\n\n    return XDP_PASS;\n}",
    "verification": "Compile with `clang -O2 -target bpf` and verify using `bpftool prog load` with `--debug` flag. Confirm verifier instruction count stays well below the 1,000,000 limit, and run concurrent stress tests via `iperf3` while checking counter integrity.",
    "date": "2026-11-11",
    "id": 1794368966,
    "type": "error"
});