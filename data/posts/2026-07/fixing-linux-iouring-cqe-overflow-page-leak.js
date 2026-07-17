window.onPostDataLoaded({
    "title": "Fixing Linux io_uring CQE Overflow and Page Leak",
    "slug": "fixing-linux-iouring-cqe-overflow-page-leak",
    "language": "Rust",
    "code": "Kernel Page Leak",
    "tags": [
        "Rust",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Under high-throughput disk I/O, developers frequently turn to Linux's high-performance asynchronous system call engine, `io_uring`. However, if the application issues read/write requests (Submission Queue Entries, or SQEs) faster than it processes completions (Completion Queue Entries, or CQEs), the completion queue can experience an overflow. On older kernels, this can result in dropped events. Moreover, when using registered fixed buffers via `io_uring_register_buffers` to bypass kernel-user space copying overhead, failure handling routines that neglect to release these buffers under CQE error or overflow states trigger kernel page leaks. This results in memory being pinned persistently, depleting system physical memory.</p>",
    "root_cause": "Initializing io_uring without safe overflow options and failing to invoke `io_uring_unregister_buffers` or cleanup mapping descriptors during SQE/CQE error conditions, leaving locked pages leaking in vmalloc space.",
    "bad_code": "/* Unsafe io_uring registration with no backpressure and poor error paths */\nstruct io_uring ring;\nio_uring_queue_init(64, &ring, 0);\n// Registers buffers but fails to release them on initialization/processing failures\nio_uring_register_buffers(&ring, iovecs, 16);\n// Submitting operations aggressively without checking completion capacity",
    "solution_desc": "Initialize io_uring with `IORING_SETUP_CQSIZE` to configure a completion queue twice the size of the submission queue. Ensure kernel compatibility checks are performed, handle submissions with backpressure, and guarantee registered buffer resources are unregistered properly using structured cleanup constructs during runtime failures.",
    "good_code": "/* Safe C initialization of io_uring */\nstruct io_uring ring;\nstruct io_uring_params params;\nmemset(&params, 0, sizeof(params));\n\n// Request larger completion queue to mitigate overflow risk\nparams.flags |= IORING_SETUP_CQSIZE;\nparams.cq_entries = 128; \n\nif (io_uring_queue_init_params(64, &ring, &params) < 0) {\n    exit(1);\n}\n\n// Register buffers cleanly\nint ret = io_uring_register_buffers(&ring, iovecs, 16);\nif (ret < 0) {\n    io_uring_queue_exit(&ring);\n    exit(1);\n}\n\n// Clean tear down\n// io_uring_unregister_buffers(&ring);\n// io_uring_queue_exit(&ring);",
    "verification": "Trace kernel memory allocations under load using `bpftrace -e 'kprobe:io_sqe_buffer_register { printf(\"Registered: %llu\\n\", elapsed); } kprobe:io_sqe_buffer_unregister { printf(\"Unregistered\\n\"); }'`. Monitor `/proc/meminfo` checking for a steady line in `VmallocUsed` and `LockedGit` throughout high-load cycles.",
    "date": "2026-07-17",
    "id": 1784284219,
    "type": "error"
});