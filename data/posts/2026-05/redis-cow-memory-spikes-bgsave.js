window.onPostDataLoaded({
    "title": "Fixing Redis CoW Memory Spikes during BGSAVE",
    "slug": "redis-cow-memory-spikes-bgsave",
    "language": "Redis",
    "code": "OOM Killer",
    "tags": [
        "Redis",
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When Redis performs background snapshots (via BGSAVE or replica syncs), it calls the Linux <code>fork()</code> system call to create a background process. Linux uses Copy-on-Write (CoW) to share physical memory pages. Under heavy write loads, any modification to keys forces the operating system to duplicate memory pages. If Transparent Huge Pages (THP) is enabled, the page allocation block size increases from 4KB to 2MB, resulting in a dramatic, unexpected spike in RAM usage that causes the OS Out-Of-Memory (OOM) Killer to terminate the Redis process.</p>",
    "root_cause": "With Linux Transparent Huge Pages (THP) active, the kernel allocates memory in 2MB chunks. Even small writes to a single key require copying an entire 2MB block instead of a standard 4KB page, leading to a huge multiplication of memory usage during background persistence.",
    "bad_code": "# Kernel configuration actively enabling Transparent Huge Pages\necho always > /sys/kernel/mm/transparent_hugepage/enabled\necho always > /sys/kernel/mm/transparent_hugepage/defrag\n\n# Dynamic overcommit disabled, denying allocations when physical memory is saturated\nsysctl vm.overcommit_memory=0",
    "solution_desc": "Disable Transparent Huge Pages (THP) system-wide, and configure the Linux virtual memory overcommit settings to allow overcommit allocations, ensuring BGSAVE forks succeed with fine-grained 4KB page allocations.",
    "good_code": "# Disable Transparent Huge Pages (THP) to keep CoW page resolution at 4KB\necho never > /sys/kernel/mm/transparent_hugepage/enabled\necho never > /sys/kernel/mm/transparent_hugepage/defrag\n\n# Configure kernel overcommit to mode 1 (allow all allocations)\nsysctl vm.overcommit_memory=1\necho \"vm.overcommit_memory = 1\" >> /etc/sysctl.conf\n\n# Set low memory fragmentation behaviors on Redis\n# redis-cli CONFIG SET active-defrag yes",
    "verification": "Execute a high-frequency write stress test with Redis while executing `redis-cli BGSAVE`. Verify via `INFO memory` that the memory allocation overhead remains minimal and that no OOM actions occur in the kernel ring buffer (`dmesg`).",
    "date": "2026-05-25",
    "id": 1779676571,
    "type": "error"
});