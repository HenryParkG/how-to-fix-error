window.onPostDataLoaded({
    "title": "Resolving Redis Fork-Induced Latency Spikes",
    "slug": "redis-fork-cow-latency-spikes",
    "language": "Docker",
    "code": "LatencySpike",
    "tags": [
        "Redis",
        "Linux",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>When Redis performs a BGSAVE or BGREWRITEAOF, it calls 'fork()'. While fork is theoretically O(1) via Copy-on-Write (CoW), the OS must still copy the page table of the parent process. For large Redis instances (e.g., 50GB+), this page table can be hundreds of megabytes. If Transparent Huge Pages (THP) are enabled, the kernel may stall during the copy process to manage page allocation, leading to significant latency spikes for client requests during the fork start.</p>",
    "root_cause": "Linux Transparent Huge Pages (THP) causing excessive memory management overhead and blocking during the fork() syscall for background persistence.",
    "bad_code": "# Standard Redis Docker deployment without host tuning\nservices:\n  redis:\n    image: redis:latest\n    command: redis-server --save 60 1 --loglevel notice",
    "solution_desc": "Disable Transparent Huge Pages at the OS level and ensure 'vm.overcommit_memory' is set to 1. This prevents the kernel from attempting to defragment memory during the CoW process, allowing fork() to complete significantly faster.",
    "good_code": "# Host-level fix before starting container\necho never > /sys/kernel/mm/transparent_hugepage/enabled\nsysctl vm.overcommit_memory=1\n\n# Redis config tuning\nCONFIG SET latency-monitor-threshold 100",
    "verification": "Check 'redis-cli --intrinsic-latency 100' during a BGSAVE operation and monitor the 'latest_fork_usec' field in 'INFO stats'.",
    "date": "2026-04-15",
    "id": 1776247760,
    "type": "error"
});