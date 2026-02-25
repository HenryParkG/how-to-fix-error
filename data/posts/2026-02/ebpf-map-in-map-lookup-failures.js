window.onPostDataLoaded({
    "title": "Resolving eBPF Map-in-Map Lookup Failures",
    "slug": "ebpf-map-in-map-lookup-failures",
    "language": "Go",
    "code": "ENOENT / EFAULT",
    "tags": [
        "Go",
        "eBPF",
        "Linux",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In high-concurrency environments, eBPF programs utilizing <code>BPF_MAP_TYPE_ARRAY_OF_MAPS</code> or <code>BPF_MAP_TYPE_HASH_OF_MAPS</code> often encounter lookup failures where the inner map pointer returned is NULL, despite the outer map being populated. This typically occurs because of the race condition between the user-space control plane updating the outer map and the kernel-space probe executing the lookup. When tracepoints fire at million-event-per-second scales, the RCU (Read-Copy-Update) mechanism used by eBPF maps might not have synchronized the inner map FD to the outer map slot before the lookup occurs, or the inner map is being prematurely reallocated.</p>",
    "root_cause": "The lookup failure is often caused by a race condition where the inner map's file descriptor is closed in user-space before the kernel-side RCU grace period completes, or the inner map is not properly initialized with the correct 'inner_map_idx' during outer map creation.",
    "bad_code": "struct bpf_map_def SEC(\"maps\") outer_map = {\n    .type = BPF_MAP_TYPE_ARRAY_OF_MAPS,\n    .key_size = sizeof(__u32),\n    .value_size = sizeof(__u32),\n    .max_entries = 1024,\n};\n\n// Inside BPF program\nstruct bpf_map *inner_map = bpf_map_lookup_elem(&outer_map, &key);\n// No NULL check or handling of map-in-map logic\nval = bpf_map_lookup_elem(inner_map, &inner_key);",
    "solution_desc": "Ensure that the inner map prototype is correctly defined and that the user-space loader keeps the inner map FDs alive until the outer map is fully populated. Furthermore, always implement a NULL check for the inner map pointer and utilize `bpf_map_push_elem` or atomic updates to ensure visibility across CPU cores.",
    "good_code": "SEC(\"maps\")\nstruct {\n    __uint(type, BPF_MAP_TYPE_ARRAY_OF_MAPS);\n    __uint(max_entries, 1024);\n    __type(key, __u32);\n    __type(value, __u32);\n    __array(values, struct {\n        __uint(type, BPF_MAP_TYPE_HASH);\n        __uint(max_entries, 64);\n        __type(key, __u32);\n        __type(value, __u64);\n    });\n} outer_map SEC(\".maps\");\n\n// Safe lookup logic\nvoid *inner_map = bpf_map_lookup_elem(&outer_map, &key);\nif (!inner_map) return 0;\nval = bpf_map_lookup_elem(inner_map, &inner_key);",
    "verification": "Use 'bpftool map dump' to verify outer map contents and run 'strace' on the loader to ensure map FDs are not closed prematurely.",
    "date": "2026-02-25",
    "id": 1772002483,
    "type": "error"
});