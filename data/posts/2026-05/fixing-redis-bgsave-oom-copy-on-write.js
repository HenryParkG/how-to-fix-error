window.onPostDataLoaded({
    "title": "Fixing Redis BGSAVE OOM Failures from CoW",
    "slug": "fixing-redis-bgsave-oom-copy-on-write",
    "language": "Redis / C",
    "code": "OOM_KILLED_BGSAVE",
    "tags": [
        "Redis",
        "Performance",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>When Redis issues a <code>BGSAVE</code> or <code>BGREWRITEAOF</code>, it spawns a child process using the <code>fork()</code> system call. Linux implements this using Copy-on-Write (CoW). Initially, both processes share the exact same physical memory pages. However, as write commands hit the parent Redis instance, mutated pages are copied to allocate private memory. If Redis is deployed on an over-allocated node or inside a memory-constrained container (like Docker/Kubernetes), and your write load is highly distributed across keys, the virtual memory foot-print explodes. This leads to the kernel OOM killer terminating either the parent process (taking the database offline) or the child process (causing backups to continuously fail).</p>",
    "root_cause": "The Linux kernel's default overcommit and huge page configurations. Transparent Huge Pages (THP) amplify this issue: instead of copying standard 4KB pages when a write occurs, the kernel copies 2MB huge pages. This scales the memory footprint of writes during BGSAVE by 512x, exhausting all available memory instantly.",
    "bad_code": "# Current OS parameters causing excessive CoW allocation\nsysctl vm.overcommit_memory=0\n\n# Transparent Huge Pages enabled (causes 2MB page copies on write)\necho always > /sys/kernel/mm/transparent_hugepage/enabled\n\n# Inside redis.conf, aggressive saving blocks without considering memory limits\nsave 900 1\nsave 300 1000\nsave 60 10000",
    "solution_desc": "To prevent BGSAVE OOM failures, configure the host operating system to allow memory overcommitting and completely disable Transparent Huge Pages (THP), which reduces the Copy-on-Write page fault overhead back to 4KB blocks. Additionally, tune Redis persistence schedules or offload heavy snapshots to dedicated read-replicas.",
    "good_code": "# Step 1: Set kernel overcommit to 1 (always overcommit, preventing premature fork failures)\nsysctl vm.overcommit_memory=1\necho \"vm.overcommit_memory = 1\" >> /etc/sysctl.conf\n\n# Step 2: Disable Transparent Huge Pages dynamically\necho never > /sys/kernel/mm/transparent_hugepage/enabled\necho never > /sys/kernel/mm/transparent_hugepage/defrag\n\n# Step 3: Persist the configuration in /etc/rc.local or a systemd service\n# Step 4: Inside redis.conf, set reasonable thresholds or leverage active-defrag\n# active-defrag yes\n# maxmemory 4gb\n# maxmemory-policy volatile-lru",
    "verification": "Monitor the Redis log to confirm successful saves without termination messages. Run `redis-cli info persistence` and check the fields `latest_fork_usec` (fork latency) and `mem_cow_size`. Ensure `mem_cow_size` remains low during high-throughput write simulations.",
    "date": "2026-05-28",
    "id": 1779950647,
    "type": "error"
});