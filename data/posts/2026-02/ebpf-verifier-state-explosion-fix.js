window.onPostDataLoaded({
    "title": "Fixing eBPF Verifier State Explosion in Trace Programs",
    "slug": "ebpf-verifier-state-explosion-fix",
    "language": "C/eBPF",
    "code": "Verifier Limit Exceeded",
    "tags": [
        "Rust",
        "Go",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>eBPF programs must pass a verifier to ensure kernel safety. When writing complex tracing programs with nested loops or extensive conditional branching, the verifier attempts to explore every possible execution path. This often leads to 'state explosion,' where the number of verified instructions exceeds the kernel's complexity limit (typically 1 million instructions), causing the program to fail to load.</p>",
    "root_cause": "The verifier's path exploration complexity grows exponentially with nested branches, failing when the total states stored or instructions processed exceed BPF_COMPLEXITY_LIMIT_STATES.",
    "bad_code": "SEC(\"tp/syscalls/sys_enter_execve\")\nint handle_execve(void *ctx) {\n    struct task_struct *task = (struct task_struct *)bpf_get_current_task();\n    #pragma unroll\n    for (int i = 0; i < 64; i++) {\n        if (task->comm[i] == '\\0') break;\n        // Complex logic per character leads to state explosion\n        do_expensive_check(task->comm[i]);\n    }\n    return 0;\n}",
    "solution_desc": "Refactor the logic to use BPF subprograms (function calls) or the `bpf_loop` helper introduced in newer kernels. Subprograms allow the verifier to verify functions independently, while `bpf_loop` provides a bounded iteration mechanism that the verifier treats as a single state transition.",
    "good_code": "static int check_char(unsigned int i, void *ctx) {\n    char *comm = ctx;\n    if (comm[i] == '\\0') return 1;\n    do_expensive_check(comm[i]);\n    return 0;\n}\n\nSEC(\"tp/syscalls/sys_enter_execve\")\nint handle_execve(void *ctx) {\n    struct task_struct *task = (struct task_struct *)bpf_get_current_task();\n    bpf_loop(64, check_char, task->comm, 0);\n    return 0;\n}",
    "verification": "Use `bpftool prog load` and check the 'verified_insns' count; ensure it stays well below the 1M limit.",
    "date": "2026-02-15",
    "id": 1771131000,
    "type": "error"
});