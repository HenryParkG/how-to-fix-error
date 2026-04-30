window.onPostDataLoaded({
    "title": "Debugging eBPF Verifier Bounded Loop Rejection",
    "slug": "ebpf-verifier-bounded-loops-xdp",
    "language": "Rust",
    "code": "VERIFIER_REJECTION",
    "tags": [
        "Rust",
        "Backend",
        "Kernel",
        "Error Fix"
    ],
    "analysis": "<p>While modern Linux kernels support bounded loops in eBPF, the verifier still enforces strict path simulation. If the verifier cannot mathematically prove that a loop will terminate within the complexity limit (1 million instructions), it rejects the program. This often happens in XDP programs when parsing variable-length packet headers where the induction variable is not clearly constrained.</p>",
    "root_cause": "The verifier fails to track the range of the loop iterator because it is either modified in a way the verifier doesn't understand or compared against a non-constant value that isn't properly bounded by a previous check.",
    "bad_code": "// Verifier may reject due to unknown upper bound\nfor (int i = 0; i < packet_len; i++) {\n    if (cursor + i > data_end) break;\n    process_byte(data[i]);\n}",
    "solution_desc": "Use a fixed maximum loop count with an explicit constant and ensure the loop iterator is a simple scalar that the verifier can track using register bounds analysis.",
    "good_code": "// Use a hard constant and explicit bounds check\n#define MAX_ITER 256\n\n#pragma unroll\nfor (int i = 0; i < MAX_ITER; i++) {\n    if (i >= actual_len) break;\n    if (cursor + 1 > data_end) break;\n    // Process byte safely\n    cursor++;\n}",
    "verification": "Use 'bpftool prog load' and check if the output includes 'processed N instructions' without 'back-edge' or 'complexity' errors.",
    "date": "2026-04-30",
    "id": 1777546000,
    "type": "error"
});