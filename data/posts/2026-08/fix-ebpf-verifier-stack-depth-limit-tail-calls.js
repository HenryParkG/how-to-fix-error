window.onPostDataLoaded({
    "title": "Fixing eBPF Verifier Stack Depth Limit in BPF Tail Calls",
    "slug": "fix-ebpf-verifier-stack-depth-limit-tail-calls",
    "language": "C / eBPF",
    "code": "BPF_VERIFIER_STACK_EXCEEDED",
    "tags": [
        "eBPF",
        "Linux",
        "Kernel",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>When combining deeply nested BPF-to-BPF subprogram calls with <code>bpf_tail_call</code>, developers often encounter eBPF verifier rejections due to stack depth limit violations. The Linux kernel verifier strictly enforces a maximum stack frame allocation of 512 bytes across the entire execution chain.</p><p>Because the verifier must guarantee execution safety without runtime stack overflow checks, it performs static analysis on every subprogram and tail call path. When a main BPF program allocates local stack variables and calls a helper subprogram before executing a tail call target, the verifier conservatively multiplies and combines potential stack frame sizes, causing the 512-byte limit to be exceeded rapidly during static path validation.</p>",
    "root_cause": "The verifier computes stack frame usage cumulatively across BPF-to-BPF subprogram call chains. When stack space is allocated prior to a `bpf_tail_call` invocation, the verifier accounts for the tail call target's potential stack footprint on top of the host caller's existing stack frame, exceeding the strict 512-byte MAX_BPF_STACK limit.",
    "bad_code": "#include <vmlinux.h>\n#include <bpf/bpf_helpers.h>\n\nstruct {\n    __uint(type, BPF_MAP_TYPE_PROG_ARRAY);\n    __uint(max_entries, 8);\n    __uint(key_size, sizeof(__u32));\n    __uint(value_size, sizeof(__u32));\n} jmp_map SEC(\".maps\");\n\nstatic __always_inline void process_payload(struct __sk_buff *skb) {\n    // Large local buffer on kernel stack (300 bytes)\n    char buf[300] = {0};\n    bpf_skb_load_bytes(skb, 0, buf, sizeof(buf));\n    // ... complex processing ...\n}\n\nSEC(\"tc\")\nint handle_ingress(struct __sk_buff *skb) {\n    // Host program frame allocation (200 bytes)\n    char host_ctx[200] = {0};\n    bpf_skb_load_bytes(skb, 0, host_ctx, sizeof(host_ctx));\n\n    // Call nested BPF helper (300 bytes stack) total stack: 500 bytes\n    process_payload(skb);\n\n    // Tail call with nearly full stack -> Verifier rejects due to dynamic target stack risk\n    bpf_tail_call(skb, &jmp_map, 0);\n    return TC_ACT_OK;\n}",
    "solution_desc": "To resolve stack depth violations in complex BPF-to-BPF tail call architectures, hoist large local variable allocations out of the program stack and into a high-performance `BPF_MAP_TYPE_PERCPU_ARRAY` scratchpad memory area. Alternatively, invoke `bpf_tail_call` at tail-position prior to initializing heavy local stack frames.",
    "good_code": "#include <vmlinux.h>\n#include <bpf/bpf_helpers.h>\n\nstruct scratch_buf {\n    char data[512];\n};\n\nstruct {\n    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);\n    __uint(max_entries, 1);\n    __type(key, __u32);\n    __type(value, struct scratch_buf);\n} scratch_map SEC(\".maps\");\n\nstruct {\n    __uint(type, BPF_MAP_TYPE_PROG_ARRAY);\n    __uint(max_entries, 8);\n    __type(key, __u32);\n    __type(value, __u32);\n} jmp_map SEC(\".maps\");\n\nSEC(\"tc\")\nint handle_ingress(struct __sk_buff *skb) {\n    __u32 key = 0;\n    struct scratch_buf *buf = bpf_map_lookup_elem(&scratch_map, &key);\n    if (!buf)\n        return TC_ACT_SHOT;\n\n    // Perform tail call early before pushing frame depth\n    bpf_tail_call(skb, &jmp_map, 0);\n\n    // Fallback logic using heap scratchpad rather than kernel stack frame\n    bpf_skb_load_bytes(skb, 0, buf->data, sizeof(buf->data));\n    return TC_ACT_OK;\n}",
    "verification": "Compile with clang (`-O2 -g -target bpf`) and load the ELF object using `bpftool prog load program.o /sys/fs/bpf/prog_test debug`. Inspect output logs to verify `stack depth` stays well under 512 bytes across all call branches without verifier errors.",
    "date": "2026-08-08",
    "id": 1786170916,
    "type": "error"
});