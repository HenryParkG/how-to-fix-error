window.onPostDataLoaded({
    "title": "Fixing eBPF Verifier Instruction Limit & Load Failures",
    "slug": "ebpf-verifier-complexity-limit-failures",
    "language": "Rust",
    "code": "BPF_PROG_LOAD E2BIG",
    "tags": [
        "eBPF",
        "Linux",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>The Linux kernel eBPF verifier statically analyzes all possible execution paths to enforce memory safety and guarantee termination. When a program contains complex multi-branch logic, wide pointer tracking, or iterative packet parsing, the state exploration space explodes. Once the verifier exceeds its instruction complexity limit (<code>BPF_COMPLEXITY_LIMIT_INSNS</code>, historically 4,096 in older kernels and 1,000,000 in modern kernels), or runs out of allocated state stack memory, <code>bpf(BPF_PROG_LOAD)</code> fails with <code>-E2BIG</code> or <code>-EINVAL</code>.</p>",
    "root_cause": "State branch explosion caused by dynamic loop bounds and unconstrained variable reads where the verifier must explore 2^N branch possibilities without pruning equivalent states.",
    "bad_code": "#![no_std]\n#![no_main]\nuse aya_ebpf::bindings::xdp_action;\nuse aya_ebpf::macros::xdp;\nuse aya_ebpf::programs::XdpContext;\n\n#[xdp]\npub fn parse_packets(ctx: XdpContext) -> u32 {\n    let data = ctx.data();\n    let data_end = ctx.data_end();\n    let mut offset = 14; // Skip Ethernet\n\n    // Bug: Dynamic unbounded loop without bounded verifier hints\n    // causes verifier state explosion and load rejection.\n    for _ in 0..128 {\n        if data + offset + 4 > data_end {\n            break;\n        }\n        let val = unsafe { *((data + offset) as *const u32) };\n        if val == 0xDEADBEEF {\n            return xdp_action::XDP_DROP;\n        }\n        offset += (val & 0x0F) as usize;\n    }\n    xdp_action::XDP_PASS\n}",
    "solution_desc": "Constrain loop bounds explicitly, ensure packet boundary checks rely on fixed arithmetic bounds, and use bounded bitwise masks to guarantee value ranges to the verifier. Splitting complex logic into subprograms via BPF-to-BPF function calls allows the verifier to check functions in isolation.",
    "good_code": "#![no_std]\n#![no_main]\nuse aya_ebpf::bindings::xdp_action;\nuse aya_ebpf::macros::xdp;\nuse aya_ebpf::programs::XdpContext;\n\n#[inline(always)]\nfn check_payload(data: usize, offset: usize, data_end: usize) -> Option<usize> {\n    // Bound offset increment explicitly with bitmask to restrict verifier range\n    let safe_offset = offset & 0x3FF;\n    if data + safe_offset + 4 > data_end {\n        return None;\n    }\n    let val = unsafe { *((data + safe_offset) as *const u32) };\n    if val == 0xDEADBEEF {\n        Some(0)\n    } else {\n        Some((val & 0x07) as usize + 4)\n    }\n}\n\n#[xdp]\npub fn parse_packets(ctx: XdpContext) -> u32 {\n    let data = ctx.data();\n    let data_end = ctx.data_end();\n    let mut offset = 14;\n\n    // Bounded iterations with deterministic state progression\n    for _ in 0..16 {\n        match check_payload(data, offset, data_end) {\n            Some(0) => return xdp_action::XDP_DROP,\n            Some(step) => offset += step,\n            None => break,\n        }\n    }\n    xdp_action::XDP_PASS\n}",
    "verification": "Load the compiled object using `bpftool prog load` with verifier log level 2 (`bpftool prog load prog.o /sys/fs/bpf/prog log_level 2`) and ensure verification completes with under 50,000 processed instructions.",
    "date": "2026-08-27",
    "id": 1787851309,
    "type": "error"
});