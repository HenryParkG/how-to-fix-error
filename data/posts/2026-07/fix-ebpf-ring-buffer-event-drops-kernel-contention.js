window.onPostDataLoaded({
    "title": "Fix eBPF Ring Buffer Event Drops & Kernel Contention",
    "slug": "fix-ebpf-ring-buffer-event-drops-kernel-contention",
    "language": "Rust",
    "code": "ENOBUFS",
    "tags": [
        "eBPF",
        "Linux",
        "Rust",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>Under high event rates, legacy eBPF perf event arrays (BPF_MAP_TYPE_PERF_EVENT_ARRAY) experience severe memory buffer exhaustion and kernel locks. Because perf buffers allocate separate per-CPU ring buffers, unbalanced core workloads lead to localized ring overflows (ENOBUFS), while poll notifications flood userspace with cross-core interrupt overhead. Transitioning to BPF_MAP_TYPE_RINGBUF resolves memory fragmentation and kernel lock contention by utilizing a unified, lockless multi-producer single-consumer (MPSC) queue.</p>",
    "root_cause": "Per-CPU perf buffer memory starvation caused by core affinity imbalance combined with high lock contention during bpf_perf_event_output ring reserve failures.",
    "bad_code": "struct {\n    __uint(type, BPF_MAP_TYPE_PERF_EVENT_ARRAY);\n    __uint(key_size, sizeof(u32));\n    __uint(value_size, sizeof(u32));\n} pb SEC(\".maps\");\n\nSEC(\"kprobe/sys_enter\")\nint handle_sys_enter(struct pt_regs *ctx) {\n    struct event evt = { .pid = bpf_get_current_pid_tgid() >> 32 };\n    // High throughput causes ENOBUFS drops here\n    bpf_perf_event_output(ctx, &pb, BPF_F_CURRENT_CPU, &evt, sizeof(evt));\n    return 0;\n}",
    "solution_desc": "Replace BPF_MAP_TYPE_PERF_EVENT_ARRAY with BPF_MAP_TYPE_RINGBUF. Use bpf_ringbuf_reserve and bpf_ringbuf_commit to claim zero-copy memory directly in the ring buffer, preventing stack allocation copies and ring drops.",
    "good_code": "struct {\n    __uint(type, BPF_MAP_TYPE_RINGBUF);\n    __uint(max_entries, 16 * 1024 * 1024); /* 16MB shared ring */\n} rb SEC(\".maps\");\n\nSEC(\"kprobe/sys_enter\")\nint handle_sys_enter(struct pt_regs *ctx) {\n    struct event *evt;\n    evt = bpf_ringbuf_reserve(&rb, sizeof(*evt), 0);\n    if (!evt)\n        return 0; /* Handled gracefully without kernel drop overhead */\n    \n    evt->pid = bpf_get_current_pid_tgid() >> 32;\n    bpf_ringbuf_commit(evt, 0);\n    return 0;\n}",
    "verification": "Check ring buffer stats using `bpftool map dump` or process trace metrics using `bpftool prog profile` to confirm 0 dropped events under 500k+ req/sec loads.",
    "date": "2026-07-28",
    "id": 1785236946,
    "type": "error"
});