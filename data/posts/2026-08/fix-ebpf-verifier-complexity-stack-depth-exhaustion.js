window.onPostDataLoaded({
    "title": "Fix eBPF Verifier Complexity & Stack Depth Exhaustion",
    "slug": "fix-ebpf-verifier-complexity-stack-depth-exhaustion",
    "language": "C / Rust",
    "code": "BPF_VERIFIER_STACK_LIMIT",
    "tags": [
        "Rust",
        "eBPF",
        "Linux Kernel",
        "Error Fix"
    ],
    "analysis": "<p>The Linux kernel eBPF verifier enforces a strict cumulative stack depth limit of 512 bytes across all subprogram call chains to prevent kernel stack overflow. When compiling eBPF programs (using Clang or Rust Aya/RedbPF), nested helper invocations and local buffer allocations cause cumulative frame growth. Furthermore, deep branching and unrolled loops cause the verifier's state exploration engine to exceed its complexity limit (1,000,000 processed instructions), terminating verification with <code>BPF program is too large</code> or <code>combined stack size ... exceeds limit of 512</code>.</p>",
    "root_cause": "Subprogram call graphs allocate local variable arrays on the BPF stack without memory reuse, exceeding the 512-byte cumulative limit across nested frames, while unconstrained branching triggers state explosion in the verifier's DAG traversal.",
    "bad_code": "#include <vmlinux.h>\n#include <bpf/bpf_helpers.h>\n\nstatic __noinline int parse_payload(struct __sk_buff *skb, int offset) {\n    char buffer[256]; // Allocates 256 bytes on subprogram stack\n    bpf_skb_load_bytes(skb, offset, buffer, sizeof(buffer));\n    return buffer[0] == 0x42 ? 1 : 0;\n}\n\nSEC(\"tc\")\nint filter_packet(struct __sk_buff *skb) {\n    char header[280]; // Allocates 280 bytes on root stack\n    bpf_skb_load_bytes(skb, 0, header, sizeof(header));\n    \n    // 280 + 256 = 536 bytes cumulative stack -> Verifier Rejects\n    if (parse_payload(skb, 280) > 0) {\n        return 1;\n    }\n    return 0;\n}",
    "solution_desc": "Replace transient stack buffers with a Per-CPU Array scratchpad map to eliminate stack allocation overhead. Flatten deep subprogram call chains and use compiler hints (`#pragma unroll` or bounded `bpf_loop()`) to restrict path exploration.",
    "good_code": "#include <vmlinux.h>\n#include <bpf/bpf_helpers.h>\n\nstruct scratch_buf {\n    char data[512];\n};\n\nstruct {\n    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);\n    __type(key, __u32);\n    __type(value, struct scratch_buf);\n    __uint(max_entries, 1);\n} scratch_map SEC(\".maps\");\n\nSEC(\"tc\")\nint filter_packet(struct __sk_buff *skb) {\n    __u32 key = 0;\n    struct scratch_buf *buf = bpf_map_lookup_elem(&scratch_map, &key);\n    if (!buf) return 0;\n\n    if (bpf_skb_load_bytes(skb, 0, buf->data, 280) < 0) return 0;\n    \n    // Inlined parse logic utilizing the same scratch buffer\n    if (bpf_skb_load_bytes(skb, 280, buf->data, 256) == 0 && buf->data[0] == 0x42) {\n        return 1;\n    }\n    return 0;\n}",
    "verification": "Compile with `clang -target bpf -O2` and load using `bpftool prog load filter.o /sys/fs/bpf/filter`. Check verifier output via `dmesg -T` to confirm stack depth stays well below 512 bytes.",
    "date": "2026-08-22",
    "id": 1787390365,
    "type": "error"
});