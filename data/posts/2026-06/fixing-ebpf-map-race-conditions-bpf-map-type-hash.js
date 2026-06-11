window.onPostDataLoaded({
    "title": "Fixing eBPF Map Race Conditions under Multicore Load",
    "slug": "fixing-ebpf-map-race-conditions-bpf-map-type-hash",
    "language": "Go",
    "code": "Data Race",
    "tags": [
        "Go",
        "eBPF",
        "Linux",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>When operating in high-throughput multicore networking or tracing environments, eBPF maps of type <code>BPF_MAP_TYPE_HASH</code> are frequently used to store shared states, such as packet counters, session metrics, or rate-limiting tables. However, because eBPF programs run concurrently across multiple CPU cores, parallel read-modify-write sequences targeting the same map key create severe race conditions.</p><p>Specifically, calling <code>bpf_map_lookup_elem</code> returns a direct pointer to the map value. If multiple CPU cores concurrently retrieve this pointer, modify the dereferenced structure, and write back, updates are lost (lost update anomaly). This results in highly inaccurate telemetry and corrupted states.</p>",
    "root_cause": "The helper function bpf_map_lookup_elem returns a direct memory pointer to the value inside the map block. If multiple CPUs perform a non-atomic read-modify-write sequence on the fields of this dereferenced memory pointer, updates overlap and overwrite one another without synchronization.",
    "bad_code": "struct val_t {\n    __u64 counter;\n};\n\nstruct {\n    __uint(type, BPF_MAP_TYPE_HASH);\n    __uint(max_entries, 1024);\n    __type(key, __u32);\n    __type(value, struct val_t);\n} my_map SEC(\".maps\");\n\nSEC(\"xdp\")\nint xdp_prog(struct xdp_md *ctx) {\n    __u32 key = 1;\n    struct val_t *val = bpf_map_lookup_elem(&my_map, &key);\n    if (val) {\n        // RACE CONDITION: Direct modification of shared pointer\n        val->counter++; \n    }\n    return XDP_PASS;\n}",
    "solution_desc": "To guarantee concurrency safety under high multicore load, use either atomic operations (for basic scalar types) or bpf_spin_lock (for multi-field struct updates). A bpf_spin_lock can be embedded directly within the map value structure, allowing the eBPF verifier to statically ensure that the locked region is safely locked and unlocked before returning from the program context.",
    "good_code": "struct val_t {\n    struct bpf_spin_lock lock;\n    __u64 counter;\n};\n\nstruct {\n    __uint(type, BPF_MAP_TYPE_HASH);\n    __uint(max_entries, 1024);\n    __type(key, __u32);\n    __type(value, struct val_t);\n} my_map SEC(\".maps\");\n\nSEC(\"xdp\")\nint xdp_prog(struct xdp_md *ctx) {\n    __u32 key = 1;\n    struct val_t *val = bpf_map_lookup_elem(&my_map, &key);\n    if (val) {\n        bpf_spin_lock(&val->lock);\n        val->counter++;\n        bpf_spin_unlock(&val->lock);\n    } else {\n        struct val_t zero = { .counter = 1 };\n        bpf_map_update_elem(&my_map, &key, &zero, BPF_NOEXIST);\n    }\n    return XDP_PASS;\n}",
    "verification": "Compile the code using clang -target bpf and load it using the Cilium ebpf Go package. Run a multithreaded traffic generator (e.g., wrk or pktgen) over the interface, and dump the map statistics using `bpftool map dump name my_map`. Verify that the exact total packet count perfectly matches the aggregate traffic packets received, showing zero lost increments.",
    "date": "2026-06-11",
    "id": 1781145861,
    "type": "error"
});