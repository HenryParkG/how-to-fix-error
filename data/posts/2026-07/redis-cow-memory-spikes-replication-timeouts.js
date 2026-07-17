window.onPostDataLoaded({
    "title": "Fixing Redis CoW Spikes & Replication Timeouts",
    "slug": "redis-cow-memory-spikes-replication-timeouts",
    "language": "Bash / Redis",
    "code": "Redis OOM / Replication Timeout",
    "tags": [
        "Redis",
        "DevOps",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>During a Redis <code>BGSAVE</code> or background rewrite (BGREWRITEAOF), Redis forks a child process. Linux uses Copy-on-Write (CoW) to optimize this process. However, if there is a massive write load during the save window, the kernel must allocate and copy memory pages quickly. If Transparent Huge Pages (THP) is active, page allocation sizes swell from 4KB to 2MB, amplifying memory usage and triggering the Out-of-Memory (OOM) killer. At the same time, high disk I/O and network saturation can delay replication heartbeats, leading to replication timeouts.</p>",
    "root_cause": "Transparent Huge Pages (THP) forces CoW to copy 2MB pages instead of 4KB pages under load, creating huge memory spikes. Additionally, low default replication timeout ('repl-timeout') values cause replicas to drop connection during prolonged disk writes or massive synchronization frames.",
    "bad_code": "# System configured with active Transparent Huge Pages (THP)\necho \"always\" > /sys/kernel/mm/transparent_hugepage/enabled\nsysctl vm.overcommit_memory=0\n\n# Redis configurations running default low timeouts under high load\nredis-cli CONFIG SET repl-timeout 60\nredis-cli CONFIG SET client-output-buffer-limit \"replica 256mb 64mb 60\"",
    "solution_desc": "Disable Transparent Huge Pages (THP) at the host OS level to allow fine-grained 4KB copy-on-write actions. Configure VM memory overcommit policy to allow allocations to proceed without checking current physical RAM limitations. Finally, scale up the replication timeout buffers inside the Redis configuration file.",
    "good_code": "# 1. Disable THP and configure memory overcommit on host OS\nsudo sysctl vm.overcommit_memory=1\necho \"never\" | sudo tee /sys/kernel/mm/transparent_hugepage/enabled\necho \"never\" | sudo tee /sys/kernel/mm/transparent_hugepage/defrag\n\n# 2. Optimized Redis configurations (redis.conf)\n# Increase replication timeout to tolerate disk/network bottlenecks\nrepl-timeout 600\n\n# Scale up client output buffers to handle replication data backlogs\nclient-output-buffer-limit replica 1gb 512mb 120\n\n# Ensure active defragmentation is enabled to control fragmentation\nactivedefrag yes",
    "verification": "Run 'redis-cli BGSAVE' under heavy synthetic write load. Monitor the system memory footprint with 'free -m' or '/proc/meminfo' to confirm that memory overhead stays minimal and replication states do not drop.",
    "date": "2026-07-17",
    "id": 1784266381,
    "type": "error"
});