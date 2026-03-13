window.onPostDataLoaded({
    "title": "Fixing Linux Kernel RCU Stalls in High-Core KVM Instances",
    "slug": "fix-kvm-linux-rcu-stalls",
    "language": "C",
    "code": "RCU Stall Warning",
    "tags": [
        "Kubernetes",
        "Infra",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>Virtual machines with high CPU counts (e.g., 64+ vCPUs) frequently encounter Read-Copy-Update (RCU) stalls. This happens when a CPU fails to pass through a quiescent state within a timeout period (default 21s). In KVM environments, this is usually caused by the host's scheduler not providing enough execution time to the RCU grace-period kthreads, or by 'noisy neighbor' interference that delays the kernel's internal cleanup processes.</p>",
    "root_cause": "CPU oversubscription and insufficient priority for RCU grace-period kthreads leading to grace-period expiration.",
    "bad_code": "# Default kernel parameters on many distributions\n# GRUB_CMDLINE_LINUX_DEFAULT=\"quiet splash\"",
    "solution_desc": "Offload RCU callbacks to specific CPUs and increase the RCU grace period timeout via kernel boot parameters. This prevents the primary worker cores from being interrupted by RCU overhead and gives the kernel more time to manage state on busy instances.",
    "good_code": "# Update /etc/default/grub with these parameters\nGRUB_CMDLINE_LINUX_DEFAULT=\"rcu_nocbs=1-63 rcutree.rcu_idle_gp_delay=4 rcutree.gp_timeout=60\"",
    "verification": "Check 'dmesg | grep RCU' after stress testing the instance. Stall warnings should no longer appear.",
    "date": "2026-03-13",
    "id": 1773364466,
    "type": "error"
});