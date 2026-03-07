window.onPostDataLoaded({
    "title": "Debugging AF_XDP Zero-Copy Descriptor Ring Synchronization",
    "slug": "linux-kernel-af-xdp-zc-sync",
    "language": "C / Rust",
    "code": "Race Condition",
    "tags": [
        "Rust",
        "Infra",
        "Networking",
        "Error Fix"
    ],
    "analysis": "<p>AF_XDP provides high-performance packet processing by bypassing much of the kernel network stack. However, when using Zero-Copy (ZC) mode, synchronization between the user-space application and the kernel-space driver becomes critical. In ZC mode, the NIC hardware directly accesses the UMEM. If the Fill Ring and Completion Ring pointers are not updated with proper memory barriers, the kernel may attempt to read descriptors that haven't been fully initialized by the application, leading to dropped packets or memory corruption.</p>",
    "root_cause": "The failure typically occurs when the user-space producer updates the 'prod' head pointer before ensuring that the descriptor data (addr, len) is globally visible to the kernel/NIC, or when it fails to handle the cached producer/consumer offsets correctly.",
    "bad_code": "/* Missing memory barrier before submitting descriptors */\nu32 idx;\nif (xsk_ring_prod__reserve(&xsk->fill, batch_size, &idx) == batch_size) {\n    for (int i = 0; i < batch_size; i++) {\n        *xsk_ring_prod__fill_addr(&xsk->fill, idx + i) = desc[i].addr;\n    }\n    xsk->fill.cached_prod += batch_size;\n    /* BUG: Directly updating the producer pointer without a write barrier */\n    *xsk->fill.producer = xsk->fill.cached_prod;\n}",
    "solution_desc": "Use the provided libbpf/libxdp helper functions which encapsulate the necessary smp_wmb() (write memory barriers). Always use xsk_ring_prod__submit to ensure the kernel sees a consistent state of the ring buffer and that all descriptor writes are committed before the pointer update.",
    "good_code": "u32 idx;\nif (xsk_ring_prod__reserve(&xsk->fill, batch_size, &idx) == batch_size) {\n    for (int i = 0; i < batch_size; i++) {\n        *xsk_ring_prod__fill_addr(&xsk->fill, idx + i) = desc[i].addr;\n    }\n    /* Correctly handles memory barriers and producer pointer visibility */\n    xsk_ring_prod__submit(&xsk->fill, batch_size);\n}",
    "verification": "Monitor 'rx_dropped' and 'rx_invalid_descs' via 'ethtool -S <iface>'. Use 'perf' to check for cache misses in the xsk_poll path.",
    "date": "2026-03-07",
    "id": 1772857119,
    "type": "error"
});