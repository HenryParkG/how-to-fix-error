window.onPostDataLoaded({
    "title": "Debugging Linux RCU Grace Period Stalls on High-Core CPUs",
    "slug": "linux-kernel-rcu-stall-debugging",
    "language": "C",
    "code": "RCU_STALL_ERROR",
    "tags": [
        "Go",
        "Infra",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>On systems with 128+ cores, RCU (Read-Copy-Update) grace period stalls often emerge due to internal lock contention or CPUs failing to report quiescent states. When a grace period extends beyond the timeout (default 21s), the kernel logs a stall, often freezing high-throughput networking or database tasks. In high-core environments, this is frequently triggered by IRQ storms or long-running tasks holding the CPU without preemption.</p>",
    "root_cause": "A CPU is stuck in a non-preemptible loop or has interrupts disabled for too long, preventing the RCU callback from executing and completing the grace period.",
    "bad_code": "/* Kernel module doing heavy work without yielding */\nwhile (data_pending) {\n    spin_lock_irqsave(&my_lock, flags);\n    process_huge_buffer(); // Takes > 25ms\n    spin_unlock_irqrestore(&my_lock, flags);\n}",
    "solution_desc": "Insert explicit quiescent state points using rcu_read_unlock() or cond_resched() if in process context, and ensure the RCU hierarchy is tuned for high-core counts via rcu_fanout parameters.",
    "good_code": "/* Yielding to RCU grace periods */\nwhile (data_pending) {\n    spin_lock_irqsave(&my_lock, flags);\n    process_small_chunk(); \n    spin_unlock_irqrestore(&my_lock, flags);\n    // Allow RCU processing and scheduler tasks\n    cond_resched(); \n}",
    "verification": "Check dmesg for 'rcu_preempt detected stalls' and monitor /proc/timer_list to ensure RCU grace period kthreads are scheduled.",
    "date": "2026-05-08",
    "id": 1778217803,
    "type": "error"
});