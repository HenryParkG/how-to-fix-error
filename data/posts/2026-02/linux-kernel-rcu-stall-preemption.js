window.onPostDataLoaded({
    "title": "Solving RCU Stall Warnings in RT Kernels",
    "slug": "linux-kernel-rcu-stall-preemption",
    "language": "C / Kernel",
    "code": "RCU_STALL_WARN",
    "tags": [
        "Docker",
        "Infra",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>In Linux kernels configured with CONFIG_PREEMPT_RT, Read-Copy Update (RCU) stall warnings occur when a grace period is delayed for too long. Unlike standard kernels, the Real-Time patch changes RCU callbacks to run in kthread context, making them susceptible to priority inversion or starvation from high-priority RT tasks. This is particularly frequent in embedded systems where a tight loop in an RT thread starves the RCU kthreads (rcu_preempt or rcu_sched), preventing them from acknowledging quiescent states.</p>",
    "root_cause": "An RT thread running at a high priority (99) enters a CPU-intensive loop without reaching a quiescent state or yielding, preventing the RCU grace period kthread from running on that CPU.",
    "bad_code": "void rt_task_loop(void) {\n    while (data_pending) {\n        // High priority RT task spinning\n        process_data_packet(next_packet());\n        // No voluntary preemption point\n    }\n}",
    "solution_desc": "Insert voluntary preemption points using rcu_read_unlock() followed by a rescheduling call or ensure the RCU grace period kthread has its priority boosted to match or exceed the spinning task to allow it to progress.",
    "good_code": "void rt_task_loop(void) {\n    while (data_pending) {\n        rcu_read_lock();\n        process_data_packet(next_packet());\n        rcu_read_unlock();\n        // Allow RCU grace period kthreads to run\n        cond_resched(); \n    }\n}",
    "verification": "Check dmesg for 'INFO: rcu_preempt self-detected stall on CPU' logs and use 'cyclictest' to ensure latency remains within bounds.",
    "date": "2026-02-15",
    "id": 1771147409,
    "type": "error"
});