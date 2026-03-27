window.onPostDataLoaded({
    "title": "Fixing Linux io_uring SQPOLL Deadlocks",
    "slug": "fixing-io-uring-sqpoll-deadlocks",
    "language": "C / Rust",
    "code": "Deadlock",
    "tags": [
        "Linux",
        "Systems",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>Using IORING_SETUP_SQPOLL allows a kernel thread to poll the submission queue, reducing syscall overhead. However, if the SQ thread goes to sleep due to inactivity and the user-space application fails to wake it up while assuming it's still polling, a deadlock occurs where no completions are ever processed.</p>",
    "root_cause": "The kernel thread enters a sleep state after a period of inactivity; the user-space application must check the IORING_SQ_NEED_WAKEUP flag and perform a syscall to restart it.",
    "bad_code": "/* Assuming SQPOLL is always running */\nstruct io_uring_sqe *sqe = io_uring_get_sqe(&ring);\nio_uring_prep_read(sqe, fd, buf, len, 0);\n// No call to io_uring_submit() because we expect SQPOLL to see it",
    "solution_desc": "Check if the SQ thread has gone to sleep by inspecting the flags in the submission ring. If the IORING_SQ_NEED_WAKEUP bit is set, call io_uring_enter with the IORING_ENTER_SQ_WAKEUP flag.",
    "good_code": "unsigned head;\nunsigned flags = IO_URING_READ_ONCE(*ring.sq.kflags);\nif (flags & IORING_SQ_NEED_WAKEUP) {\n    io_uring_enter(ring.ring_fd, to_submit, 0, IORING_ENTER_SQ_WAKEUP, NULL);\n}",
    "verification": "Monitor the /proc/interrupts and use strace to ensure the io_uring_enter syscall is only triggered when the SQ thread is actually idle.",
    "date": "2026-03-27",
    "id": 1774594694,
    "type": "error"
});