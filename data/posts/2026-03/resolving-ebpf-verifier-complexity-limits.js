window.onPostDataLoaded({
    "title": "Resolving eBPF Verifier Complexity Limits",
    "slug": "resolving-ebpf-verifier-complexity-limits",
    "language": "Go",
    "code": "EACCES (Verifier Limit)",
    "tags": [
        "Go",
        "Infra",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>When building large-scale observability tools with eBPF, developers often encounter the 'BPF program too large' or 'verifier complexity limit exceeded' error. The Linux kernel verifier performs a static analysis of all possible execution paths to ensure safety. For complex programs with numerous branches or unrolled loops, the state explosion causes the verifier to hit its instruction limit (1 million instructions) or complexity threshold, even if the logical flow is sound.</p>",
    "root_cause": "Path explosion in the verifier's state pruning logic and exceeding the maximum processed instruction count (BPF_COMPLEXITY_LIMIT_INSNS).",
    "bad_code": "/* Unrolling large loops increases instruction count exponentially */\n#pragma unroll\nfor (int i = 0; i < 512; i++) {\n    data = bpf_map_lookup_elem(&my_map, &i);\n    if (data) {\n        process_event(data);\n    }\n}",
    "solution_desc": "Refactor the program to use BPF tail calls to split the logic into multiple smaller programs or utilize BPF-to-BPF function calls (introduced in kernel 4.16) to reduce the search space for the verifier. Tail calls allow jumping to another program while resetting the verifier state for that jump.",
    "good_code": "/* Use tail calls to distribute complexity */\nstruct bpf_map_def SEC(\"maps\") jmp_table = {\n    .type = BPF_MAP_TYPE_PROG_ARRAY,\n    .key_size = sizeof(u32),\n    .value_size = sizeof(u32),\n    .max_entries = 8,\n};\n\nSEC(\"kprobe/sys_execve\")\nint bpf_prog_main(struct pt_regs *ctx) {\n    bpf_tail_call(ctx, &jmp_table, SUB_PROG_INDEX);\n    return 0;\n}",
    "verification": "Check the verifier log output using `bpftool prog load` with the `visualize` or `v` flag to confirm instruction count reduction.",
    "date": "2026-03-18",
    "id": 1773816753,
    "type": "error"
});