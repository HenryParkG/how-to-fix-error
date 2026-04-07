window.onPostDataLoaded({
    "title": "Fixing eBPF Map Race Conditions in Multi-Core Environments",
    "slug": "mitigating-ebpf-map-race-conditions",
    "language": "Go",
    "code": "Race Condition",
    "tags": [
        "Go",
        "Backend",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In high-performance packet processing, eBPF programs often maintain state across packets using maps. When running on multi-core systems, a standard <code>BPF_MAP_TYPE_HASH</code> or <code>BPF_MAP_TYPE_ARRAY</code> becomes a shared resource. If multiple CPU cores attempt to read, increment, and write back a value simultaneously (e.g., a packet counter), the updates are not atomic, leading to lost updates and inconsistent telemetry.</p>",
    "root_cause": "Non-atomic read-modify-write cycles on shared BPF maps when accessed by multiple CPU cores concurrently.",
    "bad_code": "struct datarec *value = bpf_map_lookup_elem(&pkt_count_map, &key);\nif (value) {\n    // Race condition: Multiple cores read the same value before incrementing\n    value->packets++; \n}",
    "solution_desc": "Architecturally shift to using BPF_MAP_TYPE_PERCPU_HASH. This creates a separate instance of the map for each CPU core, eliminating contention. Alternatively, use __sync_fetch_and_add() for atomic operations on shared maps if memory overhead is a concern.",
    "good_code": "struct datarec *value = bpf_map_lookup_elem(&pkt_count_map, &key);\nif (value) {\n    // Atomic increment ensures memory consistency across cores\n    __sync_fetch_and_add(&value->packets, 1);\n}",
    "verification": "Use 'bpftool map dump' while generating high-volume traffic to ensure counter totals match packet generator stats.",
    "date": "2026-04-07",
    "id": 1775556087,
    "type": "error"
});