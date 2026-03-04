window.onPostDataLoaded({
    "title": "Resolving Apache Spark Shuffle Service OOMs",
    "slug": "spark-shuffle-service-oom",
    "language": "Java",
    "code": "OutOfMemoryError",
    "tags": [
        "Java",
        "Kubernetes",
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In multi-tenant Spark clusters, the External Shuffle Service (ESS) often becomes a bottleneck. When hundreds of executors concurrently request shuffle blocks during wide transformations (like <code>reduceByKey</code> or <code>join</code>), the ESS's Netty-based networking layer can exhaust its direct memory (off-heap).</p><p>This leads to <code>java.lang.OutOfMemoryError: Direct buffer memory</code>. In Kubernetes environments, this usually causes the Shuffle Service pod or the Node Manager to be OOMKilled, resulting in job failure and cascading retry storms that further degrade the cluster.</p>",
    "root_cause": "The default configuration for Netty's max direct memory and the number of threads handling shuffle requests is often too low for high-concurrency environments, combined with an unbounded request queue.",
    "bad_code": "spark.shuffle.service.enabled: true\n# Default settings often fail under 500+ executors\nspark.shuffle.io.serverThreads: 128\nspark.shuffle.io.backLog: -1",
    "solution_desc": "Increase the off-heap memory allocation for the shuffle service and tune the Netty transport parameters. Specifically, limiting the backlog and increasing the chunk fetch handler threads helps throttle the pressure, while increasing direct memory prevents the OOM.",
    "good_code": "spark.shuffle.service.enabled: true\nspark.shuffle.io.serverThreads: 512\nspark.shuffle.io.backlog: 8192\n# Increase direct memory in Spark/Yarn/K8s env:\n# --conf \"spark.driver.extraJavaOptions=-XX:MaxDirectMemorySize=10g\"\n# For ESS specifically in K8s:\n# env: { name: 'SHUFFLE_SERVICE_OPTS', value: '-XX:MaxDirectMemorySize=12g' }",
    "verification": "Monitor the 'Netty Direct Memory' metric in Grafana. Ensure that during heavy shuffle stages, memory usage plateaus rather than climbing until a crash occurs.",
    "date": "2026-03-04",
    "id": 1772598389,
    "type": "error"
});