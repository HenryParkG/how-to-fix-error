window.onPostDataLoaded({
    "title": "Fixing eBPF Stack Limit Violations in Tail Calls",
    "slug": "ebpf-stack-limit-violations-tail-calls",
    "language": "C",
    "code": "BPF_VERIFIER_STACK_LIMIT",
    "tags": [
        "Backend",
        "Docker",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>The eBPF verifier enforces a strict 512-byte stack limit for each program. While tail calls allow jumping to another program, they do not reset the stack frame in a way that allows for infinite expansion. When developers pass large structs or deep local buffers across tail-call logic, the cumulative stack usage or the verifier's path exploration often hits the 512-byte ceiling, causing program load failure.</p>",
    "root_cause": "Excessive allocation of local variables on the stack combined with verifier path analysis that tracks maximum stack depth across call chains.",
    "bad_code": "SEC(\"kprobe/sys_execve\")\nint bpf_prog1(struct pt_regs *ctx) {\n    char path[400]; // Too large for 512B stack\n    bpf_probe_read_user_str(&path, sizeof(path), (void *)PT_REGS_PARM1(ctx));\n    bpf_tail_call(ctx, &jmp_table, 2);\n    return 0;\n}",
    "solution_desc": "Offload large data structures from the stack into a per-CPU array map. This provides a 'scratchpad' area that bypasses the 512-byte stack limit while maintaining thread safety within the eBPF context.",
    "good_code": "struct { __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY); __uint(max_entries, 1); __type(key, u32); __type(value, char[400]); } scratchpad SEC(\".maps\");\n\nSEC(\"kprobe/sys_execve\")\nint bpf_prog1(struct pt_regs *ctx) {\n    u32 key = 0;\n    char *path = bpf_map_lookup_elem(&scratchpad, &key);\n    if (!path) return 0;\n    bpf_probe_read_user_str(path, 400, (void *)PT_REGS_PARM1(ctx));\n    bpf_tail_call(ctx, &jmp_table, 2);\n    return 0;\n}",
    "verification": "Run `bpftool prog load` and ensure the verifier output no longer reports 'Combined stack size of 512 bytes exceeded'.",
    "date": "2026-04-06",
    "id": 1775452576,
    "type": "error"
});