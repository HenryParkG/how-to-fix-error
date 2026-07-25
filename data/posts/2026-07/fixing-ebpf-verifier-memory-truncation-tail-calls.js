window.onPostDataLoaded({
    "title": "Fixing eBPF Verifier Memory Truncation in Tail Calls",
    "slug": "fixing-ebpf-verifier-memory-truncation-tail-calls",
    "language": "C / eBPF",
    "code": "E2BIG",
    "tags": [
        "eBPF",
        "Linux",
        "C",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>When executing complex control flow programs in eBPF that use bounded tail calls (via <code>bpf_tail_call</code>), the Linux kernel eBPF verifier performs state equivalence checks to prune verification paths. However, when passing stack references across deeply nested or bounded tail call chains, the verifier can prune register states prematurely due to inaccurate memory range bounds tracking. This state truncation causes the verifier to treat valid memory references as uninitialized or out-of-bounds, aborting program load with <code>E2BIG</code> or <code>EACCES</code> verification errors.</p>",
    "root_cause": "The eBPF verifier's state pruning logic fails to mark register precision on stack pointer offsets when evaluating tail call transitions within bounded loops, leading to memory bounds truncation across execution contexts.",
    "bad_code": "#include <vmlinux.h>\n#include <bpf/bpf_helpers.h>\n\nstruct {\n    __uint(type, BPF_MAP_TYPE_PROG_ARRAY);\n    __uint(max_entries, 8);\n    __type(key, __u32);\n    __type(value, __u32);\n} jmp_table SEC(\".maps\");\n\nSEC(\"tc\")\nint process_pkt(struct __sk_buff *skb) {\n    __u8 buf[64] = {0};\n    __u32 index = 0;\n    \n    // Unbarriered pointer arithmetic leading to verifier state truncation\n    bpf_skb_load_bytes(skb, 0, buf, sizeof(buf));\n    \n    if (buf[0] == 0xFF) {\n        // Verifier loses stack pointer precise bounds during tail call context change\n        bpf_tail_call(skb, &jmp_table, index);\n    }\n    return TC_ACT_OK;\n}",
    "solution_desc": "To fix memory state truncation, force the verifier to preserve exact register precision using compiler memory barriers (`barrier_var`) and explicitly cap pointer offsets prior to executing the tail call jump.",
    "good_code": "#include <vmlinux.h>\n#include <bpf/bpf_helpers.h>\n\n#define barrier_var(var) asm volatile(\"\" : \"+r\" (var))\n\nstruct {\n    __uint(type, BPF_MAP_TYPE_PROG_ARRAY);\n    __uint(max_entries, 8);\n    __type(key, __u32);\n    __type(value, __u32);\n} jmp_table SEC(\".maps\");\n\nSEC(\"tc\")\nint process_pkt(struct __sk_buff *skb) {\n    __u8 buf[64] = {0};\n    __u32 index = 0;\n    \n    if (bpf_skb_load_bytes(skb, 0, buf, sizeof(buf)) < 0)\n        return TC_ACT_OK;\n\n    if (buf[0] == 0xFF) {\n        // Barrier prevents register bounds pruning during state comparison\n        barrier_var(index);\n        index &= 0x7; // Clamp index to explicitly prove bounds to verifier\n        bpf_tail_call(skb, &jmp_table, index);\n    }\n    return TC_ACT_OK;\n}",
    "verification": "Load the BPF program using `bpftool prog load` with full verifier output logging enabled (`bpftool -v prog load ...`). Verify that register tracking outputs maintain explicit bounds (`R2_w=scalar(smin=0,smax=7)`) prior to `bpf_tail_call` call instruction.",
    "date": "2026-07-25",
    "id": 1784944175,
    "type": "error"
});