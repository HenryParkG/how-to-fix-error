window.onPostDataLoaded({
    "title": "Fix eBPF Verifier Explosion & Stack Limit",
    "slug": "fix-ebpf-verifier-state-explosion-stack-spill",
    "language": "C / eBPF",
    "code": "BPF_VERIFIER_ERROR",
    "tags": [
        "eBPF",
        "Linux",
        "Kubernetes",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>When developing complex eBPF programs for networking or observability, developers frequently encounter verifier failures stating <code>the sequence of 1400000 jumps is too complex</code> or <code>combined stack frames size exceeds limit</code>. The Linux kernel BPF verifier performs static abstract interpretation across all program execution paths via <code>bpf_verifier_env</code>. If branching logic contains multiple interdependent conditions or unrolled loops, path pruning fails to identify equivalent states (<code>states_equal()</code>), triggering exponential state explosion that hits the verifier's 1-million instruction limit (<code>BPF_COMPLEXITY_LIMIT_INSNS</code>).</p><p>Simultaneously, the BPF runtime strictly limits the stack frame to 512 bytes per function (<code>MAX_BPF_STACK</code>). Spilling register state across complex branches or passing large structs on the stack forces the compiler to exceed this boundary, triggering immediate verifier rejection during compilation.</p>",
    "root_cause": "Combinatorial branch explosion preventing verifier path pruning, combined with exceeding the 512-byte per-subprogram stack limit due to inline struct allocation and excessive register spills.",
    "bad_code": "#include <linux/bpf.h>\n#include <bpf/bpf_helpers.h>\n\n#define MAX_ITEMS 16\n\nstruct event_payload {\n    char buffer[480];\n    __u32 metadata[8];\n};\n\nSEC(\"kprobe/sys_execve\")\nint bad_handler(void *ctx) {\n    // Exceeds 512-byte stack frame when combined with spills\n    struct event_payload payload = {}; \n    \n    // Unrolled branches cause state explosion\n    #pragma unroll\n    for (int i = 0; i < MAX_ITEMS; i++) {\n        if (payload.metadata[i % 8] > 10) {\n            if ((i & 1) && payload.buffer[i] != 0) {\n                payload.metadata[0] += i;\n            }\n        }\n    }\n    return 0;\n}",
    "solution_desc": "Mitigate state explosion and stack overflow by: 1) Moving large structures off the stack into a per-CPU array scratchpad map (`BPF_MAP_TYPE_PERCPU_ARRAY`), 2) Decomposing logic into `__noinline` BPF subprograms with isolated 512-byte stack limits, and 3) Inserting compiler memory optimization barriers (`asm volatile(\"\" : \"+r\"(val))`) to bound range checks and prevent branch state explosion.",
    "good_code": "#include <linux/bpf.h>\n#include <bpf/bpf_helpers.h>\n\nstruct event_payload {\n    char buffer[480];\n    __u32 metadata[8];\n};\n\nstruct {\n    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);\n    __type(key, __u32);\n    __type(value, struct event_payload);\n    __uint(max_entries, 1);\n} scratch_heap SEC(\".maps\");\n\nstatic __noinline int process_item(__u32 idx, struct event_payload *p) {\n    // Compiler barrier prevents path explosion\n    asm volatile(\"\" : \"+r\"(idx));\n    if (idx < 8 && p->metadata[idx] > 10) {\n        p->metadata[0] += idx;\n    }\n    return 0;\n}\n\nSEC(\"kprobe/sys_execve\")\nint good_handler(void *ctx) {\n    __u32 zero = 0;\n    struct event_payload *p = bpf_map_lookup_elem(&scratch_heap, &zero);\n    if (!p) return 0;\n\n    #pragma unroll\n    for (__u32 i = 0; i < 8; i++) {\n        process_item(i, p);\n    }\n    return 0;\n}",
    "verification": "Compile with `clang -O2 -g -target bpf` and verify using `bpftool prog load <object.o> /sys/fs/bpf/test_prog -d`. Inspect the verifier output to confirm instructions processed remain well below 1,000,000 and stack depth per subprogram stays under 512 bytes.",
    "date": "2026-10-10",
    "id": 1791632238,
    "type": "error"
});