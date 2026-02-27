window.onPostDataLoaded({
    "title": "Debugging eBPF Verifier Failures in Tail-Call Chains",
    "slug": "ebpf-verifier-tail-call-failures",
    "language": "C / eBPF",
    "code": "EACCES / EINVAL",
    "tags": [
        "Go",
        "Backend",
        "Linux",
        "Error Fix"
    ],
    "analysis": "<p>The eBPF verifier ensures that programs are safe to run in the kernel. When using complex tail-call chains via <code>bpf_tail_call</code>, the verifier often fails with an 'invalid stack' or 'depth limit' error. This occurs because the verifier must track the state across potential jumps, and the combined instruction count or stack depth can exceed the limits (1 million instructions or 32 tail-calls).</p>",
    "root_cause": "State pruning failures and stack frame overlap when passing context through multiple programs in a tail-call map.",
    "bad_code": "struct data_t { char buf[512]; };\nSEC(\"kprobe/sys_execve\")\nint bpf_prog1(struct pt_regs *ctx) {\n    struct data_t d = {};\n    // ... complex logic ...\n    bpf_tail_call(ctx, &jmp_table, 2);\n    return 0;\n}",
    "solution_desc": "Reduce stack usage per program by using per-CPU maps for large buffers instead of the stack. Ensure the return value of the tail call is handled and that the register state is cleared before the call to allow the verifier to prune the search path effectively.",
    "good_code": "SEC(\"kprobe/sys_execve\")\nint bpf_prog1(struct pt_regs *ctx) {\n    struct data_t *d = bpf_map_lookup_elem(&scratchpad, &zero);\n    if (!d) return 0;\n    // Logic ...\n    bpf_tail_call(ctx, &jmp_table, 2);\n    return 0; // Fallback if tail call fails\n}",
    "verification": "Use 'bpftool prog load -v' to inspect the verifier log and confirm that the stack depth remains within the 512-byte limit.",
    "date": "2026-02-27",
    "id": 1772174520,
    "type": "error"
});