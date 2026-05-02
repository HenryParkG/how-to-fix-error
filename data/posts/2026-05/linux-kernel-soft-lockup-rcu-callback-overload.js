window.onPostDataLoaded({
    "title": "Resolving Linux Kernel Soft Lockups from RCU Overload",
    "slug": "linux-kernel-soft-lockup-rcu-callback-overload",
    "language": "C / Linux",
    "code": "SoftLockup",
    "tags": [
        "Infra",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>A soft lockup occurs when the kernel detects that a CPU is spending too much time in kernel mode without yielding, often triggered by Read-Copy-Update (RCU) callback saturation. When a system undergoes massive file deletions or network socket teardowns, the RCU callback queue grows exponentially. If the ksoftirqd thread cannot keep up with the processing of these callbacks, the CPU remains trapped in a loop, triggering the 'watchdog: BUG: soft lockup' message in dmesg.</p>",
    "root_cause": "The RCU callback queue exceeds the processing capacity of the CPU, causing the RCU grace period kthread to starve other processes and trigger the watchdog timer.",
    "bad_code": "## Default sysctl settings often allow high callback accumulation\nsysctl kernel.watchdog_thresh=20\n# No RCU offloading configured in boot params\nGRUB_CMDLINE_LINUX_DEFAULT=\"quiet splash\"",
    "solution_desc": "Offload RCU callback processing to dedicated 'rcuo' kthreads to prevent them from blocking the execution of high-priority system tasks on specific CPUs.",
    "good_code": "## Update GRUB to offload RCU callbacks (e.g., for CPUs 1-7)\nGRUB_CMDLINE_LINUX_DEFAULT=\"quiet splash rcu_nocbs=1-7\"\n\n## Adjust RCU processing limit via sysctl\nsysctl -w kernel.rcu_resched_ns=10000000",
    "verification": "Monitor /proc/softirqs and check for 'RCU' increments. Use 'rcu_perf' or 'rcutop' to ensure callbacks are distributed across offloaded threads.",
    "date": "2026-05-02",
    "id": 1777686863,
    "type": "error"
});