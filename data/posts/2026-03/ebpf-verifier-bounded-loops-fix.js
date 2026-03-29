window.onPostDataLoaded({
    "title": "Fixing eBPF Verifier Rejection of Bounded Loops",
    "slug": "ebpf-verifier-bounded-loops-fix",
    "language": "Go",
    "code": "BPF_VERIFIER_ERR",
    "tags": [
        "Go",
        "Backend",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>The eBPF verifier is notoriously strict because it must guarantee that a program cannot crash the kernel or hang indefinitely. While kernel 5.3+ supports bounded loops, the verifier often rejects them if it cannot statically prove the loop terminates. This usually happens when the loop induction variable is modified in a way that obscures its bounds from the verifier's scalar tracking engine.</p><p>When the verifier analyzes a loop, it performs symbolic execution. If it encounters a branching path where a register's range (min/max values) becomes 'unknown' or too wide, it will fail to validate the loop's safety, leading to a 'back-edge' error or 'loop iteration limit reached' exception.</p>",
    "root_cause": "The verifier fails to track the upper bound of a loop index when the boundary is derived from a pointer-to-stack or a map value that hasn't been explicitly capped using bitwise AND or conditional checks.",
    "bad_code": "for (int i = 0; i < some_map_val->limit; i++) {\n    // Verifier rejects this because limit is unknown\n    data[i] = 0;\n}",
    "solution_desc": "Use the 'bpf_for' macro or manually constrain the loop index using a bitwise AND operator to ensure the verifier knows the maximum possible iterations, even if the logic suggests it will finish earlier.",
    "good_code": "#define MAX_ITER 16\n#pragma clang loop unroll(disable)\nfor (int i = 0; i < MAX_ITER; i++) {\n    if (i >= some_map_val->limit) break;\n    data[i & 0x0F] = 0;\n}",
    "verification": "Run 'bpftool prog load' and check for 'processed N insns' without 'infinite loop detected' errors.",
    "date": "2026-03-29",
    "id": 1774767273,
    "type": "error"
});