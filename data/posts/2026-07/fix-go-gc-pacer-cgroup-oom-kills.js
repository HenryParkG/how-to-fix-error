window.onPostDataLoaded({
    "title": "Fixing Go GC Pacer Churn and Cgroup OOM Kills",
    "slug": "fix-go-gc-pacer-cgroup-oom-kills",
    "language": "Go",
    "code": "OOMKilled",
    "tags": [
        "Go",
        "Kubernetes",
        "Docker",
        "GC",
        "Memory",
        "Error Fix"
    ],
    "analysis": "<p>In memory-constrained container environments like Kubernetes using cgroups v1 or v2, the Go runtime historically struggled to perceive container memory limits. Prior to the introduction of GOMEMLIMIT in Go 1.19, the garbage collector relied exclusively on GOGC (percentage of target heap growth relative to live heap).</p><p>When live heap grows quickly inside a tightly throttled cgroup, GC pacing triggers too late. The process allocates beyond the cgroup ceiling before GC sweeps memory, resulting in Linux kernel OOM killer invocation with exit code 137.</p>",
    "root_cause": "Unawareness of cgroup hard memory limits in the Go runtime GC pacer, causing proportional heap expansion (GOGC) to exceed memory boundaries prior to GC execution.",
    "bad_code": "package main\n\nimport (\n\t\"time\"\n)\n\n// Running with default GOGC=100 inside a 256MB container cgroup limit\nfunc main() {\n\t// Unbound allocations will cause target heap size to exceed 256MB before GC triggers\n\tdata := make([][]byte, 0)\n\tfor i := 0; i < 1000; i++ {\n\t\tchunk := make([]byte, 10*1024*1024) // 10MB chunk\n\t\tdata = append(data, chunk)\n\t\tif len(data) > 15 {\n\t\t\tdata = data[5:] // Retain active pointers\n\t\t}\n\t\ttime.Sleep(50 * time.Millisecond)\n\t}\n}",
    "solution_desc": "Set GOMEMLIMIT dynamically or via environment variables to ~90% of the cgroup limit. This instructs the Go GC pacer to aggressively run garbage collection cycles as memory approaches the defined threshold.",
    "good_code": "package main\n\nimport (\n\t\"os\"\n\t\"runtime/debug\"\n\t\"time\"\n)\n\nfunc init() {\n\t// Dynamically configure GOMEMLIMIT if not explicitly defined in ENV\n\tif os.Getenv(\"GOMEMLIMIT\") == \"\" {\n\t\t// Set target limit to 90% of 256MB container memory limit (~230MB)\n\t\tconst softLimitBytes int64 = 230 * 1024 * 1024\n\t\tdebug.SetMemoryLimit(softLimitBytes)\n\t}\n}\n\nfunc main() {\n\tdata := make([][]byte, 0)\n\tfor i := 0; i < 1000; i++ {\n\t\tchunk := make([]byte, 10*1024*1024)\n\t\tdata = append(data, chunk)\n\t\tif len(data) > 15 {\n\t\t\tdata = data[5:]\n\t\t}\n\t\ttime.Sleep(50 * time.Millisecond)\n\t}\n}",
    "verification": "Deploy the updated container under Kubernetes with a 256Mi limit. Inspect container metrics using kubectl top pod and monitor go_memstats_alloc_bytes and go_memstats_sys_bytes via Prometheus to ensure GC triggers near GOMEMLIMIT without triggering SIGKILL.",
    "date": "2026-07-30",
    "id": 1785409397,
    "type": "error"
});