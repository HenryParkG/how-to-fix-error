window.onPostDataLoaded({
    "title": "Fixing Redis Copy-on-Write Spikes during BGSAVE",
    "slug": "fixing-redis-cow-memory-spikes-bgsave",
    "language": "Redis",
    "code": "OOM / Memory Spike",
    "tags": [
        "Docker",
        "AWS",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>Redis uses a child process fork via <code>BGSAVE</code> to asynchronously write snapshots to disk without blocking the main event thread. Under the hood, this relies on Linux Copy-on-Write (CoW). However, during periods of heavy write operations, memory consumption can spike catastrophically, occasionally doubling memory usage and triggering the kernel's Out-Of-Memory (OOM) killer. This occurs because every write changes data on memory pages, forcing the OS to clone the page. The spike is severely amplified if Transparent Huge Pages (THP) are enabled on the host system.</p>",
    "root_cause": "The Linux host operating system has Transparent Huge Pages (THP) enabled, causing CoW to duplicate massive 2MB memory blocks instead of standard 4KB pages when individual keys are modified.",
    "bad_code": "# Default OS settings and incorrect overcommit_memory parameters\n# in host systems running containerized Redis instances:\n\nsysctl vm.overcommit_memory=0\necho always > /sys/kernel/mm/transparent_hugepage/enabled",
    "solution_desc": "Configure the host system to disable Transparent Huge Pages (THP) to ensure that Copy-on-Write utilizes fine-grained 4KB memory pages rather than 2MB huge pages. Additionally, adjust the system's virtual memory overcommit settings to allow Redis to safely fork processes under memory constraints.",
    "good_code": "# Run these optimization commands on the host OS / Docker initialization scripts\n\n# 1. Disable Transparent Huge Pages dynamically\nsudo echo never > /sys/kernel/mm/transparent_hugepage/enabled\nsudo echo never > /sys/kernel/mm/transparent_hugepage/defrag\n\n# 2. Configure kernel to allow efficient overcommit\nsudo sysctl vm.overcommit_memory=1\n\n# 3. Add to host system's /etc/rc.local or sysctl.conf to persist across reboots\n# vm.overcommit_memory = 1",
    "verification": "Trigger a snapshot manually in Redis using the `BGSAVE` command under a simulated write workload. Monitor memory usage with `INFO persistence` and check `/proc/sys/kernel/mm/transparent_hugepage/enabled` to ensure it is set to `[never]`.",
    "date": "2026-06-11",
    "id": 1781162589,
    "type": "error"
});