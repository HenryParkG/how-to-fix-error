window.onPostDataLoaded({
    "title": "Fixing eBPF Unbounded Loops and Stack Violations",
    "slug": "fixing-ebpf-verifier-loops-stack-violations",
    "language": "C",
    "code": "VerifierError",
    "tags": [
        "Go",
        "Docker",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>The eBPF (Extended Berkeley Packet Filter) verifier is a static analyzer that runs inside the Linux kernel. It is responsible for ensuring that loaded eBPF programs do not crash the system, read invalid memory, or run indefinitely. Two of the most common reasons for program rejection during loading are <code>backedge/loop detected</code> (unbounded loops) and <code>stack depth limit exceeded</code> (exceeding the strict 512-byte local stack size limit). Prior to kernel 5.3, the verifier disallowed loops entirely; newer kernels support bounded loops, but the verifier must be able to mathematically prove termination at compile-time.</p><p>Furthermore, because eBPF allocates stack frames statically, allocating structures or arrays directly within helper functions easily breaches the 512-byte threshold. This results in the infamous <code>combined stack size of 512 bytes exceeded</code> error.</p>",
    "root_cause": "The verifier rejects loops if it cannot verify termination statically through register range tracking, or if loop bounds are dependent on external variables (such as dynamic packet length) without explicit checks. Stack violations occur when developers allocate large buffers or structs directly on the stack rather than using eBPF maps or helper storage.",
    "bad_code": "#include <linux/bpf.h>\n#include <bpf/bpf_helpers.h>\n\nSEC(\"socket\")\nint bad_ebpf_prog(struct __sk_buff *skb) {\n    char buffer[400]; // Large allocation close to 512-byte limit\n    int table[40];    // (40 * 4) = 160 bytes. Total exceeds 512 limit!\n\n    // Unbounded loop based on dynamic header length\n    for (int i = 0; i < skb->len; i++) {\n        buffer[i % 400] = 'A';\n    }\n    return 0;\n}",
    "solution_desc": "To fix unbounded loop errors, we must bound the loop explicitly with a constant compile-time condition and instruct the compiler to unroll the loop using the `#pragma unroll` directive. To bypass the 512-byte stack limit, we offload large allocations into a `BPF_MAP_TYPE_PERCPU_ARRAY` map. This map acts as a scratchpad memory buffer, allowing secure, fast access without utilizing stack space.",
    "good_code": "#include <linux/bpf.h>\n#include <bpf/bpf_helpers.h>\n\n// Use a per-CPU array map as a scratch space instead of the stack\nstruct {\n    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);\n    __uint(max_entries, 1);\n    __type(key, __u32);\n    __type(value, char[512]);\n} scratch_map SEC(\".maps\");\n\nSEC(\"socket\")\nint good_ebpf_prog(struct __sk_buff *skb) {\n    __u32 key = 0;\n    char *buffer = bpf_map_lookup_elem(&scratch_map, &key);\n    if (!buffer) {\n        return 0; // Map lookup must be checked to satisfy the verifier\n    }\n\n    // Bound loop with absolute compile-time limit and unroll\n    #pragma unroll\n    for (int i = 0; i < 128; i++) {\n        if ((unsigned int)i >= skb->len) {\n            break;\n        }\n        buffer[i] = 'A';\n    }\n    return 0;\n}",
    "verification": "Compile the eBPF code using `clang -target bpf -O2 -g -c program.c -o program.o`. Attempt loading the object file into the kernel with `bpftool prog load program.o /sys/fs/bpf/prog`. Verify that the loading is successful with zero verifier validation failures or backtrace rejections.",
    "date": "2026-06-04",
    "id": 1780573633,
    "type": "error"
});