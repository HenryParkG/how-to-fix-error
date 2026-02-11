window.onPostDataLoaded({
    "title": "The Phantom OOM: Heap and Cgroup Memory Misalignment",
    "slug": "phantom-oom-heap-cgroup-misalignment",
    "language": "Java / Docker",
    "code": "OOMKilled",
    "tags": [
        "Kubernetes",
        "JVM",
        "Docker",
        "SRE",
        "Error Fix"
    ],
    "analysis": "<p>A Phantom OOM occurs when a managed runtime, such as the JVM or Node.js, is unaware of the memory constraints imposed by Linux Control Groups (cgroups). Historically, runtimes queried the host operating system to determine available physical memory. In a containerized environment, if a container is limited to 1GB on a 64GB host, an unoptimized runtime may still see 64GB and calculate its default heap size accordingly.</p><p>Because the runtime believes it has ample overhead, it does not trigger Garbage Collection (GC) frequently enough. As the application consumes memory, it hits the strict cgroup limit enforced by the Linux kernel. The kernel, seeing a breach of the hard limit, sends a SIGKILL to the process. This results in a sudden container crash without a corresponding stack trace or OutOfMemoryError in the application logs, as the process is terminated before it can report its own failure.</p>",
    "root_cause": "Runtime memory ergonomics calculate heap size based on host-level physical RAM instead of cgroup-enforced container limits.",
    "bad_code": "apiVersion: v1\nkind: Pod\nmetadata:\n  name: legacy-java-app\nspec:\n  containers:\n  - name: api-service\n    image: openjdk:8u111\n    resources:\n      limits:\n        memory: \"512Mi\"\n    command: [\"java\", \"-jar\", \"app.jar\"]",
    "solution_desc": "Upgrade to a container-aware runtime version and utilize percentage-based memory flags. This ensures the JVM respects the cgroup limit and leaves enough 'headroom' for non-heap memory (metaspace, stack, code cache) within the container's budget.",
    "good_code": "apiVersion: v1\nkind: Pod\nmetadata:\n  name: modern-java-app\nspec:\n  containers:\n  - name: api-service\n    image: eclipse-temurin:17-jre\n    resources:\n      limits:\n        memory: \"512Mi\"\n    env:\n    - name: JAVA_TOOL_OPTIONS\n      value: \"-XX:MaxRAMPercentage=75.0 -XX:MinRAMPercentage=50.0\"",
    "verification": "Execute 'kubectl describe pod' and look for 'Reason: OOMKilled'. Use 'memsized' or 'jcmd' within the container to verify that MaxHeapSize matches approximately 75% of the cgroup limit.",
    "date": "2026-02-11",
    "id": 1770786289
});