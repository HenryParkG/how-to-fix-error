window.onPostDataLoaded({
    "title": "Fixing io_uring CQE Drops and Worker Exhaustion",
    "slug": "linux-iouring-cqe-drops-worker-exhaustion",
    "language": "Rust",
    "code": "EBUSY / IORING_CQ_EVENTFD_DISABLED",
    "tags": [
        "Rust",
        "Linux",
        "Async",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>High-throughput asynchronous I/O architectures utilizing Linux <code>io_uring</code> can experience silent Completion Queue Entry (CQE) drops and synchronous thread blocking when the Submission Queue (SQ) outpaces the Completion Queue (CQ) or when offloaded blocking operations exhaust kernel <code>io-wq</code> threads.</p><p>By default, if the CQ ring overflows, the kernel drops completion events or pauses event generation unless <code>IORING_SETUP_CQSIZE</code> is provisioned with overflow handling. Concurrently, submitting operations that do not natively support non-blocking poll semantics (e.g., buffered file writes, filesystem metadata locks) forces io_uring to transition execution onto the asynchronous worker pool (<code>io-wq</code>). Under high concurrency, unbound worker allocation generates severe lock contention on <code>task_struct</code> allocations, elevating latency and triggering starvation.</p>",
    "root_cause": "The completion queue ring size was set equal to the submission queue without IORING_FEAT_NODROP enabled, causing CQ ring overflows under burst loads. Additionally, blocking file operations lacked concurrency limits on the io-wq worker pool, exhausting kernel workqueues.",
    "bad_code": "use io_uring::{IoUring, opcode, types};\n\nfn setup_bad_ring() -> IoUring {\n    // Creating a ring where CQ is sized identically to SQ (default behavior)\n    // Without IORING_SETUP_CQSIZE or checking IORING_FEAT_NODROP\n    let ring = IoUring::new(1024).expect(\"Failed to initialize io_uring\");\n    \n    // Submitting hundreds of unbounded buffered file I/O operations\n    // forces synchronous kernel offloading to io-wq without worker limits.\n    ring\n}",
    "solution_desc": "Configure the ring with `IORING_SETUP_CQSIZE` to allocate a CQ ring double the size of the SQ ring, and ensure `IORING_FEAT_NODROP` is verified at runtime. Explicitly cap kernel worker threads using the `IORING_REGISTER_IOWQ_MAX_WORKERS` opcode via `ring.submitter().register_iowq_max_workers()` to prevent kernel worker pool exhaustion.",
    "good_code": "use io_uring::{IoUring, types};\n\nfn setup_resilient_ring() -> IoUring {\n    let mut ring = IoUring::builder()\n        .setup_cqsize(4096) // CQ ring capacity 4x the SQ ring (1024)\n        .build(1024)\n        .expect(\"Failed to initialize io_uring\");\n\n    let submitter = ring.submitter();\n    \n    // Bound bounded (IO_WQ_BOUND) and unbounded (IO_WQ_UNBOUND) workers\n    // to prevent io-wq thread pool exhaustion\n    let mut workers = [16, 32]; // [bounded, unbounded]\n    unsafe {\n        submitter\n            .register_iowq_max_workers(&mut workers)\n            .expect(\"Failed to set io-wq max workers\");\n    }\n\n    ring\n}",
    "verification": "Inspect ring status with `cat /proc/<PID>/io_uring/<FD>` and observe `cq_overflow` counters remain 0. Trace kernel worker thread saturation using `bpftrace -e 'kprobe:io_wq_create_worker { @[comm] = count(); }'`.",
    "date": "2026-10-30",
    "id": 1793361401,
    "type": "error"
});