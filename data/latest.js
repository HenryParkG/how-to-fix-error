var postsLatest = [
  {
    "id": 1792592098,
    "title": "Fix C++20 Coroutine Frame Reference Lifetime Bugs",
    "slug": "cpp20-coroutine-dangling-reference-lifetime-fix",
    "language": "C++",
    "code": "DanglingReferenceUB",
    "date": "2026-10-21",
    "path": "data/posts/2026-10/cpp20-coroutine-dangling-reference-lifetime-fix.js",
    "tags": [
      "C++20",
      "Coroutines",
      "Memory Safety",
      "Rust",
      "Error Fix"
    ]
  },
  {
    "id": 1792592099,
    "title": "Mitigate PostgreSQL TXID Wraparound Vacuum Starvation",
    "slug": "postgres-txid-wraparound-vacuum-starvation",
    "language": "PostgreSQL",
    "code": "ERRCODE_PROGRAM_LIMIT_EXCEEDED",
    "date": "2026-10-21",
    "path": "data/posts/2026-10/postgres-txid-wraparound-vacuum-starvation.js",
    "tags": [
      "PostgreSQL",
      "Database",
      "Performance",
      "SQL",
      "Error Fix"
    ]
  },
  {
    "id": 1792592100,
    "title": "Fix Kafka Consumer Group max.poll.interval.ms Storms",
    "slug": "kafka-consumer-rebalance-max-poll-interval-ms",
    "language": "Kafka",
    "code": "CommitFailedException",
    "date": "2026-10-21",
    "path": "data/posts/2026-10/kafka-consumer-rebalance-max-poll-interval-ms.js",
    "tags": [
      "Kafka",
      "Distributed Systems",
      "Concurrency",
      "Java",
      "Error Fix"
    ]
  },
  {
    "id": 1792592101,
    "title": "DeepInfer: High-Scale DeepSeek Model Inference Engine",
    "slug": "deepinfer-deepseek-high-performance-inference",
    "language": "Python",
    "code": "Trend",
    "date": "2026-10-21",
    "path": "data/posts/2026-10/deepinfer-deepseek-high-performance-inference.js",
    "tags": [
      "Tech Trend",
      "GitHub",
      "Python"
    ]
  },
  {
    "id": 1792570108,
    "title": "Debugging eBPF Verifier & JIT Issues",
    "slug": "ebpf-verifier-jit-debugging",
    "language": "Linux Kernel",
    "code": "EBPF_VERIFIER_ERR",
    "date": "2026-10-21",
    "path": "data/posts/2026-10/ebpf-verifier-jit-debugging.js",
    "tags": [
      "eBPF",
      "Linux Kernel",
      "Observability",
      "Infra",
      "Error Fix"
    ]
  },
  {
    "id": 1792570109,
    "title": "Mitigating PyTorch CUDA OOMs: Fragmentation & Backprop",
    "slug": "pytorch-cuda-oom-fragmentation-nondeterminism",
    "language": "Python",
    "code": "CUDA_OOM",
    "date": "2026-10-21",
    "path": "data/posts/2026-10/pytorch-cuda-oom-fragmentation-nondeterminism.js",
    "tags": [
      "PyTorch",
      "CUDA",
      "Deep Learning",
      "Memory Management",
      "Python",
      "Error Fix"
    ]
  },
  {
    "id": 1792570110,
    "title": "Elasticsearch: Shard Relocation & Data Inconsistency",
    "slug": "elasticsearch-shard-relocation-data-inconsistency",
    "language": "Java",
    "code": "ES_SHARD_RELOCATION_FAILURE",
    "date": "2026-10-21",
    "path": "data/posts/2026-10/elasticsearch-shard-relocation-data-inconsistency.js",
    "tags": [
      "Elasticsearch",
      "Distributed Systems",
      "Data Integrity",
      "Infra",
      "Error Fix"
    ]
  },
  {
    "id": 1792570111,
    "title": "DeepInfer: High-Performance LLM Inference from DeepSeek",
    "slug": "deepinfer-deepseek-llm-inference",
    "language": "Python",
    "code": "Trend",
    "date": "2026-10-21",
    "path": "data/posts/2026-10/deepinfer-deepseek-llm-inference.js",
    "tags": [
      "Tech Trend",
      "GitHub",
      "AI",
      "LLM",
      "Inference",
      "Python"
    ]
  },
  {
    "id": 1792550054,
    "title": "Fix Go STW Preemption Starvation in CPU Loops",
    "slug": "fix-go-runtime-stw-preemption-starvation",
    "language": "Go",
    "code": "STWStarvation",
    "date": "2026-10-21",
    "path": "data/posts/2026-10/fix-go-runtime-stw-preemption-starvation.js",
    "tags": [
      "Go",
      "Concurrency",
      "Performance",
      "Error Fix"
    ]
  },
  {
    "id": 1792550055,
    "title": "Mitigate HNSW Vector Index Bloat from Deletes",
    "slug": "mitigate-hnsw-vector-index-fragmentation-bloat",
    "language": "Rust",
    "code": "HNSWFragmentation",
    "date": "2026-10-21",
    "path": "data/posts/2026-10/mitigate-hnsw-vector-index-fragmentation-bloat.js",
    "tags": [
      "Rust",
      "VectorDB",
      "AI",
      "Error Fix"
    ]
  },
  {
    "id": 1792550056,
    "title": "Fix WebGPU Dynamic Uniform Buffer Alignment",
    "slug": "fix-webgpu-dynamic-uniform-buffer-alignment",
    "language": "TypeScript",
    "code": "WebGPUAlignmentError",
    "date": "2026-10-21",
    "path": "data/posts/2026-10/fix-webgpu-dynamic-uniform-buffer-alignment.js",
    "tags": [
      "TypeScript",
      "WebGPU",
      "Frontend",
      "Error Fix"
    ]
  },
  {
    "id": 1792550057,
    "title": "DeepInfer: High-Performance DeepSeek Inference",
    "slug": "deepinfer-deepseek-high-performance-inference",
    "language": "Python",
    "code": "Trend",
    "date": "2026-10-21",
    "path": "data/posts/2026-10/deepinfer-deepseek-high-performance-inference.js",
    "tags": [
      "Tech Trend",
      "GitHub",
      "Python"
    ]
  },
  {
    "id": 1792505204,
    "title": "Fixing Async Cancellation Safety & Guard Leaks in Rust",
    "slug": "rust-async-cancellation-safety-raii-leaks",
    "language": "Rust",
    "code": "AsyncCancellationError",
    "date": "2026-10-20",
    "path": "data/posts/2026-10/rust-async-cancellation-safety-raii-leaks.js",
    "tags": [
      "Rust",
      "Tokio",
      "Concurrency",
      "Backend",
      "Error Fix"
    ]
  },
  {
    "id": 1792505205,
    "title": "Fixing CoreDNS UDP Drops via Linux Conntrack Races",
    "slug": "k8s-coredns-conntrack-race-packet-drops",
    "language": "Kubernetes",
    "code": "ConntrackDropRace",
    "date": "2026-10-20",
    "path": "data/posts/2026-10/k8s-coredns-conntrack-race-packet-drops.js",
    "tags": [
      "Kubernetes",
      "Docker",
      "Linux",
      "Infra",
      "Error Fix"
    ]
  },
  {
    "id": 1792505206,
    "title": "Mitigating RocksDB Write Stalls from L0 File Accumulation",
    "slug": "rocksdb-write-stalls-l0-compaction-debt",
    "language": "SQL",
    "code": "Status::Incomplete",
    "date": "2026-10-20",
    "path": "data/posts/2026-10/rocksdb-write-stalls-l0-compaction-debt.js",
    "tags": [
      "SQL",
      "Rust",
      "Backend",
      "Storage",
      "Error Fix"
    ]
  },
  {
    "id": 1792505207,
    "title": "CleanYourTV: Debloating Android and Google TV via ADB",
    "slug": "cleanyourtv-android-google-tv-debloat-apple-tv-style",
    "language": "Python",
    "code": "Trend",
    "date": "2026-10-20",
    "path": "data/posts/2026-10/cleanyourtv-android-google-tv-debloat-apple-tv-style.js",
    "tags": [
      "Tech Trend",
      "GitHub",
      "Python"
    ]
  },
  {
    "id": 1792483587,
    "title": "Fixing gRPC HTTP/2 Stream Flow-Control Deadlocks",
    "slug": "grpc-http2-flow-control-window-starvation",
    "language": "Go",
    "code": "RESOURCE_EXHAUSTED",
    "date": "2026-10-20",
    "path": "data/posts/2026-10/grpc-http2-flow-control-window-starvation.js",
    "tags": [
      "Go",
      "Networking",
      "gRPC",
      "Backend",
      "Error Fix"
    ]
  },
  {
    "id": 1792483588,
    "title": "Fixing Redis BGSAVE CoW Spikes and Kernel THP Traps",
    "slug": "redis-bgsave-cow-memory-spikes-thp-latency",
    "language": "Docker",
    "code": "OOMKilled",
    "date": "2026-10-20",
    "path": "data/posts/2026-10/redis-bgsave-cow-memory-spikes-thp-latency.js",
    "tags": [
      "Docker",
      "Redis",
      "Infra",
      "Linux",
      "Error Fix"
    ]
  },
  {
    "id": 1792483589,
    "title": "Fixing Elixir GenServer Mailbox Explosions",
    "slug": "elixir-genserver-mailbox-explosion-backpressure",
    "language": "Docker",
    "code": "ProcessQueueOverflow",
    "date": "2026-10-20",
    "path": "data/posts/2026-10/elixir-genserver-mailbox-explosion-backpressure.js",
    "tags": [
      "Docker",
      "Kubernetes",
      "Backend",
      "Infra",
      "Error Fix"
    ]
  },
  {
    "id": 1792483590,
    "title": "Gathin23/cleanyourtv: Debloat Android & Google TV",
    "slug": "gathin23-cleanyourtv-debloat-android-google-tv",
    "language": "Python",
    "code": "Trend",
    "date": "2026-10-20",
    "path": "data/posts/2026-10/gathin23-cleanyourtv-debloat-android-google-tv.js",
    "tags": [
      "Tech Trend",
      "GitHub",
      "Python"
    ]
  },
  {
    "id": 1792397893,
    "title": "Fixing io_uring CQE Overflow and Worker Stalls",
    "slug": "fixing-io-uring-cqe-overflow-worker-thread-stalls",
    "language": "Rust",
    "code": "CQE_OVERFLOW",
    "date": "2026-10-19",
    "path": "data/posts/2026-10/fixing-io-uring-cqe-overflow-worker-thread-stalls.js",
    "tags": [
      "Linux",
      "Async",
      "Rust",
      "Error Fix"
    ]
  },
  {
    "id": 1792397894,
    "title": "Fixing vLLM KV-Cache Exhaustion in Chunked Prefill",
    "slug": "vllm-kv-cache-exhaustion-chunked-prefill",
    "language": "Python",
    "code": "OOM_PREEMPTION",
    "date": "2026-10-19",
    "path": "data/posts/2026-10/vllm-kv-cache-exhaustion-chunked-prefill.js",
    "tags": [
      "Python",
      "Kubernetes",
      "AWS",
      "Error Fix"
    ]
  },
  {
    "id": 1792397895,
    "title": "Fixing Cassandra Tombstone Overwhelmed Exceptions",
    "slug": "fixing-cassandra-tombstone-overwhelmed-exceptions",
    "language": "Java",
    "code": "TombstoneOverwhelmedException",
    "date": "2026-10-19",
    "path": "data/posts/2026-10/fixing-cassandra-tombstone-overwhelmed-exceptions.js",
    "tags": [
      "Cassandra",
      "SQL",
      "Java",
      "Error Fix"
    ]
  },
  {
    "id": 1792397896,
    "title": "Qwen2.1 NSFW Pose Skill: 136 VNCCS Control",
    "slug": "qwen21-nsfw-pose-skill-vnccs-puppet-control",
    "language": "Python",
    "code": "Trend",
    "date": "2026-10-19",
    "path": "data/posts/2026-10/qwen21-nsfw-pose-skill-vnccs-puppet-control.js",
    "tags": [
      "Tech Trend",
      "GitHub",
      "Python"
    ]
  },
  {
    "id": 1792376810,
    "title": "Fix Postgres Transaction ID Wraparound Freeze",
    "slug": "fix-postgres-txid-wraparound-freeze",
    "language": "PostgreSQL",
    "code": "ERR_TXID_WRAPAROUND",
    "date": "2026-10-19",
    "path": "data/posts/2026-10/fix-postgres-txid-wraparound-freeze.js",
    "tags": [
      "PostgreSQL",
      "Database",
      "SQL",
      "Error Fix"
    ]
  },
  {
    "id": 1792376811,
    "title": "Prevent C++20 Coroutine Frame Lifetime Invalidation",
    "slug": "prevent-cpp20-coroutine-frame-lifetime-invalidation",
    "language": "C++20",
    "code": "DanglingReference",
    "date": "2026-10-19",
    "path": "data/posts/2026-10/prevent-cpp20-coroutine-frame-lifetime-invalidation.js",
    "tags": [
      "C++20",
      "Coroutines",
      "Rust",
      "Error Fix"
    ]
  },
  {
    "id": 1792376812,
    "title": "Fix Kafka Consumer Rebalance from Heartbeat Starvation",
    "slug": "fix-kafka-consumer-rebalance-heartbeat-starvation",
    "language": "Kafka",
    "code": "CommitFailedException",
    "date": "2026-10-19",
    "path": "data/posts/2026-10/fix-kafka-consumer-rebalance-heartbeat-starvation.js",
    "tags": [
      "Kafka",
      "Distributed Systems",
      "Java",
      "Error Fix"
    ]
  },
  {
    "id": 1792376813,
    "title": "Analyzing Qwen2.1 NSFW Pose Skill: VNCCS Puppet Control",
    "slug": "analyzing-qwen21-nsfw-pose-skill-vnccs",
    "language": "Python",
    "code": "Trend",
    "date": "2026-10-19",
    "path": "data/posts/2026-10/analyzing-qwen21-nsfw-pose-skill-vnccs.js",
    "tags": [
      "Tech Trend",
      "GitHub",
      "Python"
    ]
  },
  {
    "id": 1792327985,
    "title": "Fixing PyTorch DDP Deadlocks from Graph Divergence",
    "slug": "pytorch-ddp-deadlocks-bucketing-graph-divergence",
    "language": "PyTorch",
    "code": "RuntimeError",
    "date": "2026-10-18",
    "path": "data/posts/2026-10/pytorch-ddp-deadlocks-bucketing-graph-divergence.js",
    "tags": [
      "Python",
      "Machine Learning",
      "Distributed Systems",
      "Error Fix"
    ]
  },
  {
    "id": 1792327986,
    "title": "Mitigating WiredTiger Cache Stalls and Checkpoint Pinning",
    "slug": "mongodb-wiredtiger-cache-eviction-stalls-checkpoint-pinning",
    "language": "MongoDB",
    "code": "WT_CACHE_FULL",
    "date": "2026-10-18",
    "path": "data/posts/2026-10/mongodb-wiredtiger-cache-eviction-stalls-checkpoint-pinning.js",
    "tags": [
      "Go",
      "SQL",
      "Database",
      "Error Fix"
    ]
  },
  {
    "id": 1792327987,
    "title": "Fixing Kubernetes Silent CFS Bandwidth Throttling",
    "slug": "kubernetes-silent-cfs-throttling-multithreaded-runtimes",
    "language": "Kubernetes",
    "code": "CPUThrottled",
    "date": "2026-10-18",
    "path": "data/posts/2026-10/kubernetes-silent-cfs-throttling-multithreaded-runtimes.js",
    "tags": [
      "Kubernetes",
      "Docker",
      "Go",
      "Error Fix"
    ]
  },
  {
    "id": 1792327988,
    "title": "eBPF-Powered Observability and Kernel Networking",
    "slug": "ebpf-zero-instrumentation-observability-networking",
    "language": "Rust",
    "code": "Trend",
    "date": "2026-10-18",
    "path": "data/posts/2026-10/ebpf-zero-instrumentation-observability-networking.js",
    "tags": [
      "Tech Trend",
      "GitHub",
      "Rust"
    ]
  },
  {
    "id": 1792308849,
    "title": "Fixing eBPF Verifier Complexity & Spill Failures",
    "slug": "fixing-ebpf-verifier-complexity-spill-failures",
    "language": "C / eBPF",
    "code": "BPF_VERIFIER_ERR",
    "date": "2026-10-18",
    "path": "data/posts/2026-10/fixing-ebpf-verifier-complexity-spill-failures.js",
    "tags": [
      "eBPF",
      "Linux",
      "Kernel",
      "Rust",
      "Error Fix"
    ]
  },
  {
    "id": 1792308850,
    "title": "Mitigate ClickHouse Too Many Parts Write Stalls",
    "slug": "clickhouse-too-many-parts-write-stalls",
    "language": "ClickHouse / SQL",
    "code": "TOO_MANY_PARTS",
    "date": "2026-10-18",
    "path": "data/posts/2026-10/clickhouse-too-many-parts-write-stalls.js",
    "tags": [
      "ClickHouse",
      "SQL",
      "Database",
      "Infra",
      "Error Fix"
    ]
  },
  {
    "id": 1792308851,
    "title": "Fixing Spark AQE Join Skew & Disk Spill OOM",
    "slug": "spark-join-skew-oom-disk-spilling",
    "language": "Apache Spark / Python",
    "code": "SparkOOMDiskSpill",
    "date": "2026-10-18",
    "path": "data/posts/2026-10/spark-join-skew-oom-disk-spilling.js",
    "tags": [
      "Spark",
      "Python",
      "SQL",
      "BigData",
      "Error Fix"
    ]
  },
  {
    "id": 1792308852,
    "title": "d2r-mobile: Native D2R Compatibility on Apple Silicon",
    "slug": "d2r-mobile-ios-macos-compatibility-layer",
    "language": "Swift / C++ / Metal",
    "code": "Trend",
    "date": "2026-10-18",
    "path": "data/posts/2026-10/d2r-mobile-ios-macos-compatibility-layer.js",
    "tags": [
      "Tech Trend",
      "GitHub",
      "Rust"
    ]
  },
  {
    "id": 1792289495,
    "title": "Fixing Rust Async Cancellation Safety & Inconsistent Drop",
    "slug": "rust-async-cancellation-safety-drop-inconsistencies",
    "language": "Rust",
    "code": "AsyncCancellationLeak",
    "date": "2026-10-18",
    "path": "data/posts/2026-10/rust-async-cancellation-safety-drop-inconsistencies.js",
    "tags": [
      "Rust",
      "Concurrency",
      "Tokio",
      "Error Fix"
    ]
  },
  {
    "id": 1792289496,
    "title": "Resolving Envoy Connection Exhaustion & UC 503 Cascades",
    "slug": "resolving-envoy-connection-exhaustion-uc-503-cascades",
    "language": "Kubernetes",
    "code": "Envoy503UC",
    "date": "2026-10-18",
    "path": "data/posts/2026-10/resolving-envoy-connection-exhaustion-uc-503-cascades.js",
    "tags": [
      "Kubernetes",
      "Docker",
      "DevOps",
      "Error Fix"
    ]
  },
  {
    "id": 1792289497,
    "title": "Mitigating Milvus HNSW Vector Recall Decay Under Upserts",
    "slug": "mitigating-milvus-hnsw-graph-recall-decay",
    "language": "Python",
    "code": "MilvusRecallDecay",
    "date": "2026-10-18",
    "path": "data/posts/2026-10/mitigating-milvus-hnsw-graph-recall-decay.js",
    "tags": [
      "Python",
      "Kubernetes",
      "VectorDB",
      "Error Fix"
    ]
  },
  {
    "id": 1792289498,
    "title": "Exploring jhaizhou-ops/d2r-mobile: D2R on iOS and macOS",
    "slug": "exploring-d2r-mobile-ios-macos-compatibility-layer",
    "language": "Swift",
    "code": "Trend",
    "date": "2026-10-18",
    "path": "data/posts/2026-10/exploring-d2r-mobile-ios-macos-compatibility-layer.js",
    "tags": [
      "Tech Trend",
      "GitHub",
      "Rust"
    ]
  },
  {
    "id": 1792240524,
    "title": "Fix Elixir GenServer Mailbox Starvation & Bloat",
    "slug": "fix-elixir-genserver-mailbox-starvation-bloat",
    "language": "Elixir",
    "code": "SystemLimitError",
    "date": "2026-10-17",
    "path": "data/posts/2026-10/fix-elixir-genserver-mailbox-starvation-bloat.js",
    "tags": [
      "Elixir",
      "BEAM",
      "Concurrency",
      "Docker",
      "Error Fix"
    ]
  },
  {
    "id": 1792240525,
    "title": "Fix Redis BGSAVE Fork Latency Spikes and CoW OOM",
    "slug": "fix-redis-bgsave-fork-latency-spikes-cow-oom",
    "language": "Redis",
    "code": "MISCONF / ForkLatency",
    "date": "2026-10-17",
    "path": "data/posts/2026-10/fix-redis-bgsave-fork-latency-spikes-cow-oom.js",
    "tags": [
      "Redis",
      "Linux",
      "Docker",
      "AWS",
      "Error Fix"
    ]
  },
  {
    "id": 1792240526,
    "title": "Fix WebGPU Dynamic Uniform Buffer Alignment Panics",
    "slug": "fix-webgpu-dynamic-uniform-buffer-alignment-panics",
    "language": "WebGPU / TypeScript",
    "code": "GPUValidationError",
    "date": "2026-10-17",
    "path": "data/posts/2026-10/fix-webgpu-dynamic-uniform-buffer-alignment-panics.js",
    "tags": [
      "TypeScript",
      "Rust",
      "WebGPU",
      "Error Fix"
    ]
  },
  {
    "id": 1792240527,
    "title": "D2R-Mobile: Diablo II Resurrected on iOS & macOS",
    "slug": "d2r-mobile-diablo-ii-resurrected-ios-macos-layer",
    "language": "Swift / C++",
    "code": "Trend",
    "date": "2026-10-17",
    "path": "data/posts/2026-10/d2r-mobile-diablo-ii-resurrected-ios-macos-layer.js",
    "tags": [
      "Tech Trend",
      "GitHub",
      "Rust",
      "TypeScript"
    ]
  },
  {
    "id": 1792221610,
    "title": "Fixing Go Safe-Point Traps in Tight CPU Loops",
    "slug": "go-non-cooperative-preemption-latency-spikes",
    "language": "Go",
    "code": "STWLatencySpike",
    "date": "2026-10-17",
    "path": "data/posts/2026-10/go-non-cooperative-preemption-latency-spikes.js",
    "tags": [
      "Go",
      "Performance",
      "Concurrency",
      "Error Fix"
    ]
  },
  {
    "id": 1792221611,
    "title": "Fixing gRPC HTTP/2 Flow-Control Window Deadlocks",
    "slug": "grpc-http2-flow-control-window-exhaustion-deadlocks",
    "language": "Go",
    "code": "HTTP2_FLOW_CONTROL_ERROR",
    "date": "2026-10-17",
    "path": "data/posts/2026-10/grpc-http2-flow-control-window-exhaustion-deadlocks.js",
    "tags": [
      "Go",
      "Docker",
      "Kubernetes",
      "Error Fix"
    ]
  },
  {
    "id": 1792221612,
    "title": "Resolving RocksDB Write Stalls from L0 Backpressure",
    "slug": "rocksdb-write-stalls-l0-compaction-backpressure",
    "language": "Rust",
    "code": "Status::Busy(WriteStall)",
    "date": "2026-10-17",
    "path": "data/posts/2026-10/rocksdb-write-stalls-l0-compaction-backpressure.js",
    "tags": [
      "Rust",
      "SQL",
      "Databases",
      "Error Fix"
    ]
  },
  {
    "id": 1792221613,
    "title": "D2R-Mobile: Diablo II Resurrected on iOS and macOS",
    "slug": "d2r-mobile-diablo-2-resurrected-ios-macos-layer",
    "language": "C++ / Metal",
    "code": "Trend",
    "date": "2026-10-17",
    "path": "data/posts/2026-10/d2r-mobile-diablo-2-resurrected-ios-macos-layer.js",
    "tags": [
      "Tech Trend",
      "GitHub",
      "Python"
    ]
  },
  {
    "id": 1792203050,
    "title": "Preventing PostgreSQL XID Wraparound and Autovacuum Stalls",
    "slug": "postgresql-xid-wraparound-autovacuum-stalls",
    "language": "PostgreSQL",
    "code": "ERR_XID_WRAPAROUND",
    "date": "2026-10-17",
    "path": "data/posts/2026-10/postgresql-xid-wraparound-autovacuum-stalls.js",
    "tags": [
      "PostgreSQL",
      "Database",
      "Autovacuum",
      "SQL",
      "Error Fix"
    ]
  },
  {
    "id": 1792203051,
    "title": "Taming Kafka Consumer Rebalance Storms and Zombie Fencing",
    "slug": "kafka-rebalance-storms-zombie-fencing",
    "language": "Apache Kafka",
    "code": "CommitFailedException",
    "date": "2026-10-17",
    "path": "data/posts/2026-10/kafka-rebalance-storms-zombie-fencing.js",
    "tags": [
      "Kafka",
      "Distributed Systems",
      "Concurrency",
      "Java",
      "Error Fix"
    ]
  },
  {
    "id": 1792203052,
    "title": "Hunting Haskell Space Leaks: Thunk Accumulation in Lazy Evaluation Pipelines",
    "slug": "hunting-haskell-space-leaks-thunk-accumulation",
    "language": "Haskell",
    "code": "OutOfMemoryError",
    "date": "2026-10-17",
    "path": "data/posts/2026-10/hunting-haskell-space-leaks-thunk-accumulation.js",
    "tags": [
      "Haskell",
      "Functional Programming",
      "Performance",
      "Rust",
      "Error Fix"
    ]
  },
  {
    "id": 1792203053,
    "title": "D2R Mobile: Native Diablo II Resurrected on iOS & Mac",
    "slug": "d2r-mobile-ios-macos-compatibility-layer",
    "language": "Swift / C++",
    "code": "Trend",
    "date": "2026-10-17",
    "path": "data/posts/2026-10/d2r-mobile-ios-macos-compatibility-layer.js",
    "tags": [
      "Tech Trend",
      "GitHub",
      "Gaming",
      "iOS",
      "Rust"
    ]
  },
  {
    "id": 1792157921,
    "title": "Debugging C++20 Coroutine Suspension Points",
    "slug": "debugging-cpp20-coroutine-suspension-points-stackless-mismatches",
    "language": "C++",
    "code": "Coroutine Debugging",
    "date": "2026-10-16",
    "path": "data/posts/2026-10/debugging-cpp20-coroutine-suspension-points-stackless-mismatches.js",
    "tags": [
      "C++",
      "Concurrency",
      "Coroutines",
      "Debugging",
      "Backend",
      "Error Fix"
    ]
  },
  {
    "id": 1792157922,
    "title": "Resolving PyTorch CUDA OOM & Mixed Precision Artifacts",
    "slug": "resolving-pytorch-cuda-oom-mixed-precision-quantization-artifacts",
    "language": "Python",
    "code": "CUDA OOM",
    "date": "2026-10-16",
    "path": "data/posts/2026-10/resolving-pytorch-cuda-oom-mixed-precision-quantization-artifacts.js",
    "tags": [
      "PyTorch",
      "CUDA",
      "AI/ML",
      "Optimization",
      "Backend",
      "Error Fix"
    ]
  },
  {
    "id": 1792157923,
    "title": "Tackling Elasticsearch Shard Rebalancing Failures",
    "slug": "tackling-elasticsearch-shard-rebalancing-failures-high-cardinality-field-explosions",
    "language": "Elasticsearch",
    "code": "Shard Imbalance",
    "date": "2026-10-16",
    "path": "data/posts/2026-10/tackling-elasticsearch-shard-rebalancing-failures-high-cardinality-field-explosions.js",
    "tags": [
      "Elasticsearch",
      "Distributed Systems",
      "Database",
      "Observability",
      "Infra",
      "Error Fix"
    ]
  },
  {
    "id": 1792157924,
    "title": "D2R Mobile: Diablo II: Resurrected on iOS/macOS",
    "slug": "jhaizhou-ops-d2r-mobile-tech-trend",
    "language": "C++/Swift",
    "code": "Trend",
    "date": "2026-10-16",
    "path": "data/posts/2026-10/jhaizhou-ops-d2r-mobile-tech-trend.js",
    "tags": [
      "Tech Trend",
      "GitHub",
      "Reverse Engineering",
      "Gaming",
      "iOS",
      "macOS",
      "Frontend"
    ]
  },
  {
    "id": 1792136502,
    "title": "Fixing eBPF Verifier Complexity Exhaustion Traps",
    "slug": "fixing-ebpf-verifier-complexity-exhaustion",
    "language": "C",
    "code": "BPF_VERIFIER_E2BIG",
    "date": "2026-10-16",
    "path": "data/posts/2026-10/fixing-ebpf-verifier-complexity-exhaustion.js",
    "tags": [
      "Rust",
      "Backend",
      "eBPF",
      "Linux",
      "C",
      "Error Fix"
    ]
  },
  {
    "id": 1792136503,
    "title": "Resolving WiredTiger Dirty Cache Stalls in MongoDB",
    "slug": "resolving-mongodb-wiredtiger-eviction-stalls",
    "language": "Go",
    "code": "WT_CACHE_FULL",
    "date": "2026-10-16",
    "path": "data/posts/2026-10/resolving-mongodb-wiredtiger-eviction-stalls.js",
    "tags": [
      "Go",
      "Backend",
      "Kubernetes",
      "SQL",
      "MongoDB",
      "Error Fix"
    ]
  },
  {
    "id": 1792136504,
    "title": "Mitigating Spark Shuffle FetchFailed Cascades",
    "slug": "mitigating-spark-shuffle-fetchfailed-cascades",
    "language": "Java",
    "code": "FetchFailedException",
    "date": "2026-10-16",
    "path": "data/posts/2026-10/mitigating-spark-shuffle-fetchfailed-cascades.js",
    "tags": [
      "Java",
      "Backend",
      "Kubernetes",
      "AWS",
      "Spark",
      "Error Fix"
    ]
  },
  {
    "id": 1792136505,
    "title": "Inside d2r-mobile: Native Diablo II on iOS and macOS",
    "slug": "inside-d2r-mobile-diablo-2-ios-macos",
    "language": "Rust",
    "code": "Trend",
    "date": "2026-10-16",
    "path": "data/posts/2026-10/inside-d2r-mobile-diablo-2-ios-macos.js",
    "tags": [
      "Tech Trend",
      "GitHub",
      "Rust",
      "TypeScript"
    ]
  }
];
var postsIndex = postsLatest;
