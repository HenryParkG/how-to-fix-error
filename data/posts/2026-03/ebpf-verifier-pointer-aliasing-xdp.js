window.onPostDataLoaded({
    "title": "Fixing eBPF Verifier Pointer-Aliasing in XDP",
    "slug": "ebpf-verifier-pointer-aliasing-xdp",
    "language": "Rust",
    "code": "R1_type_inv",
    "tags": [
        "Rust",
        "Networking",
        "eBPF",
        "Error Fix"
    ],
    "analysis": "<p>High-performance XDP programs often fail verification due to pointer aliasing. The eBPF verifier uses path-sensitive analysis to track register states. When a packet pointer is copied to another register or passed through a function boundary without proper spill/fill tracking, the verifier loses track of the 'bounds-checked' status of that pointer.</p><p>In XDP, you must prove that any access to `data` is within the range of `[data, data_end]`. If you check bounds on register R2, but then attempt to access memory using an alias register R3 that was copied from R2 *before* the check, the verifier rejects the program even though the logic seems sound to the developer.</p>",
    "root_cause": "The verifier performs abstract interpretation. If a pointer is aliased before a bounds check, the metadata (range) is only applied to the register used in the comparison, not its previously stored aliases.",
    "bad_code": "void *data = (void *)(long)ctx->data;\nvoid *data_end = (void *)(long)ctx->data_end;\nstruct ethhdr *eth = data;\nstruct ethhdr *eth_alias = eth;\n\nif (eth + 1 > data_end) return XDP_DROP;\n// Error: Verifier doesn't propagate bounds to eth_alias\nu16 proto = eth_alias->h_proto;",
    "solution_desc": "Use the original bounds-checked register directly or use 'compiler barriers' and explicit re-checks. In modern eBPF, the most reliable way is to perform the check immediately before the access and avoid unnecessary aliasing or to use inline functions with the `__always_inline` attribute to help the verifier maintain context.",
    "good_code": "void *data = (void *)(long)ctx->data;\nvoid *data_end = (void *)(long)ctx->data_end;\nstruct ethhdr *eth = data;\n\nif ((void *)(eth + 1) > data_end) return XDP_DROP;\n// Access via the checked pointer directly\nu16 proto = eth->h_proto;",
    "verification": "Run `bpftool prog load` and inspect the verifier log for 'R[n] offset is outside of the allowed memory range' errors.",
    "date": "2026-03-21",
    "id": 1774074752,
    "type": "error"
});