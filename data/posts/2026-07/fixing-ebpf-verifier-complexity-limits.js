window.onPostDataLoaded({
    "title": "Fixing eBPF Verifier Complexity Limits",
    "slug": "fixing-ebpf-verifier-complexity-limits",
    "language": "C / eBPF",
    "code": "BPF_VERIFIER_ERR",
    "tags": [
        "Rust",
        "Go",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When developing eBPF programs, the Linux kernel's static verifier analyzes all execution paths to ensure safety, memory isolation, and termination. Historically, loops had to be fully unrolled using the compiler directive <code>#pragma unroll</code> because the verifier did not support loops. However, unrolling loops in complex programs often causes the total instruction count to explode, exceeding the verifier's strict limit (1 million complexity units in modern kernels). Even with bounded loop support introduced in v5.3, the verifier must explore every state transition, leading to a state explosion failure if the loop bounds or execution paths are too dynamic.</p><p>As programs grow in sophistication\u2014for instance, parsing deeply nested network packets or iterating through large maps\u2014the compiler generates massive linear instruction streams that easily trigger the verifier's <code>backedge</code> check failures or exhaust the instruction complexity threshold.</p>",
    "root_cause": "The compiler fully unrolls loops containing variable constraints, or the verifier fails to prune redundant paths in bounded loops, leading to exceeding the maximum complexity limit of 1 million states explored during verification.",
    "bad_code": "#define MAX_ENTRIES 128\n\nSEC(\"socket\")\nint filter_packets(struct __sk_buff *skb) {\n    void *data = (void *)(long)skb->data;\n    void *data_end = (void *)(long)skb->data_end;\n    __u8 *ptr = data;\n    __u32 sum = 0;\n\n    #pragma unroll\n    for (int i = 0; i < MAX_ENTRIES; i++) {\n        if (ptr + 1 > (__u8 *)data_end) {\n            break;\n        }\n        sum += *ptr;\n        ptr++;\n    }\n    return sum;\n}",
    "solution_desc": "To overcome the complexity limit, refactor your eBPF code to use the modern helper `bpf_loop()`, introduced in Linux 5.17, which validates the loop body as a single closure and avoids state-space explosion. If targeting older kernels, use tail-calls (`bpf_tail_call`) to split the instruction sequence into isolated, independently verified execution frames.",
    "good_code": "#include <vmlinux.h>\n#include <bpf/bpf_helpers.h>\n\nstruct loop_ctx {\n    __u8 *ptr;\n    void *data_end;\n    __u32 sum;\n};\n\nstatic int sum_callback(__u32 index, struct loop_ctx *ctx) {\n    if (ctx->ptr + 1 > (__u8 *)ctx->data_end) {\n        return 1; /* Stop iteration */\n    }\n    ctx->sum += *ctx->ptr;\n    ctx->ptr++;\n    return 0; /* Continue iteration */\n}\n\nSEC(\"socket\")\nint filter_packets(struct __sk_buff *skb) {\n    void *data = (void *)(long)skb->data;\n    void *data_end = (void *)(long)skb->data_end;\n    \n    struct loop_ctx ctx = {\n        .ptr = data,\n        .data_end = data_end,\n        .sum = 0\n    };\n\n    /* Safely loops up to 128 times using helper callback */\n    bpf_loop(128, sum_callback, &ctx, 0);\n\n    return ctx.sum;\n}",
    "verification": "Compile the code using `clang -target bpf` and attempt loading it into the kernel using `bpftool prog load` or `tc`. Enable verbose logging using `log_level=2` to ensure the program loads cleanly with minimal complexity instructions analyzed.",
    "date": "2026-07-13",
    "id": 1783907561,
    "type": "error"
});