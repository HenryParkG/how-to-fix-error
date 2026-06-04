window.onPostDataLoaded({
    "title": "Fixing Redis OOM Crashes from BGSAVE CoW Spikes",
    "slug": "redis-oom-bgsave-copy-on-write",
    "language": "Redis",
    "code": "OOMCrash",
    "tags": [
        "Docker",
        "Kubernetes",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>Redis persistence strategies like RDB snapshotting (via <code>BGSAVE</code>) and AOF rewriting use the <code>fork()</code> system call to spin up a background child process that handles the actual disk writing. This relies on the Linux Copy-on-Write (CoW) system. During a background save, the parent process and the child process share the exact same physical memory pages. However, whenever a write command modifies a key in the parent process, the operating system clones that specific page (typically 4KB in size) so that the background process still reads a point-in-time snapshot.</p><p>On write-heavy Redis setups, this creates massive spikes in memory usage during persistence runs. If the host system has insufficient overhead or if overcommit memory policies are misconfigured, the Linux Kernel Out-Of-Memory (OOM) killer will step in and forcefully terminate the primary Redis process, interrupting client service.</p>",
    "root_cause": "The OOM crash occurs due to a high volume of writes during background saves combined with system memory overcommit limits (`vm.overcommit_memory = 2` or lack of swap), forcing the kernel to reject page cloning requests or invoke the OOM killer when physical RAM is exhausted by CoW pages.",
    "bad_code": "# Dangerous kernel environment setting\n$ sysctl vm.overcommit_memory=2\n\n# Redis configuration reserving 100% of host RAM for base dataset\n# (e.g., on a system with 16GB RAM)\nmaxmemory 16gb\nmaxmemory-policy noeviction",
    "solution_desc": "Configure the Linux memory overcommit policy to heuristic mode (`vm.overcommit_memory = 1`), enabling the OS to allow fork calls even if theoretical memory allocation exceeds bounds. Additionally, set the Redis `maxmemory` parameter to around 60-70% of actual physical RAM. This ensures there is an allocation buffer to absorb the physical Copy-on-Write page clones without triggering the OOM killer.",
    "good_code": "# Set system overcommit policy to 1\n$ sudo sysctl vm.overcommit_memory=1\n$ echo \"vm.overcommit_memory = 1\" | sudo tee -a /etc/sysctl.conf\n\n# Disable Transparent Huge Pages (THP) to avoid ballooning CoW page sizes from 4KB to 2MB\n$ sudo echo never > /sys/kernel/mm/transparent_hugepage/enabled\n$ sudo echo never > /sys/kernel/mm/transparent_hugepage/defrag\n\n# Configure Redis (redis.conf) with a 35% margin for CoW buffer:\n# maxmemory 10.4gb\n# maxmemory-policy volatile-lru",
    "verification": "Monitor the resident set size (RSS) of Redis using `info memory` during a manual backup execution with `redis-cli BGSAVE`. Verify in `/var/log/syslog` or `/var/log/messages` that no kernel-level OOM events are recorded and that the backup process exits with an exit code of 0.",
    "date": "2026-06-04",
    "id": 1780573634,
    "type": "error"
});