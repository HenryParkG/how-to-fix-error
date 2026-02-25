window.onPostDataLoaded({
    "title": "Fixing K8s Cgroup v2 JVM Memory Discrepancies",
    "slug": "k8s-cgroupv2-jvm-memory-fix",
    "language": "Java / Kubernetes",
    "code": "OOMKilled",
    "tags": [
        "Kubernetes",
        "Java",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>With the industry shift to Cgroup v2, many containerized JVM workloads started experiencing unexpected OOMKills or performance degradation. Older versions of the JVM (pre-11.0.16) look for memory limits in /sys/fs/cgroup/memory/memory.limit_in_bytes, which does not exist in Cgroup v2. Consequently, the JVM fails to detect container limits and defaults to using the host's physical memory for its heap calculation, leading to the container being killed by the kernel for exceeding its cgroup quota.</p>",
    "root_cause": "Incompatibility between legacy JVM memory detection logic and the unified Cgroup v2 hierarchy (memory.max).",
    "bad_code": "apiVersion: v1\nkind: Pod\nspec:\n  containers:\n  - name: java-app\n    image: openjdk:8u212 # Old JVM version\n    resources:\n      limits:\n        memory: \"1Gi\"",
    "solution_desc": "Upgrade to a Cgroup v2-aware JVM (JDK 17+, or patched JDK 8/11). Alternatively, explicitly define heap limits using -Xmx or use the UseContainerSupport flag to ensure the JVM respects the container boundary.",
    "good_code": "apiVersion: v1\nkind: Pod\nspec:\n  containers:\n  - name: java-app\n    image: eclipse-temurin:17-jre\n    env:\n    - name: JAVA_OPTS\n      value: \"-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0\"\n    resources:\n      limits:\n        memory: \"1Gi\"",
    "verification": "Run 'java -XshowSettings:system -version' inside the container to verify the JVM detects the correct container memory limit.",
    "date": "2026-02-25",
    "id": 1772012874,
    "type": "error"
});