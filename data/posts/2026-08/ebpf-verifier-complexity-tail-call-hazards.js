window.onPostDataLoaded({
    "title": "Fixing eBPF Verifier Complexity Limit & Tail Calls",
    "slug": "ebpf-verifier-complexity-tail-call-hazards",
    "language": "C / Linux Kernel",
    "code": "BPF_COMPLEXITY_LIMIT_EXCEEDED",
    "tags": [
        "eBPF",
        "Linux",
        "Kernel",
        "Rust",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>The Linux eBPF verifier inspects all reachable execution paths in a program to guarantee safety and termination before loading into kernel context. In complex networking or tracing applications, non-trivial conditional branches combined with subprogram calls and loops can cause the verifier's state exploration budget (1,000,000 instructions in modern kernels) to exhaust quickly.</p><p>When developers introduce tail calls (via <code>bpf_tail_call()</code>) to circumvent instruction limits or implement modular routing, state explosion is often replaced with insidious runtime hazards. Tail calls bypass standard function returns and overwrite the existing stack frame. If state registers are not properly sanitized or if unbounded loop states prevent path pruning, the verifier will reject the bytecode with <code>BPF_COMPLEXITY_LIMIT_EXCEEDED</code> (-E2BIG) or trigger runtime tail-call stack depth exhaustion (max 33 calls).</p>",
    "root_cause": "Exponential path explosion in the verifier caused by unpruned branch states and nested dynamic bounds checking, compounded by unoptimized register spilling before tail call execution.",
    "bad_code": "#include <linux/bpf.h>\n#include <bpf/bpf_helpers.h>\n\nstruct {\n    __uint(type, BPF_MAP_TYPE_PROG_ARRAY);\n    __uint(max_entries, 8);\n    __type(key, __u32);\n    __type(value, __u32);\n} jmp_table SEC(\".maps\");\n\nSEC(\"tc\")\nint parse_and_route(struct __sk_buff *skb) {\n    void *data = (void *)(long)skb->data;\n    void *data_end = (void *)(long)skb->data_end;\n    __u8 *bytes = data;\n    __u32 sum = 0;\n\n    /* Unbounded loop causing state explosion in verifier */\n    for (int i = 0; i < 256; i++) {\n        if (data + i + 1 > data_end)\n            break;\n        sum += bytes[i];\n        if (sum % 2 == 0) {\n            /* Inlining branch states multiplies complexity exponentially */\n            bpf_tail_call(skb, &jmp_table, sum % 8);\n        }\n    }\n    return TC_ACT_OK;\n}",
    "solution_desc": "Mitigate verifier state explosion by using explicit verifier state pruning barriers (`asm volatile (\"\" : \"+r\"(var))` or `bpf_loop` helper), bounding loop iterations statically, and isolating tail calls to terminal execution points where stack variables do not need preservation.",
    "good_code": "#include <linux/bpf.h>\n#include <bpf/bpf_helpers.h>\n\nstruct {\n    __uint(type, BPF_MAP_TYPE_PROG_ARRAY);\n    __uint(max_entries, 8);\n    __type(key, __u32);\n    __type(value, __u32);\n} jmp_table SEC(\".maps\");\n\nstatic inline void verifier_barrier(__u32 *val) {\n    asm volatile(\"\" : \"+r\"(*val) : : \"memory\");\n}\n\nSEC(\"tc\")\nint parse_and_route(struct __sk_buff *skb) {\n    void *data = (void *)(long)skb->data;\n    void *data_end = (void *)(long)skb->data_end;\n    __u8 *bytes = data;\n    __u32 target_idx = 0;\n\n    #pragma unroll\n    for (int i = 0; i < 16; i++) {\n        if (data + (i + 1) > data_end)\n            return TC_ACT_OK;\n        target_idx += bytes[i];\n    }\n\n    verifier_barrier(&target_idx);\n    target_idx &= 0x7; /* Bound index to 0-7 */\n\n    /* Clean tail call at deterministic point */\n    bpf_tail_call(skb, &jmp_table, target_idx);\n    return TC_ACT_OK;\n}",
    "verification": "Load the bytecode with bpftool and inspect verifier logs: `bpftool prog load bpf_prog.o /sys/fs/bpf/prog log_level 2`. Verify that instruction counts evaluated drop below 10,000 and no tail call invalidation errors occur.",
    "date": "2026-08-15",
    "id": 1786785430,
    "type": "error"
});