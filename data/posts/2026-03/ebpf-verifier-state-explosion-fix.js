window.onPostDataLoaded({
    "title": "Fixing eBPF Verifier State-Explosion in BPF-to-BPF Calls",
    "slug": "ebpf-verifier-state-explosion-fix",
    "language": "C",
    "code": "VerifierError",
    "tags": [
        "Go",
        "Linux",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>When developing complex eBPF programs, developers often encounter the 'BPF verifier limit reached' or 'state explosion' error. This occurs when the verifier attempts to explore every possible execution path in a program containing multiple nested BPF-to-BPF calls and conditional branches. As the number of paths grows exponentially, the verifier exceeds its instruction limit (1 million) or memory limit to ensure safety.</p>",
    "root_cause": "The verifier performs path-pruning to reduce complexity, but certain code patterns involving large stack frames and non-inlined function calls prevent the verifier from identifying redundant states, leading to an exponential search space.",
    "bad_code": "static __always_inline int process_packet(struct __sk_buff *skb) {\n    if (skb->len > 100) return check_header(skb);\n    return 0;\n}\n\nSEC(\"tc\")\nint handle_ingress(struct __sk_buff *skb) {\n    for (int i = 0; i < 10; i++) {\n        process_packet(skb);\n    }\n    return 1;\n}",
    "solution_desc": "Use the '__noinline' attribute for complex sub-functions. This forces the verifier to treat the function as a separate entity with its own state tracking, allowing for better path pruning and preventing the parent function's state from exploding. Additionally, use 'bpf_tail_call' for logic that is strictly independent.",
    "good_code": "__noinline int process_packet(struct __sk_buff *skb) {\n    if (skb->len > 100) return check_header(skb);\n    return 0;\n}\n\nSEC(\"tc\")\nint handle_ingress(struct __sk_buff *skb) {\n    #pragma unroll\n    for (int i = 0; i < 10; i++) {\n        process_packet(skb);\n    }\n    return 1;\n}",
    "verification": "Run 'bpftool prog load' and check the verifier log to ensure the 'insns processed' count is significantly reduced and no 'complexity limit' errors appear.",
    "date": "2026-03-12",
    "id": 1773297758,
    "type": "error"
});