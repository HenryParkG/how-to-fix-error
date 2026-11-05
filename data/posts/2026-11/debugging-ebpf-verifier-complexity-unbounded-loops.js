window.onPostDataLoaded({
    "title": "Fixing eBPF Verifier Complexity & Unbounded Loops",
    "slug": "debugging-ebpf-verifier-complexity-unbounded-loops",
    "language": "Rust",
    "code": "VerifierRejection",
    "tags": [
        "eBPF",
        "Linux",
        "Rust",
        "Kernel",
        "Error Fix"
    ],
    "analysis": "<p>The Linux kernel eBPF verifier statically analyzes bytecode to ensure memory safety, termination, and isolation. It maintains a state machine covering every possible branch and register value range. If the instruction traversal exceeds <code>BPF_COMPLEXITY_LIMIT_INSNS</code> (1,000,000 instructions in modern kernels) or encounters back-edges without verifiable termination bounds, loading fails with <code>BPF_PROG_LOAD: Argument list too long</code> or <code>back-edge from insn X to Y</code>.</p><p>This error commonly occurs when writing eBPF programs in C or Rust (using Aya or libbpf-rs) with loops containing dynamic bounds, or when unrolling complex loops causes combinatorial explosion of branch evaluation states inside the verifier.</p>",
    "root_cause": "The verifier cannot mathematically prove loop termination or scalar range bounds within the 1-million instruction exploration limit due to variable bounds or missing bounds-clamping primitives.",
    "bad_code": "// Aya Rust eBPF loop with dynamic slice bounds triggering verifier limit\npub fn parse_headers(ctx: &XdpContext) -> Result<u32, ()> {\n    let data = ctx.data();\n    let data_end = ctx.data_end();\n    let mut cursor = data;\n    \n    // Verifier cannot prove termination or maximum iterations statically\n    while cursor < data_end {\n        let val = unsafe { *(cursor as *const u8) };\n        if val == 0xFF {\n            return Ok(xdp_action::XDP_DROP);\n        }\n        cursor += 1;\n    }\n    Ok(xdp_action::XDP_PASS)\n}",
    "solution_desc": "Constrain loops with compile-time upper bounds, use '#pragma unroll' or bounded constant ranges, explicit register masking, or the 'bpf_loop()' helper (kernel >= 5.17) which enforces termination without path-state explosion.",
    "good_code": "// Constrained bounded loop with compile-time limit and verifier bound hints\npub fn parse_headers(ctx: &XdpContext) -> Result<u32, ()> {\n    let data = ctx.data();\n    let data_end = ctx.data_end();\n    let max_len = (data_end - data) as usize;\n    \n    // Explicit bounded limit prevents state explosion\n    const MAX_INSPECT_BYTES: usize = 64;\n    let bound = if max_len < MAX_INSPECT_BYTES { max_len } else { MAX_INSPECT_BYTES };\n\n    for i in 0..MAX_INSPECT_BYTES {\n        if i >= bound {\n            break;\n        }\n        let ptr = (data + i) as *const u8;\n        if ptr as usize + 1 > data_end {\n            break;\n        }\n        let val = unsafe { *ptr };\n        if val == 0xFF {\n            return Ok(xdp_action::XDP_DROP);\n        }\n    }\n    Ok(xdp_action::XDP_PASS)\n}",
    "verification": "Compile with clang/cargo-bpf and run 'veristat <obj>.o' or execute 'bpftool prog load <obj>.o /sys/fs/bpf/prog log_level 2' to verify instructions analyzed stay well below 1,000,000.",
    "date": "2026-11-05",
    "id": 1793852402,
    "type": "error"
});