window.onPostDataLoaded({
    "title": "Fixing eBPF Verifier Limits in Nested Packet Filters",
    "slug": "ebpf-verifier-complexity-nested-filters",
    "language": "Rust",
    "code": "VerifierLimitExceeded",
    "tags": [
        "Rust",
        "Go",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>When developing complex eBPF programs for deep packet inspection, developers often hit the verifier's complexity limit (1 million instructions). This occurs because the verifier performs a depth-first search of all possible execution paths. With deeply nested packet headers or unrolled loops, the state space explodes, causing the verifier to reject the program even if it is logically sound.</p>",
    "root_cause": "The verifier's state pruning fails to consolidate similar execution paths in highly branched code, leading to an 'insufficient complexity budget' error during load time.",
    "bad_code": "struct hdr *h = data;\nif (h->type == TYPE_A) {\n    // 50 lines of logic\n    if (h->sub_type == SUB_1) {\n        // 100 lines of logic\n        if (h->inner_type == INNER_X) {\n            // More nesting...\n        }\n    }\n}",
    "solution_desc": "Refactor the monolithic filter into smaller, tail-called programs or utilize BPF-to-BPF function calls. Tail calls allow jumping to a new program context, resetting the complexity budget, while BPF-to-BPF calls allow the verifier to analyze functions independently.",
    "good_code": "SEC(\"classifier/step1\")\nint handle_step1(struct __sk_buff *skb) {\n    // Process layer 1\n    bpf_tail_call(skb, &jmp_table, NEXT_STEP);\n    return TC_ACT_OK;\n}\n\nSEC(\"classifier/step2\")\nint handle_step2(struct __sk_buff *skb) {\n    // Process layer 2 with fresh budget\n    return TC_ACT_OK;\n}",
    "verification": "Use `bpftool prog load` and monitor the `processed_insn` count in the verifier log to ensure it stays within limits.",
    "date": "2026-04-29",
    "id": 1777441576,
    "type": "error"
});