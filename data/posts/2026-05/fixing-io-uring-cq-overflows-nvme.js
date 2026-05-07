window.onPostDataLoaded({
    "title": "Fixing Linux io_uring CQ Overflows in NVMe Workloads",
    "slug": "fixing-io-uring-cq-overflows-nvme",
    "language": "C",
    "code": "CQE_OVERFLOW",
    "tags": [
        "Linux",
        "Backend",
        "C",
        "Error Fix"
    ],
    "analysis": "<p>When performing high-throughput I/O on NVMe drives using <code>io_uring</code>, the Completion Queue (CQ) can fill up faster than the application can process events. In older kernels or misconfigured rings, this leads to dropped completion events or the kernel having to throttle the Submission Queue (SQ). This is particularly prevalent in asynchronous designs where the SQ size is significantly smaller than the potential inflight I/O depth permitted by modern NVMe controllers.</p>",
    "root_cause": "The CQ ring size defaults to 2x the SQ ring size. Under extreme IOPS, if the application does not reap completions within a single event loop iteration, the kernel-side CQ ring overflows, potentially leading to lost events if IORING_FEAT_NODROP is not supported or active.",
    "bad_code": "struct io_uring_params params;\nmemset(&params, 0, sizeof(params));\n// Default sizing: CQ will be SQ * 2\nint ret = io_uring_queue_init_params(entries, &ring, &params);\nif (ret < 0) exit(1);",
    "solution_desc": "Architecturally, you should explicitly decouple the CQ size from the SQ size using the IORING_SETUP_CQSIZE flag. This allows for a much larger buffer to absorb spikes in completions. Additionally, ensure you are using the IORING_FEAT_NODROP feature (standard in newer kernels) which forces the kernel to keep completions in an internal overflow list rather than dropping them.",
    "good_code": "struct io_uring_params params;\nmemset(&params, 0, sizeof(params));\nparams.flags = IORING_SETUP_CQSIZE;\nparams.cq_entries = entries * 16; // Provide significant headroom\n\nint ret = io_uring_queue_init_params(entries, &ring, &params);\nif (ret < 0) exit(1);\n\n// Verification of NODROP feature\nif (!(params.features & IORING_FEAT_NODROP)) {\n    fprintf(stderr, \"Warning: Kernel too old, CQ overflows may drop data\\n\");\n}",
    "verification": "Monitor /proc/self/fdinfo/<ring_fd> and check the 'cq_overflow' counter while running a high-depth fio benchmark.",
    "date": "2026-05-07",
    "id": 1778151679,
    "type": "error"
});