window.onPostDataLoaded({
    "title": "Fixing Kubernetes Cgroup v2 Memory Accounting Leaks",
    "slug": "k8s-cgroup-v2-memory-leaks",
    "language": "Go",
    "code": "KubeletMemoryPressure",
    "tags": [
        "Kubernetes",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Cgroup v2 introduced a unified hierarchy for resource control, but certain Linux kernel versions (prior to 5.19) suffer from memory accounting leaks. When pods are frequently created and destroyed, the kernel fails to reclaim 'dying' cgroups because some pages (usually slab or filesystem cache) remain pinned. This causes the node to report high memory usage (NodeHasMemoryPressure) even though <code>top</code> shows plenty of free RAM.</p>",
    "root_cause": "Dying cgroups holding onto un-reclaimable slab memory due to biological page references.",
    "bad_code": "// No specific code, but observed via:\n// kubectl describe node <node-name>\n// Status: MemoryPressure = True",
    "solution_desc": "Update the host kernel to 5.19+ or enable 'memory_recursiveprot' mount options. Alternatively, manually trigger a drop_caches or use a controller to monitor and clear zombie cgroups.",
    "good_code": "# Manual mitigation: Clear dentries and inodes\necho 2 > /proc/sys/vm/drop_caches\n# Permanent fix: Update GRUB with cgroup_disable=memory if reverting to v1",
    "verification": "Check 'cat /proc/cgroups' and ensure 'num_cgroups' decreases after pod deletion.",
    "date": "2026-03-05",
    "id": 1772692871,
    "type": "error"
});