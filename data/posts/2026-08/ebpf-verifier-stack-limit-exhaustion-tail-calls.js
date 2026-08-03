window.onPostDataLoaded({
    "title": "Fixing eBPF Verifier Stack Limit Exhaustion",
    "slug": "ebpf-verifier-stack-limit-exhaustion-tail-calls",
    "language": "C / eBPF",
    "code": "StackExhaustion",
    "tags": [
        "eBPF",
        "Linux",
        "Kubernetes",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>eBPF programs enforce a strict 512-byte stack frame limit per function. While tail calls conceptually replace the current program context without growing the call stack at runtime, the eBPF kernel verifier computes maximum stack depth by analyzing all potential subprogram calls and tail-call branches during program verification.</p><p>When chaining multiple eBPF programs via tail-call maps, allocating local context structs or large byte buffers on the stack within individual programs causes the cumulative stack usage across subprograms to exceed the 512-byte threshold. This results in the verifier rejecting the program at load time with errors such as <code>maximum stack depth exceeded</code>.</p>",
    "root_cause": "Declaring large stack variables in programs connected via tail calls or subprogram frames causes the verifier's call-graph stack analysis to exceed the 512-byte limit.",
    "bad_code": "#include <linux/bpf.h>\n#include <bpf/bpf_helpers.h>\n\nstruct packet_state {\n    char payload_buf[384]; // 384 bytes consumes most of the 512-byte stack\n    __u32 src_ip;\n    __u32 dst_ip;\n};\n\nSEC(\"tc\")\nint parse_ingress(struct __sk_buff *skb) {\n    struct packet_state state = {0}; // Local stack allocation\n    state.src_ip = 0x0100007F;\n    \n    // Verifier rejects this call chain if subprograms or tail-call paths exceed total stack depth\n    bpf_tail_call(skb, &jmp_map, 1);\n    return TC_ACT_OK;\n}",
    "solution_desc": "Replace local stack allocations with a single-element BPF_MAP_TYPE_PERCPU_ARRAY to serve as an explicit scratchpad memory area. Because per-CPU maps reside in kernel memory outside the program stack, stack usage drops from hundreds of bytes to a 8-byte pointer reference.",
    "good_code": "#include <linux/bpf.h>\n#include <bpf/bpf_helpers.h>\n\nstruct packet_state {\n    char payload_buf[384];\n    __u32 src_ip;\n    __u32 dst_ip;\n};\n\nstruct {\n    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);\n    __uint(max_entries, 1);\n    __type(key, __u32);\n    __type(value, struct packet_state);\n} scratchpad SEC(\".maps\");\n\nSEC(\"tc\")\nint parse_ingress(struct __sk_buff *skb) {\n    __u32 zero = 0;\n    struct packet_state *state = bpf_map_lookup_elem(&scratchpad, &zero);\n    if (!state)\n        return TC_ACT_SHOT;\n\n    state->src_ip = 0x0100007F;\n    bpf_tail_call(skb, &jmp_map, 1);\n    return TC_ACT_OK;\n}",
    "verification": "Load the compiled object file using `bpftool prog load` with full verifier debug logging enabled (`bpftool -d prog load ...`) and confirm that `stack depth` across all subprograms remains well below 128 bytes.",
    "date": "2026-08-03",
    "id": 1785759172,
    "type": "error"
});