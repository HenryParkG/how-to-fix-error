window.onPostDataLoaded({
    "title": "Mitigating Linux Kernel Slab Fragmentation",
    "slug": "linux-kernel-slab-fragmentation",
    "language": "C",
    "code": "MEM_FRAG",
    "tags": [
        "Linux",
        "Infra",
        "Networking",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput packet processing (e.g., DPDK or XDP-based systems), the Linux SLUB allocator can suffer from severe external fragmentation. When packet metadata of varying sizes are allocated and freed at microsecond intervals, 'partial' slabs accumulate. These slabs cannot be reclaimed by the kernel because they contain a few long-lived objects, leading to high memory pressure even when the total bytes used is low.</p>",
    "root_cause": "The SLUB allocator's tendency to create new slabs instead of filling fragmented 'partial' lists when CPU-local caches are exhausted during high-interrupt networking loads.",
    "bad_code": "// Standard kmalloc for network metadata without cache alignment\nstruct pkt_meta *meta = kmalloc(sizeof(struct pkt_meta), GFP_KERNEL);\nif (!meta) return -ENOMEM;\n// ... process packet ...\nkfree(meta);",
    "solution_desc": "Define a dedicated `kmem_cache` for specific networking structures. By using `kmem_cache_create` with `SLAB_HWCACHE_ALIGN` and `SLAB_PANIC`, you ensure that objects are packed into uniform pages, reducing the 'scatter' of active objects across page frames.",
    "good_code": "struct kmem_cache *pkt_meta_cache;\n\nvoid init_driver(void) {\n    pkt_meta_cache = kmem_cache_create(\"pkt_meta_cache\",\n        sizeof(struct pkt_meta), 0,\n        SLAB_HWCACHE_ALIGN | SLAB_POISON, NULL);\n}\n\nvoid handle_packet(void) {\n    struct pkt_meta *meta = kmem_cache_alloc(pkt_meta_cache, GFP_ATOMIC);\n    // ... process packet ...\n    kmem_cache_free(pkt_meta_cache, meta);\n}",
    "verification": "Monitor /proc/slabinfo and check the 'num_objs' vs 'active_objs' ratio. A ratio closer to 1.0 indicates successful fragmentation mitigation.",
    "date": "2026-02-24",
    "id": 1771915850,
    "type": "error"
});