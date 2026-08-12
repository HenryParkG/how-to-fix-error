window.onPostDataLoaded({
    "title": "Debugging Linux io_uring Buffer Ring Exhaustion",
    "slug": "linux-iouring-buffer-ring-exhaustion-fix",
    "language": "C / Linux Kernel / Rust",
    "code": "ENOBUFS",
    "tags": [
        "Linux",
        "io_uring",
        "Rust",
        "C",
        "Error Fix"
    ],
    "analysis": "<p>When implementing high-performance network services with Linux <code>io_uring</code> using provided buffer rings (<code>IORING_REGISTER_PBUF_RING</code>), high-concurrency burst traffic can exhaust available buffers in the kernel ring before the application replenishes them. Under heavy socket I/O, submission queue entries (SQEs) utilizing <code>IOSQE_BUFFER_SELECT</code> fail with <code>-ENOBUFS</code> (-105), dropping active packets or tearing down TCP connections unexpectedly.</p><p>This failure occurs because the kernel's buffer ring consumption rate during multishot receive operations (<code>IORING_RECV_MULTISHOT</code>) rapidly outpaces the user-space replenishment pipeline when processing high packet volumes per second.</p>",
    "root_cause": "Race conditions between kernel consumption and user-space buffer replenishment during multi-shot receive operations, combined with insufficient ring size allocation and improper tracking of tail offsets (`io_uring_buf_ring_advance`).",
    "bad_code": "// Buggy buffer ring replenishment setup\nstruct io_uring_buf_ring *br = setup_buf_ring(ring, 16);\n\nvoid handle_cqe(struct io_uring_cqe *cqe) {\n    if (cqe->res == -ENOBUFS) {\n        // Unhandled exhaustion leading to dropped requests\n        fprintf(stderr, \"Out of buffers!\\n\");\n        return;\n    }\n    int bid = cqe->flags >> IORING_CQE_BUFFER_SHIFT;\n    process_payload(buffers[bid]);\n    // Bug: Delaying buffer tail advancement or forgetting to advance ring tail\n}",
    "solution_desc": "Expand the provided buffer ring capacity to match the peak concurrent socket queue depth, implement automated batch replenishment triggers when ring usage crosses critical thresholds, and correctly advance the user-space ring tail (`io_uring_buf_ring_advance`) immediately after copying or processing payloads.",
    "good_code": "// Fixed implementation with explicit buffer tracking and dynamic batch refill\n#include <liburing.h>\n\n#define BGID 1\n#define RING_SIZE 1024\n\nvoid refill_buffers(struct io_uring_buf_ring *br, int bid, void *addr, int len, int mask) {\n    io_uring_buf_ring_add(br, addr, len, bid, mask, 0);\n    io_uring_buf_ring_advance(br, 1);\n}\n\nvoid handle_cqe_fixed(struct io_uring *ring, struct io_uring_buf_ring *br, struct io_uring_cqe *cqe) {\n    if (cqe->res == -ENOBUFS) {\n        // Fallback or immediate refill strategy\n        emergency_buffer_replenish(ring, br);\n        return;\n    }\n    if (cqe->flags & IORING_CQE_F_BUFFER) {\n        int bid = cqe->flags >> IORING_CQE_BUFFER_SHIFT;\n        process_payload(buffers[bid], cqe->res);\n        // Instantly return buffer back to kernel ring\n        refill_buffers(br, bid, buffers[bid], BUF_SIZE, RING_SIZE - 1);\n    }\n}",
    "verification": "Run a wrk/k6 load test generating 100k+ concurrent requests. Monitor kernel io_uring metrics via tracepoints (`tracepoint:io_uring:io_uring_complete`) to verify zero -105 (ENOBUFS) completions during traffic spikes.",
    "date": "2026-08-12",
    "id": 1786496788,
    "type": "error"
});