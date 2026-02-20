window.onPostDataLoaded({
    "title": "Fixing Linux Kernel RCU Stall Warnings in Containers",
    "slug": "fixing-linux-kernel-rcu-stalls-containers",
    "language": "C",
    "code": "RCU_STALL",
    "tags": [
        "Docker",
        "Kubernetes",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>RCU (Read-Copy-Update) stall warnings occur when a grace period fails to complete within a specified timeout. In high-density container environments, this is frequently triggered by CPU overcommitment or 'Steal Time' from the hypervisor. When the Linux scheduler cannot grant enough cycles to the RCU callback threads, the kernel assumes a deadlock or a hung processor, leading to log spam or kernel panics.</p>",
    "root_cause": "Excessive vCPU contention and interrupt masking in multi-tenant environments preventing RCU grace periods from advancing.",
    "bad_code": "# Default settings often too aggressive for overcommitted cloud nodes\nkernel.rcu_cpu_stall_timeout = 21\n# No offloading of RCU callbacks\nGRUB_CMDLINE_LINUX_DEFAULT=\"quiet splash\"",
    "solution_desc": "Increase the stall timeout via sysctl and offload RCU callback processing to specific 'nocb' CPUs to reduce interference with application threads.",
    "good_code": "# Increase timeout to 60 seconds\nsysctl -w kernel.rcu_cpu_stall_timeout=60\n\n# Offload RCU in GRUB for CPUs 1-15\nGRUB_CMDLINE_LINUX_DEFAULT=\"rcu_nocbs=1-15\"",
    "verification": "Check dmesg for 'rcu_preempt detected stalls' after applying sysctl and verify /sys/module/rcutree/parameters/rcu_cpu_stall_timeout.",
    "date": "2026-02-20",
    "id": 1771562601,
    "type": "error"
});