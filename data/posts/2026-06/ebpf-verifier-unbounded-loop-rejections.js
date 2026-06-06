window.onPostDataLoaded({
    "title": "Fixing eBPF Verifier Unbounded Loop Rejections",
    "slug": "ebpf-verifier-unbounded-loop-rejections",
    "language": "Rust",
    "code": "VerifierRejectException",
    "tags": [
        "eBPF",
        "C",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>When writing eBPF programs, developers frequently encounter verifier rejections due to unbounded loop complexity. The eBPF verifier is a static analyzer inside the Linux kernel designed to guarantee safety, preventing programs from crashing, accessing illegal memory, or running indefinitely. Traditionally, the verifier achieved this by unrolling all loops and exploring every path. In modern kernels, bounded loops are supported, but they still present significant hurdles.</p><p>If the verifier cannot mathematically prove that a loop will terminate within a certain number of instructions (the exact limit varies by kernel version, historically 1 million instructions), it rejects the program with a <code>backedge</code> or <code>infinite loop detected</code> error. This occurs because the loop control variable depends on runtime variables, such as values parsed directly from network packets or map values, which the verifier treats as untrusted and arbitrary.</p>",
    "root_cause": "The eBPF verifier rejects the program because the loop control variable is dynamic and lacks a constant, provable upper limit known to the compiler and verifier at build time, leading to state space explosion or failure to guarantee program termination.",
    "bad_code": "SEC(\"filter\")\nint parse_packets(struct __sk_buff *skb) {\n    void *data = (void *)(long)skb->data;\n    void *data_end = (void *)(long)skb->data_end;\n    struct custom_hdr *hdr = data;\n\n    if ((void *)(hdr + 1) > data_end) {\n        return 0;\n    }\n\n    // BUG: Loop limit depends on non-constant, packet-defined data\n    // The verifier cannot guarantee this loop will terminate within limit\n    for (int i = 0; i < hdr->num_options; i++) {\n        __u32 *option = (void *)(hdr + 1) + (i * sizeof(__u32));\n        if ((void *)(option + 1) > data_end) {\n            break;\n        }\n        // Process option\n    }\n    return 1;\n}",
    "solution_desc": "To fix this, we must enforce a strict, constant upper bound that the compiler and verifier can statically analyze. Use compiler hints like '#pragma unroll' for older kernels, or ensure that modern bounded loops always compare the iterator against a constant macro ceiling first, verifying that the loop variable is mathematically constrained.",
    "good_code": "#define MAX_OPTIONS 8\n\nSEC(\"filter\")\nint parse_packets(struct __sk_buff *skb) {\n    void *data = (void *)(long)skb->data;\n    void *data_end = (void *)(long)skb->data_end;\n    struct custom_hdr *hdr = data;\n\n    if ((void *)(hdr + 1) > data_end) {\n        return 0;\n    }\n\n    // Ensure the runtime option count does not exceed our maximum static ceiling\n    __u8 options_count = hdr->num_options;\n    if (options_count > MAX_OPTIONS) {\n        options_count = MAX_OPTIONS;\n    }\n\n    // Compiler can unroll this or verify the static constraint reliably\n    #pragma unroll\n    for (int i = 0; i < MAX_OPTIONS; i++) {\n        if (i >= options_count) {\n            break;\n        }\n        __u32 *option = (void *)(hdr + 1) + (i * sizeof(__u32));\n        if ((void *)(option + 1) > data_end) {\n            break;\n        }\n        // Safely process option\n    }\n    return 1;\n}",
    "verification": "Load the compiled object file into the kernel using bpftool or an eBPF loader (like aya in Rust or cilium/ebpf in Go) with verifier logs enabled: `bpftool prog load bpf_program.o /sys/fs/bpf/prog`. Verify that the verifier successfully validates the loop without emitting 'backedge' warnings or 'infinite loop' exceptions.",
    "date": "2026-06-06",
    "id": 1780742999,
    "type": "error"
});