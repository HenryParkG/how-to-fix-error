window.onPostDataLoaded({
    "title": "Fix eBPF Verifier Stack Limit Failures in Tail Calls",
    "slug": "fix-ebpf-verifier-stack-limit-failures-tail-calls",
    "language": "C / eBPF",
    "code": "MAX_TAIL_CALL_STACK_EXCEEDED",
    "tags": [
        "eBPF",
        "Linux",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>The eBPF verifier enforces strict kernel safety constraints, including a total stack depth limit of 512 bytes per function frame. When chaining multiple programs via <code>bpf_tail_call</code>, the verifier computes static depth bounds across execution paths. While tail calls perform a jump and re-use frame constructs at runtime, the static path analysis of the kernel verifier conservatively computes accumulated local frame pointer offsets across target program paths. If nested tail call handlers allocate large structures on their stack frame rather than using scratch buffers, the verifier rejects the program with a stack depth limit exceeded error during load time.</p>",
    "root_cause": "Local arrays and structures defined on the stack in tail-called programs cause individual frame sizes to exceed conservative static verifier stack limit tracking (512 bytes per subprogram frame boundary).",
    "bad_code": "#include <linux/bpf.h>\n#include <bpf/bpf_helpers.h>\n\nstruct prog_array {\n    __uint(type, BPF_MAP_TYPE_PROG_ARRAY);\n    __uint(max_entries, 8);\n    __uint(key_size, sizeof(__u32));\n    __uint(value_size, sizeof(__u32));\n} jmp_table SEC(\".maps\");\n\nSEC(\"classifier\")\nint handle_ingress(struct __sk_buff *skb) {\n    // 400 bytes on stack in caller program\n    char payload_buf[400];\n    bpf_skb_load_bytes(skb, 0, payload_buf, sizeof(payload_buf));\n    \n    bpf_tail_call(skb, &jmp_table, 1);\n    return 0;\n}\n\nSEC(\"classifier/tail_target\")\nint nested_tail_target(struct __sk_buff *skb) {\n    // 300 bytes on stack in target program -> Total stack > 512 bytes limit!\n    char header_buf[300];\n    bpf_skb_load_bytes(skb, 0, header_buf, sizeof(header_buf));\n    bpf_printk(\"Processing tail: %d\", header_buf[0]);\n    return 0;\n}",
    "solution_desc": "Refactor local variables off the program stack by utilizing a zero-allocation `BPF_MAP_TYPE_PERCPU_ARRAY` scratchpad map. This reduces stack frame utilization in both the caller and target tail-call programs to well below the 512-byte limit.",
    "good_code": "#include <linux/bpf.h>\n#include <bpf/bpf_helpers.h>\n\nstruct scratch_buf {\n    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);\n    __uint(max_entries, 1);\n    __type(key, __u32);\n    __type(value, char[512]);\n} scratch_map SEC(\".maps\");\n\nSEC(\"classifier\")\nint handle_ingress(struct __sk_buff *skb) {\n    __u32 zero = 0;\n    char *buf = bpf_map_lookup_elem(&scratch_map, &zero);\n    if (!buf) return 0;\n\n    bpf_skb_load_bytes(skb, 0, buf, 256);\n    bpf_tail_call(skb, &jmp_table, 1);\n    return 0;\n}\n\nSEC(\"classifier/tail_target\")\nint nested_tail_target(struct __sk_buff *skb) {\n    __u32 zero = 0;\n    char *buf = bpf_map_lookup_elem(&scratch_map, &zero);\n    if (!buf) return 0;\n\n    bpf_skb_load_bytes(skb, 0, buf, 128);\n    bpf_printk(\"Processing safely: %d\", buf[0]);\n    return 0;\n}",
    "verification": "Load the BPF program using `bpftool prog load` with detailed logging (`bpftool prog load ... debug`). Inspect the verifier output to confirm stack usage remains low (e.g., `stack depth 12 + 16`) and that no `MAX_BPF_STACK` limit errors are raised.",
    "date": "2026-08-12",
    "id": 1786509688,
    "type": "error"
});