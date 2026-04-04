window.onPostDataLoaded({
    "title": "Fixing eBPF Verifier Rejections in Tail-Call Architectures",
    "slug": "fixing-ebpf-verifier-tail-call-rejections",
    "language": "Go / C",
    "code": "VerifierError",
    "tags": [
        "Go",
        "Linux",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In complex eBPF networking pipelines, developers often exceed the single-program instruction limit (1 million instructions), necessitating the use of tail-calls. However, the eBPF verifier enforces a maximum tail-call depth of 33 to prevent infinite loops. A common rejection occurs when the verifier cannot prove the stack depth remains within the 512-byte limit across calls or when program types mismatch between the caller and the target in the program map.</p>",
    "root_cause": "Program map mismatches or exceeding the maximum stack frame size when jumping between nested eBPF programs.",
    "bad_code": "struct bpf_map_def SEC(\"maps\") jmp_table = { .type = BPF_MAP_TYPE_PROG_ARRAY, .max_entries = 8 };\n\nSEC(\"classifier\") int entry(struct __sk_buff *skb) {\n    // Potential stack bloat before call\n    char buf[400]; \n    bpf_tail_call(skb, &jmp_table, 0);\n    return TC_ACT_OK;\n}",
    "solution_desc": "Ensure the stack is cleared before the tail-call and use 'bpf_tail_call_static' if available. Verify that all programs in the ProgArray share the exact same function signature and type.",
    "good_code": "SEC(\"classifier\") int entry(struct __sk_buff *skb) {\n    // Keep stack usage minimal before tail call\n    bpf_tail_call(skb, &jmp_table, 0);\n    // Fallback if tail call fails\n    return TC_ACT_SHOT;\n}",
    "verification": "Use 'bpftool prog load' and check 'dmesg' for 'tail_call_cnt' or 'invalid indirect read' errors.",
    "date": "2026-04-04",
    "id": 1775295045,
    "type": "error"
});