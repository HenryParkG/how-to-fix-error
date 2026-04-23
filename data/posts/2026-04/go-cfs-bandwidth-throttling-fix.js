window.onPostDataLoaded({
    "title": "Resolving CFS Bandwidth Throttling in Go Services",
    "slug": "go-cfs-bandwidth-throttling-fix",
    "language": "Go",
    "code": "CPU Throttling",
    "tags": [
        "Go",
        "Kubernetes",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Go services running in Kubernetes containers often experience significant CPU throttling (visible in Prometheus) even when total CPU usage is far below the defined limits. This is caused by the Linux Kernel Completely Fair Scheduler (CFS) quota mechanism. Because the Go runtime spawns many threads (M) onto OS threads (P), it can exhaust the CFS quota within a small fraction of the period (e.g., 100ms), causing the process to be throttled for the remainder of that period.</p>",
    "root_cause": "The mismatch between the number of OS threads Go attempts to use and the CFS quota assigned to the cgroup, exacerbated by a known kernel bug in versions pre-5.4.",
    "bad_code": "resources:\n  limits:\n    cpu: \"4\"\n# Go runtime defaults to the number of logical cores on the host node,\n# potentially using 64+ threads for a 4-core limit.",
    "solution_desc": "Use the 'automaxprocs' library to automatically set GOMAXPROCS to match the Linux container CPU quota, preventing the runtime from over-scheduling threads. Alternatively, increase the CFS period or upgrade to a kernel with the CFS quota fix.",
    "good_code": "import _ \"go.uber.org/automaxprocs\"\n\nfunc main() {\n  // The blank import automatically configures GOMAXPROCS\n  // based on the container's CPU quota.\n  serve()\n}",
    "verification": "Check 'container_cpu_cfs_throttled_periods_total' in Prometheus. After implementing automaxprocs, the ratio of throttled periods to total periods should drop significantly.",
    "date": "2026-04-23",
    "id": 1776939347,
    "type": "error"
});