window.onPostDataLoaded({
    "title": "Mitigating Linux Kernel RCU Stall in Containers",
    "slug": "linux-kernel-rcu-sched-stall-containers",
    "language": "C / Shell",
    "code": "RCU_SCHED_STALL",
    "tags": [
        "Docker",
        "Kubernetes",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In high-density container environments, CPU overcommitment often leads to RCU (Read-Copy-Update) stall warnings. These stalls occur when a CPU core is stuck in a kernel loop or a long-running task, preventing the RCU subsystem from reaching a 'quiescent state'.</p><p>In Kubernetes clusters with aggressive CFS throttling, the scheduler might preempt a thread while it holds an RCU read-side critical section, delaying the grace period completion for all other threads and causing system-wide latency spikes or even kernel panics.</p>",
    "root_cause": "CPU starvation in multi-tenant environments where the Kworker or RCU grace-period threads are not scheduled within the default 21-second timeout due to CFS quota limits or high interrupt load.",
    "bad_code": "sysctl kernel.rcu_cpu_stall_timeout=21\n# Default settings often fail under 90%+ CPU utilization in nested cgroups",
    "solution_desc": "Increase the RCU stall timeout and offload RCU callbacks to specific housekeeping cores using the 'rcu_nocbs' kernel parameter to reduce the burden on worker cores.",
    "good_code": "sysctl -w kernel.rcu_cpu_stall_timeout=60\n# Kernel boot params:\n# rcu_nocbs=1-15 rcutree.kthread_prio=50",
    "verification": "Check 'dmesg | grep RCU' for stall logs and monitor '/proc/interrupts' to ensure balanced IRQ distribution.",
    "date": "2026-04-07",
    "id": 1775538281,
    "type": "error"
});