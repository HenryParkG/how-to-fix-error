window.onPostDataLoaded({
    "title": "Fixing eBPF Verifier Rejections on Loops",
    "slug": "fixing-ebpf-verifier-loop-pointer-rejections",
    "language": "Rust",
    "code": "VerifierError",
    "tags": [
        "eBPF",
        "Rust",
        "Kernel",
        "Error Fix"
    ],
    "analysis": "<p>The eBPF verifier performs strict static analysis to guarantee kernel safety, forbidding arbitrary memory access and infinite loops. While modern kernels support bounded loops, combining loop unrolling via <code>#pragma unroll</code> with dynamic pointer arithmetic often leads to verifier rejections. This happens because the verifier tracking logic loses resolution of scalar bounds across iteration state updates. As the loop is unrolled, the scalar registers tracking the array indices expand their min/max range boundaries, eventually leading the verifier to believe that a pointer addition could exceed the safe data boundaries, throwing a <i>\"math between map_value pointer and register\"</i> or <i>\"invalid access to map value\"</i> error.</p>",
    "root_cause": "The verifier cannot guarantee that the unrolled index variable will not exceed safe bounds because the mathematical operations inside the loop scale the tracked maximum bounds beyond the allocated buffer limit, triggering safety flags.",
    "bad_code": "SEC(\"xdp\")\nint bad_ebpf_func(struct xdp_md *ctx) {\n    void *data = (void *)(long)ctx->data;\n    void *data_end = (void *)(long)ctx->data_end;\n    \n    __u64 offset = 0;\n    #pragma unroll\n    for (int i = 0; i < 4; i++) {\n        // Verifier tracks dynamic scalar bounds of offset\n        // As 'offset' is modified inside the unrolled loop, \n        // bounds check estimation exceeds real boundary limits\n        __u32 *val = data + offset;\n        if ((void*)(val + 1) > data_end) {\n            break;\n        }\n        offset += *val;\n    }\n    return XDP_PASS;\n}",
    "solution_desc": "Apply explicit bitwise masking to the dynamic offset variable inside each unrolled iteration. By using a bitwise AND operation (e.g., & 0x3F), you hard-limit the scalar register's maximum value. This informs the verifier's path tracking engine that the pointer offset can never exceed a strictly defined constant safe bound.",
    "good_code": "SEC(\"xdp\")\nint good_ebpf_func(struct xdp_md *ctx) {\n    void *data = (void *)(long)ctx->data;\n    void *data_end = (void *)(long)ctx->data_end;\n    \n    __u64 offset = 0;\n    #pragma unroll\n    for (int i = 0; i < 4; i++) {\n        // Explicit bitwise masking guarantees safe scalar ranges\n        __u64 safe_offset = offset & 0x0F; \n        __u32 *val = data + safe_offset;\n        \n        if ((void*)(val + 1) > data_end) {\n            break;\n        }\n        offset += *val;\n    }\n    return XDP_PASS;\n}",
    "verification": "Compile the code using Clang with -target bpf flag, and load it into the kernel using bpftool: 'bpftool prog load good_code.o /sys/fs/bpf/good_prog'. The program will verify successfully without the 'invalid access to map value' output.",
    "date": "2026-06-13",
    "id": 1781349068,
    "type": "error"
});