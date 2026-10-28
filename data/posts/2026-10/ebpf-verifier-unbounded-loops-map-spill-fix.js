window.onPostDataLoaded({
    "title": "Fixing eBPF Unbounded Loops & Stack Spill Limits",
    "slug": "ebpf-verifier-unbounded-loops-map-spill-fix",
    "language": "C / Rust",
    "code": "BPF_VERIFIER_ERR_LOOP",
    "tags": [
        "Rust",
        "Kernel",
        "eBPF",
        "Linux",
        "Error Fix"
    ],
    "analysis": "<p>The Linux kernel eBPF verifier performs static abstract interpretation across all executable paths to ensure safety, memory isolation, and bounded termination. When loops have variable or unresolved trip counts, the verifier rejects the bytecode with back-edge detection errors or exceeds the maximum instruction complexity threshold (1,000,000 instructions in modern kernels). Furthermore, attempting to unroll complex loops or store large local struct instances causes register spills onto the strictly limited 512-byte eBPF stack, resulting in invalid stack access errors or pointer verification loss.</p>",
    "root_cause": "The verifier cannot mathematically prove loop termination when loop induction variables depend on runtime state, dynamic packet bounds, or map lookups without explicit boundary clamping. Concurrently, large automatic variables or deep call chains exceed the 512-byte MAX_BPF_STACK limit, causing stack allocation failures.",
    "bad_code": "#include <linux/bpf.h>\n#include <bpf/bpf_helpers.h>\n\nSEC(\"xdp\")\nint parse_packets(struct xdp_md *ctx) {\n    void *data = (void *)(long)ctx->data;\n    void *data_end = (void *)(long)ctx->data_end;\n    char scratch_pad[600]; // Error: exceeds 512-byte stack limit\n\n    // Variable bound dependent on packet header: verifier rejects back-edge\n    __u32 iterations = *(__u32 *)data;\n    for (__u32 i = 0; i < iterations; i++) {\n        if (data + i + 1 > data_end)\n            break;\n        scratch_pad[i] = *((char *)data + i);\n    }\n    return XDP_PASS;\n}",
    "solution_desc": "Constrain loop bounds using constant maximum upper limits combined with explicit bitwise/logical bounds verification to satisfy the verifier's path analysis. Use modern kernel bounded loops (#pragma unroll or bpf_loop helper in Linux 5.17+). Replace oversized stack buffers with Per-CPU Array maps to avoid 512-byte stack spills.",
    "good_code": "#include <linux/bpf.h>\n#include <bpf/bpf_helpers.h>\n\n#define MAX_BUFFER_SIZE 256\n\nstruct {\n    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);\n    __type(key, __u32);\n    __type(value, char[MAX_BUFFER_SIZE]);\n    __uint(max_entries, 1);\n} scratch_map SEC(\".maps\");\n\nSEC(\"xdp\")\nint parse_packets(struct xdp_md *ctx) {\n    void *data = (void *)(long)ctx->data;\n    void *data_end = (void *)(long)ctx->data_end;\n    __u32 zero = 0;\n    char *scratch_pad = bpf_map_lookup_elem(&scratch_map, &zero);\n    if (!scratch_pad)\n        return XDP_ABORTED;\n\n    if (data + sizeof(__u32) > data_end)\n        return XDP_PASS;\n\n    __u32 iterations = *(__u32 *)data;\n    // Explicit invariant clamp satisfies verifier range tracking\n    if (iterations > MAX_BUFFER_SIZE)\n        iterations = MAX_BUFFER_SIZE;\n\n    #pragma unroll\n    for (int i = 0; i < MAX_BUFFER_SIZE; i++) {\n        if (i >= iterations || data + i + 1 > data_end)\n            break;\n        scratch_pad[i] = *((char *)data + i);\n    }\n    return XDP_PASS;\n}",
    "verification": "Load the BPF object file using `bpftool prog load <file.o> /sys/fs/bpf/test_prog log_level 2` or check libbpf debug outputs. Verify that the verifier passes with zero back-edge rejections and stack depth remains well below 512 bytes.",
    "date": "2026-10-28",
    "id": 1793188557,
    "type": "error"
});