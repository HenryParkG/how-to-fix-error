window.onPostDataLoaded({
    "title": "Fixing Linux Kernel Soft-Lockups from XFS AIL Contention",
    "slug": "linux-kernel-xfs-soft-lockup-fix",
    "language": "C",
    "code": "Soft-Lockup",
    "tags": [
        "SQL",
        "Infra",
        "Linux",
        "Error Fix"
    ],
    "analysis": "<p>High-throughput Direct I/O (O_DIRECT) workloads, typical in database systems, can trigger Linux kernel soft-lockups on XFS filesystems. This occurs because the Active Item List (AIL) becomes a bottleneck when too many metadata updates (like file size or timestamp changes) occur concurrently.</p><p>The CPU gets stuck in a loop attempting to acquire the AIL lock while the disk subsystem struggles to flush the log, leading to a watchdog timeout.</p>",
    "root_cause": "Contention on the XFS AIL (Active Item List) lock during intensive metadata logging for synchronous Direct I/O operations.",
    "bad_code": "/dev/sdb1 /data xfs defaults,noatime 0 0",
    "solution_desc": "Increase the log buffer size and the number of log buffers in mount options to reduce AIL pushing frequency. Use 'delaylog' (default in newer kernels) and ensure the log is placed on a low-latency device.",
    "good_code": "mount -o remount,logbsize=256k,logbufs=8,noatime /data",
    "verification": "Run 'dmesg' after heavy I/O load to ensure 'watchdog: BUG: soft lockup' messages no longer appear.",
    "date": "2026-04-01",
    "id": 1775007977,
    "type": "error"
});