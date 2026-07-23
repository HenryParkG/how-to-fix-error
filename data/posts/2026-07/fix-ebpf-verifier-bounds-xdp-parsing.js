window.onPostDataLoaded({
    "title": "Fix eBPF Verifier Bounds Tracking Failures in XDP",
    "slug": "fix-ebpf-verifier-bounds-xdp-parsing",
    "language": "C / eBPF",
    "code": "VerifierError",
    "tags": [
        "eBPF",
        "XDP",
        "Linux",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>When processing network packets in XDP (eXpress Data Path), the eBPF verifier tracks pointer bounds to prevent out-of-bounds memory access. When performing complex variable-length packet parsing (such as VLAN stacks, IPv6 extension headers, or VXLAN encapsulations), scalar arithmetic operations can lose track of min/max bounds across loop boundaries or conditional branches. This causes the kernel verifier to reject the eBPF program with errors like <code>invalid access to packet, off=X size=Y, R1 min value is outside permitted range</code>.</p>",
    "root_cause": "The eBPF verifier loses register range bounds (smin/smax/umax) after variable pointer arithmetic or bitwise masking operations when advancing packet pointers without explicit comparison against packet end boundaries.",
    "bad_code": "struct ethhdr *eth = data;\nif ((void *)(eth + 1) > data_end)\n    return XDP_DROP;\n\nuint16_t h_proto = eth->h_proto;\nvoid *next_hdr = eth + 1;\n\nif (h_proto == bpf_htons(ETH_P_8021Q)) {\n    struct vlan_hdr *vlan = next_hdr;\n    // Missing bounds check before access!\n    h_proto = vlan->h_vlan_encapsulated_proto;\n    next_hdr = vlan + 1;\n}\n\nstruct iphdr *iph = next_hdr;\n// Verifier fails here: next_hdr bounds lost in branch\nif ((void *)(iph + 1) > data_end)\n    return XDP_DROP;",
    "solution_desc": "Re-evaluate packet pointer bounds against data_end directly after every pointer arithmetic operation or variable offset calculation before dereferencing downstream headers.",
    "good_code": "struct ethhdr *eth = data;\nif ((void *)(eth + 1) > data_end)\n    return XDP_DROP;\n\nuint16_t h_proto = eth->h_proto;\nvoid *next_hdr = eth + 1;\n\nif (h_proto == bpf_htons(ETH_P_8021Q)) {\n    struct vlan_hdr *vlan = next_hdr;\n    if ((void *)(vlan + 1) > data_end)\n        return XDP_DROP;\n    h_proto = vlan->h_vlan_encapsulated_proto;\n    next_hdr = vlan + 1;\n}\n\nstruct iphdr *iph = next_hdr;\nif ((void *)(iph + 1) > data_end)\n    return XDP_DROP;",
    "verification": "Load the compiled XDP bytecode into the kernel using `bpftool prog load xdp_prog.o /sys/fs/bpf/xdp_prog` and verify that the verifier log outputs `processed X insns` with exit code 0.",
    "date": "2026-07-23",
    "id": 1784794358,
    "type": "error"
});