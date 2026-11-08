window.onPostDataLoaded({
    "title": "Fix eBPF Verifier Instruction Limit Exhaustion",
    "slug": "ebpf-verifier-rejection-instruction-limit",
    "language": "Rust",
    "code": "BPF_PROG_LOAD_EPERM",
    "tags": [
        "eBPF",
        "Linux",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>The Linux kernel eBPF verifier performs strict static analysis on BPF bytecode to guarantee memory safety, termination, and kernel protection against deadlocks. When programs contain complex loops, extensive packet parsing, or deeply nested branches, the verifier's simulated execution paths explode exponentially. In Linux kernels prior to 5.2, the verifier hard-capped instruction evaluation at 4,096 instructions; modern kernels allow up to 1,000,000 instructions (<code>BPF_COMPLEXITY_LIMIT_INSNS</code>). If non-linear variable bounds or state pruning failures prevent the verifier from proving convergence within this threshold, the kernel immediately rejects loading with <code>E2BIG</code> or <code>EPERM</code>.</p>",
    "root_cause": "Path explosion caused by unrolled dynamic loops and ambiguous boundary verification where the compiler cannot prove bounds on pointer offsets, forcing the verifier to explore redundant permutation states until hitting the 1,000,000 instruction budget.",
    "bad_code": "#[no_mangle]\npub fn parse_packets(ctx: *mut xdp_md) -> u32 {\n    let data = (*ctx).data as *const u8;\n    let data_end = (*ctx).data_end as *const u8;\n    let mut offset = 0usize;\n\n    // Unbounded or high-bound loop causes exponential state explosion in verifier\n    for _ in 0..128 {\n        unsafe {\n            if data.add(offset + 1) > data_end {\n                break;\n            }\n            let val = *data.add(offset);\n            if val == 0xFF {\n                return xdp_action::XDP_DROP;\n            }\n            // Dynamic step offset without explicit mask forces verifier path exploration\n            offset += (val as usize) + 1;\n        }\n    }\n    xdp_action::XDP_PASS\n}",
    "solution_desc": "Constrain iteration bounds using strict bitwise masking on index steps to keep the state space provably narrow. For complex packet parsing or heavy logic, refactor iterations into BPF-to-BPF subprogram calls with fixed iteration boundaries, or split processing logic across multiple programs connected via tail calls (`bpf_tail_call`).",
    "good_code": "#[no_mangle]\npub fn parse_packets(ctx: *mut xdp_md) -> u32 {\n    let data = (*ctx).data as usize;\n    let data_end = (*ctx).data_end as usize;\n    let mut cursor = data;\n\n    // Bounded iterations with explicit clamped stride\n    for _ in 0..16 {\n        if cursor + 1 > data_end {\n            break;\n        }\n        let val = unsafe { *(cursor as *const u8) };\n        if val == 0xFF {\n            return xdp_action::XDP_DROP;\n        }\n        // Masking offset guarantees bounded jump delta to verifier\n        let step = ((val as usize) & 0x0F) + 1;\n        cursor += step;\n    }\n    xdp_action::XDP_PASS\n}",
    "verification": "Load the compiled object using `bpftool prog load <object.o> /sys/fs/bpf/prog -d` or initialize with libbpf log level set to 2. Check the verifier output verifying that `processed <number> insns` is orders of magnitude below 1,000,000.",
    "date": "2026-11-08",
    "id": 1794108543,
    "type": "error"
});