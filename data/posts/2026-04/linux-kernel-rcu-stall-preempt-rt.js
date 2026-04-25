window.onPostDataLoaded({
    "title": "Fixing Linux RCU Stall Deadlocks in PREEMPT_RT",
    "slug": "linux-kernel-rcu-stall-preempt-rt",
    "language": "C",
    "code": "Deadlock",
    "tags": [
        "C",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In real-time Linux environments (PREEMPT_RT), RCU (Read-Copy-Update) read-side critical sections are preemptible. A stall occurs when a grace period is blocked because a CPU or task fails to report a quiescent state within the timeout period, often due to high-priority threads starving the RCU grace-period kthreads.</p>",
    "root_cause": "Priority inversion where a low-priority task holds an RCU read-side lock and is preempted by a high-priority CPU-bound task, preventing the grace period from completing.",
    "bad_code": "void worker_thread(void) {\n    rcu_read_lock();\n    while(data_not_processed) { \n        // Long-running loop without yielding in RT\n        process_sub_data();\n    }\n    rcu_read_unlock();\n}",
    "solution_desc": "Break long RCU read-side sections into smaller chunks with periodic yielding or use rcu_read_unlock()/lock() intervals to allow quiescent states to be recorded.",
    "good_code": "void worker_thread(void) {\n    while(data_not_processed) {\n        rcu_read_lock();\n        process_batch();\n        rcu_read_unlock();\n        cond_resched(); // Allow RCU grace period processing\n    }\n}",
    "verification": "Monitor dmesg for 'RCU CPU stall warnings' and use ftrace with the 'rcu' event enabled.",
    "date": "2026-04-25",
    "id": 1777080493,
    "type": "error"
});