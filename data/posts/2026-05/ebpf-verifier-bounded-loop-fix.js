window.onPostDataLoaded({
    "title": "Resolving eBPF Verifier Rejection of Bounded Loops",
    "slug": "ebpf-verifier-bounded-loop-fix",
    "language": "C / eBPF",
    "code": "VerifierRejection",
    "tags": [
        "Go",
        "C",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>The eBPF verifier ensures program safety by simulating execution. While Linux 5.3+ supports bounded loops, the verifier often rejects them if it cannot prove the loop terminates within the 1-million instruction limit or if the loop induction variable undergoes 'widening'. This is particularly common in CO-RE (Compile Once \u2013 Run Everywhere) programs where data structures from different kernel versions introduce variable offsets that the verifier cannot statically track.</p>",
    "root_cause": "The verifier's scalar range tracking fails when a loop counter is compared against a variable stored in a map or a pointer-derived value, leading it to treat the counter as an unbounded scalar.",
    "bad_code": "for (int i = 0; i < params->max_entries; i++) {\n    struct data_t *val = bpf_map_lookup_elem(&my_map, &i);\n    if (val) process(val);\n}",
    "solution_desc": "Use a fixed constant for the loop bound or apply a bitwise AND mask to the induction variable to provide a hard upper bound that the verifier can recognize. Additionally, using '#pragma unroll' is a fallback for older kernels, but for modern bounded loops, use 'asm volatile' to prevent the compiler from optimizing away the boundary checks.",
    "good_code": "#define MAX_ITER 16\n#pragma unroll\nfor (int i = 0; i < MAX_ITER; i++) {\n    // Ensure i is treated as a bounded scalar\n    if (i >= params->max_entries) break;\n    struct data_t *val = bpf_map_lookup_elem(&my_map, &i);\n    if (val) process(val);\n}",
    "verification": "Run 'bpftool prog load' and check the verifier log for 'back-edge from insn' errors. Success is confirmed when the program loads without 'invalid loop' messages.",
    "date": "2026-05-08",
    "id": 1778235498,
    "type": "error"
});