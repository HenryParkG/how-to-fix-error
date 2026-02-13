window.onPostDataLoaded({
    "title": "eBPF Verifier: Navigating the 1-Million Instruction Limit",
    "slug": "ebpf-verifier-instruction-limit-fix",
    "language": "C / Go",
    "code": "VerifierExhaustion",
    "tags": [
        "Go",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>The eBPF verifier is a sophisticated static analyzer that ensures BPF programs are safe to run in the kernel. However, it operates on a 'complexity' budget. For every branch in your code, the verifier must explore the state. While modern kernels have increased the limit to 1 million processed instructions, complex logic—especially loops and heavy unrolling—can quickly exceed this threshold, causing the loader to fail with 'program too complex'.</p>",
    "root_cause": "The verifier performs a depth-first search of all possible execution paths. Large programs with many conditional branches or unrolled loops create a state explosion where the total number of instructions 'verified' exceeds 1,000,000, even if the actual binary is small.",
    "bad_code": "#define LOOP_SIZE 512\n\nSEC(\"socket\")\nint handle_packet(struct __sk_buff *skb) {\n    // Unrolling a large loop causes the verifier to track state for every iteration\n    #pragma clang loop unroll(full)\n    for (int i = 0; i < LOOP_SIZE; i++) {\n        // Complex logic inside a branch\n        if (data_end > data + i) {\n            process_byte(data[i]);\n        }\n    }\n    return 1;\n}",
    "solution_desc": "Break the program into smaller, sub-verifiable units using BPF-to-BPF function calls (__noinline). This forces the verifier to analyze the function once in isolation rather than unrolling its state into the main program's path. Alternatively, use tail calls to transition to a new program context, resetting the instruction count.",
    "good_code": "__noinline\nstatic int process_data(struct __sk_buff *skb, int offset) {\n    // Isolated logic for the verifier\n    return 0;\n}\n\nSEC(\"socket\")\nint handle_packet(struct __sk_buff *skb) {\n    for (int i = 0; i < 10; i++) {\n        process_data(skb, i);\n    }\n    return 1;\n}",
    "verification": "Use 'bpftool prog load' and check if the verifier log shows successful completion without 'processed XXX instructions, stack depth YYY' errors.",
    "date": "2026-02-13",
    "id": 1770975346,
    "type": "error"
});