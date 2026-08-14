window.onPostDataLoaded({
    "title": "Fix eBPF Verifier Stack Limit with Nested Tail Calls",
    "slug": "ebpf-verifier-stack-limit-nested-tail-calls",
    "language": "C / eBPF",
    "code": "EINVAL",
    "tags": [
        "Rust",
        "Docker",
        "Linux Kernel",
        "eBPF",
        "Error Fix"
    ],
    "analysis": "<p>eBPF programs enforce an uncompromising 512-byte stack frame limit across execution. When developers combine static subprograms (functions) and <code>bpf_tail_call</code> mechanisms, the BPF verifier performs static path analysis across the entire instruction graph.</p><p>If dynamic subprogram stack footprints are combined with tail call preparation buffers, the verifier computes a cumulative stack depth that often violates BPF verifier constraints or triggers <code>tail_call inside subprogram with non-zero stack</code> errors depending on the kernel version. Furthermore, allocating local structures directly on the stack prior to a tail call quickly breaches the 512-byte boundary, causing program rejection during load time.</p>",
    "root_cause": "The BPF verifier restricts cumulative stack depth to 512 bytes and rejects tail calls when executed from subprograms with active stack frames or when stack allocations exceed MAX_BPF_STACK across inlined sub-graphs.",
    "bad_code": "SEC(\"classifier\")\nint handle_ingress(struct __sk_buff *skb) {\n    // Allocating large buffers directly on the BPF stack (512-byte limit)\n    struct packet_metadata meta;\n    char payload_scratch[384];\n    \n    bpf_skb_load_bytes(skb, 0, payload_scratch, sizeof(payload_scratch));\n    meta.len = skb->len;\n    meta.protocol = skb->protocol;\n    \n    // Inlined processing pushing stack over 512 bytes\n    process_metadata(&meta, payload_scratch);\n    \n    // Tail call within high-depth stack context triggers verifier failure\n    bpf_tail_call(skb, &jmp_table, NEXT_STAGE_INDEX);\n    return TC_ACT_OK;\n}",
    "solution_desc": "Offload stack allocations to a BPF Per-CPU Array map scratchpad (`BPF_MAP_TYPE_PERCPU_ARRAY`) to reduce stack frame utilization to minimal register pointers, and ensure `bpf_tail_call` is executed strictly from the top-level program frame without lingering caller frame allocations.",
    "good_code": "struct {\n    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);\n    __uint(max_entries, 1);\n    __type(key, __u32);\n    __type(value, struct scratch_buffer);\n} scratch_map SEC(\".maps\");\n\nSEC(\"classifier\")\nint handle_ingress(struct __sk_buff *skb) {\n    __u32 zero = 0;\n    struct scratch_buffer *buf = bpf_map_lookup_elem(&scratch_map, &zero);\n    if (!buf)\n        return TC_ACT_SHOT;\n\n    // Memory is mapped in heap-like per-cpu region; stack usage is ~32 bytes\n    bpf_skb_load_bytes(skb, 0, buf->payload, sizeof(buf->payload));\n    buf->meta.len = skb->len;\n    buf->meta.protocol = skb->protocol;\n\n    bpf_tail_call(skb, &jmp_table, NEXT_STAGE_INDEX);\n    return TC_ACT_OK;\n}",
    "verification": "Load the BPF object file using `bpftool prog load` with verifier logging enabled: `bpftool prog load bpf_prog.o /sys/fs/bpf/prog_test type classifier -v`. Verify that `stack depth` remains well under 512 bytes across all call frames.",
    "date": "2026-08-14",
    "id": 1786669598,
    "type": "error"
});