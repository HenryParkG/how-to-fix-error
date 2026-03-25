window.onPostDataLoaded({
    "title": "Debugging RCU Callback Stalls in High-Core Linux Systems",
    "slug": "linux-kernel-rcu-callback-stalls",
    "language": "C",
    "code": "RCUStallError",
    "tags": [
        "Rust",
        "Infra",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>In Linux systems with high CPU counts (e.g., 128+ cores), Read-Copy-Update (RCU) stalls occur when the kernel detects that a CPU has failed to report a quiescent state for an extended period. This prevents RCU grace periods from ending, causing memory callbacks to pile up.</p><p>This often happens in containerized environments where heavy I/O or long-running softirqs prevent the RCU thread from running, eventually leading to system hangs or kernel panics during high-load periods.</p>",
    "root_cause": "A CPU core is stuck in a kernel loop or has interrupts disabled for too long, preventing the RCU grace period machinery from acknowledging that the CPU is 'done' with protected data.",
    "bad_code": "// Kernel module snippet without scheduling points\nwhile (data_to_process) {\n    process_packet(queue->next);\n    // Missing cond_resched() or RCU quiescent point\n    queue = queue->next;\n}",
    "solution_desc": "Inject scheduling points using `cond_resched()` in long loops and offload RCU callbacks to 'nocb' (no-callback) kthreads. This allows the RCU processing to happen on dedicated threads rather than strictly on the local CPU's softirq context.",
    "good_code": "// Solution: Add scheduling points and tune boot parameters\n// kernel/params: rcu_nocbs=0-127\nwhile (data_to_process) {\n    process_packet(queue->next);\n    cond_resched(); // Allows RCU and scheduler to intervene\n    queue = queue->next;\n}",
    "verification": "Check 'dmesg' for 'INFO: rcu_preempt self-detected stall on CPU'. Verify with 'rcutop' or by monitoring /proc/interrupts.",
    "date": "2026-03-25",
    "id": 1774421607,
    "type": "error"
});