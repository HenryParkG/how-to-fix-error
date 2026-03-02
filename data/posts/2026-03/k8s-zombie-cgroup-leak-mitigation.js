window.onPostDataLoaded({
    "title": "Mitigating K8s 'Zombie' Cgroup Leaks in High-Churn Pods",
    "slug": "k8s-zombie-cgroup-leak-mitigation",
    "language": "Kubernetes",
    "code": "CgroupLeak",
    "tags": [
        "Kubernetes",
        "Infra",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>In environments with high pod churn, such as CI/CD runners or serverless functions, the Linux kernel can accumulate 'zombie' cgroups. This happens when a cgroup is deleted by Kubernetes, but certain kernel resources (like memory pages in the page cache or slab objects) are still pinned to it. Eventually, the kernel hits the maximum cgroup limit, preventing the creation of new containers and causing 'no space left on device' errors even when disk space is ample.</p>",
    "root_cause": "A combination of legacy kernel bugs in cgroup v1 memory accounting (kmem) and unevicted page caches keeping cgroup structures alive in memory.",
    "bad_code": "// No specific code, but typical symptom in Kubelet logs:\n// \"failed to create container: cgroup leak: ...\"\n// Found in kernels < 5.2 with kmem accounting enabled.",
    "solution_desc": "Disable kernel memory accounting in the Kubelet configuration or upgrade to a kernel supporting cgroup v2. Alternatively, use a script to force-trigger memory reclamation on dying cgroups.",
    "good_code": "# Update Kubelet configuration (on older distros)\nKUBELET_EXTRA_ARGS=\"--kubelet-cgroups=/system.slice/kubelet.service --runtime-cgroups=/system.slice/containerd.service --register-node=true --cgroups-per-qos=true\"\n# Or disable kmem via kernel boot param: cgroup.memory=nokmem",
    "verification": "Check the current cgroup count using: cat /proc/cgroups | grep memory. If the count exceeds 60,000, a leak is likely present.",
    "date": "2026-03-02",
    "id": 1772433949,
    "type": "error"
});