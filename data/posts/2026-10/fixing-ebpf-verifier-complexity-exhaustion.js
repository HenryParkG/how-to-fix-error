window.onPostDataLoaded({
    "title": "Fixing eBPF Verifier Complexity Exhaustion Traps",
    "slug": "fixing-ebpf-verifier-complexity-exhaustion",
    "language": "C",
    "code": "BPF_VERIFIER_E2BIG",
    "tags": [
        "Rust",
        "Backend",
        "eBPF",
        "Linux",
        "C",
        "Error Fix"
    ],
    "analysis": "<p>When compiling non-trivial eBPF programs, developers frequently encounter the dreaded <code>BPF program is too large</code> or <code>complexity limit exceeded</code> error from the kernel verifier. The Linux kernel verifier statically simulates all possible execution paths of an eBPF bytecode image. While modern kernels permit up to 1,000,000 processed instructions, complex packet parsing, deep nested conditionals, and iterative loops can quickly trigger combinatorial explosion.</p><p>This verification failure is exacerbated by two distinct kernel mechanics: branch state pruning failures and excessive stack register spilling. The verifier attempts to prune redundant branches if the current register state is equivalent to a previously explored state (via <code>states_equal()</code>). However, when the compiler spills variables to the 512-byte BPF stack as imprecise stack slots, or when pointer arithmetic creates wide scalar ranges, the verifier cannot prove state equivalence. As a result, the branch pruning cache misses repeatedly, forcing the verifier to traverse every permutation until <code>insn_processed</code> exceeds the upper limit.</p>",
    "root_cause": "Unbounded scalar ranges and variable-length array offsets prevent the verifier from pruning equivalent branch states, while local struct allocations force LLVM to spill imprecise 64-bit scalars onto the BPF stack.",
    "bad_code": "SEC(\"tc\")\nint process_packets(struct __sk_buff *skb) {\n    void *data = (void *)(long)skb->data;\n    void *data_end = (void *)(long)skb->data_end;\n    struct ethhdr *eth = data;\n    \n    // Excessive local buffer causes register spilling to BPF stack\n    char lookup_buf[256] = {0};\n    \n    if ((void *)(eth + 1) > data_end)\n        return TC_ACT_OK;\n\n    #pragma unroll\n    for (int i = 0; i < 32; i++) {\n        // Variable access without strict boundary constraints prevents branch pruning\n        volatile __u32 offset = i * 4;\n        if (data + offset + sizeof(__u32) <= data_end) {\n            lookup_buf[i] = *(__u8 *)(data + offset);\n        }\n    }\n    return TC_ACT_OK;\n}",
    "solution_desc": "Mitigate verifier complexity by constraining register scalar bounds explicitly with bitwise masking, replacing stack buffers with BPF per-CPU array maps to avoid spills, and using the `asm volatile (\"\" : \"+r\"(var))` optimization barrier to force verifier state deduplication.",
    "good_code": "SEC(\"tc\")\nint process_packets(struct __sk_buff *skb) {\n    void *data = (void *)(long)skb->data;\n    void *data_end = (void *)(long)skb->data_end;\n\n    if (data + sizeof(struct ethhdr) > data_end)\n        return TC_ACT_OK;\n\n    // Clamp loop bounds and use explicit register boundary masks\n    #pragma unroll\n    for (__u32 i = 0; i < 16; i++) {\n        __u32 offset = (i * 4) & 0x3F; // Explicit bitmask limits scalar range\n        // Barrier forces LLVM to keep variable in register and reset state tracking\n        asm volatile(\"\" : \"+r\"(offset));\n        \n        void *target = data + sizeof(struct ethhdr) + offset;\n        if (target + 1 > data_end)\n            break;\n        \n        __u8 byte_val = *(__u8 *)target;\n        if (byte_val == 0xFF)\n            return TC_ACT_SHOT;\n    }\n    return TC_ACT_OK;\n}",
    "verification": "Compile with `clang -O2 -g -target bpf` and inspect the verifier log via `bpftool prog load <obj> /sys/fs/bpf/test type tc log_level 2`. Verify that `processed <number> insns` shows an order-of-magnitude reduction in branch explorations.",
    "date": "2026-10-16",
    "id": 1792136502,
    "type": "error"
});