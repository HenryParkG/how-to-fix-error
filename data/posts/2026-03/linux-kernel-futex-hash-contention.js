window.onPostDataLoaded({
    "title": "Fixing Linux Kernel Futex Hash Table Contention",
    "slug": "linux-kernel-futex-hash-contention",
    "language": "Go",
    "code": "Lock Contention",
    "tags": [
        "Go",
        "Infra",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>When running high-concurrency workloads on large multi-core systems, performance often hits a ceiling due to kernel-level spinlock contention. Specifically, the Linux kernel uses a global hash table for futexes (Fast Userspace Mutexes). If many threads wait on different futexes that happen to hash to the same bucket, the kernel spends significant cycles spinning on the bucket's internal spinlock, causing high system CPU usage and latency spikes.</p>",
    "root_cause": "The kernel uses a fixed-size hash table (futex_queues) indexed by the futex address. On high-density systems, collisions in these buckets cause massive contention on the bucket spinlocks, especially across NUMA nodes.",
    "bad_code": "// Running a Go app with thousands of goroutines on a 128-core machine\n// without kernel tuning often triggers this.\n$ perf record -a -g\n// Look for: native_queued_spin_lock_slowpath <- futex_wait_setup",
    "solution_desc": "Increase the futex hash table size at boot time using kernel parameters to reduce collision probability and ensure the workload is spread across more buckets.",
    "good_code": "# Edit /etc/default/grub and add to GRUB_CMDLINE_LINUX_DEFAULT\nfutex_hashsize=131072\n\n# Update grub and reboot\n$ sudo update-grub && sudo reboot",
    "verification": "Check dmesg for 'futex hash table entries' and use 'perf top' to ensure spinlock contention in 'futex_wait' has decreased.",
    "date": "2026-03-30",
    "id": 1774847870,
    "type": "error"
});