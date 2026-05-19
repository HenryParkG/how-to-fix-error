window.onPostDataLoaded({
    "title": "Debugging eBPF Verifier Complexity Limits",
    "slug": "debugging-ebpf-verifier-complexity-limits",
    "language": "Go / C",
    "code": "BPF_PROG_LOAD_EACCES",
    "tags": [
        "Go",
        "Infra",
        "eBPF",
        "C",
        "Error Fix"
    ],
    "analysis": "<p>The eBPF verifier is a sophisticated static analyzer that ensures BPF programs are safe to execute in the kernel. When developing large-scale network filters (like XDP or TC), developers often hit the 1 million instruction complexity limit. This isn't necessarily about the number of lines of code, but the number of potential execution paths. High branching factor, complex loops, and extensive use of map lookups increase the state space the verifier must explore.</p>",
    "root_cause": "The verifier performs state pruning to manage complexity, but deeply nested conditional logic and large unrolled loops cause 'path explosion,' exceeding the maximum complexity budget (typically 1M instructions explored).",
    "bad_code": "for (int i = 0; i < MAX_ITER; i++) {\n    if (data + offset > data_end) break;\n    // Complex nested logic here without boundary hints\n    if (payload[i] == 0x01) { /* ... */ }\n    else if (payload[i] == 0x02) { /* ... */ }\n}",
    "solution_desc": "Refactor the program to use tail calls to break the logic into smaller, independent programs, or use BPF-to-BPF function calls which allow the verifier to analyze functions in isolation. Additionally, use #pragma unroll for loops and ensure strict bounds checking to prune invalid paths early.",
    "good_code": "static __always_inline int process_packet(struct xdp_md *ctx) {\n    // BPF-to-BPF call reduces verifier state duplication\n    return handle_logic(ctx);\n}\n\nSEC(\"xdp\")\nint xdp_prog(struct xdp_md *ctx) {\n    return process_packet(ctx);\n}",
    "verification": "Run 'bpftool prog load' with the 'visualize' or verbose log level 2 to see the 'processed instructions' count and path analysis.",
    "date": "2026-05-19",
    "id": 1779191761,
    "type": "error"
});