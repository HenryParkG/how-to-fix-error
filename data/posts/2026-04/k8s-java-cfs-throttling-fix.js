window.onPostDataLoaded({
    "title": "Mitigating CFS Throttling in Java Kubernetes Pods",
    "slug": "k8s-java-cfs-throttling-fix",
    "language": "Java, Kubernetes",
    "code": "Latency Spikes",
    "tags": [
        "Kubernetes",
        "Java",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In Kubernetes environments, Java applications often experience mysterious latency spikes despite low average CPU utilization. This is frequently caused by the Linux Completely Fair Scheduler (CFS) quota mechanism. Because the JVM is highly multi-threaded (GC threads, JIT threads, ForkJoinPool), it can exhaust its millisecond-level CPU quota almost instantly, causing the process to be throttled for the remainder of the period.</p>",
    "root_cause": "The CFS quota tracks usage in short periods (usually 100ms). A burst of activity from multiple threads can consume the 100ms quota in 10ms, leading to 90ms of total freezing, even if the total CPU limit isn't reached over a full second.",
    "bad_code": "resources:\n  limits:\n    cpu: \"1000m\"\n  requests:\n    cpu: \"1000m\"\n# Without setting -XX:ActiveProcessorCount, JVM sees host cores.",
    "solution_desc": "Increase the CPU limits to allow for bursts or, preferably, use the '-XX:ActiveProcessorCount' flag to force the JVM to limit its internal thread pools. Additionally, upgrading to Linux kernel 5.4+ allows for CFS burst features which mitigate this specific issue.",
    "good_code": "resources:\n  limits:\n    cpu: \"4000m\"\n  requests:\n    cpu: \"1000m\"\nenv:\n- name: JAVA_OPTS\n  value: \"-XX:ActiveProcessorCount=1\"",
    "verification": "Monitor the file '/sys/fs/cgroup/cpu/cpu.stat' inside the container and check if 'nr_throttled' continues to increment during load.",
    "date": "2026-04-28",
    "id": 1777355450,
    "type": "error"
});