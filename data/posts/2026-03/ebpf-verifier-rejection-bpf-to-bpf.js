window.onPostDataLoaded({
    "title": "Debugging eBPF Verifier Rejection in BPF-to-BPF Calls",
    "slug": "ebpf-verifier-rejection-bpf-to-bpf",
    "language": "Go",
    "code": "VerifierError",
    "tags": [
        "Go",
        "Rust",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When implementing complex eBPF programs, modularity via BPF-to-BPF calls is preferred over massive inlined functions. However, the BPF verifier enforces strict limits on stack depth (512 bytes total across the call chain) and instruction complexity. Developers often encounter 'back-edge' errors or 'invalid stack access' when the verifier fails to track register states across function boundaries.</p><p>This is particularly common when passing pointers to stack-allocated structures to subprograms. The verifier must prove that the subprogram does not access memory out of bounds, but state pruning in the verifier can sometimes lead to false negatives in complex control flow graphs.</p>",
    "root_cause": "The verifier rejects the program because the cumulative stack depth of the call chain exceeds 512 bytes, or the subprogram arguments use imprecise register types that prevent the verifier from validating memory safety.",
    "bad_code": "// Subprogram with large local buffer\nstatic __noinline int process_data(struct __sk_buff *skb) {\n    char buf[400]; // Large stack allocation\n    // ... logic\n    return 0;\n}\n\nSEC(\"classifier\")\nint entry(struct __sk_buff *skb) {\n    char parent_buf[200]; // Total stack: 400 + 200 = 600 (> 512)\n    return process_data(skb);\n}",
    "solution_desc": "Architecturally, resolve this by using BPF Per-CPU Array maps as 'scratchpad' memory instead of stack allocation for large structures. Additionally, ensure subprograms are marked with __noinline to utilize the BPF-to-BPF call mechanism, but keep the call depth shallow to stay within the 8-call limit.",
    "good_code": "struct scratchpad_map {\n    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);\n    __uint(max_entries, 1);\n    __type(key, u32);\n    __type(value, char[400]);\n} scratch_map SEC(\".maps\");\n\nstatic __noinline int process_data(struct __sk_buff *skb) {\n    u32 key = 0;\n    char *buf = bpf_map_lookup_elem(&scratch_map, &key);\n    if (!buf) return 0;\n    // ... use buf safely\n    return 0;\n}\n\nSEC(\"classifier\")\nint entry(struct __sk_buff *skb) {\n    return process_data(skb);\n}",
    "verification": "Run 'bpftool prog load' and check for 'processed N instructions' in the verifier log. Ensure no 'combined stack size' errors appear.",
    "date": "2026-03-06",
    "id": 1772759970,
    "type": "error"
});