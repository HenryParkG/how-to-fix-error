window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Frame Lifetime Violations in Async I/O",
    "slug": "fixing-cpp20-coroutine-frame-lifetime-violations-async-io",
    "language": "C++",
    "code": "Use-After-Free",
    "tags": [
        "C++",
        "Async",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>In asynchronous C++20 networking engines relying on io_uring or epoll, coroutine frames can be destroyed before pending I/O operations complete if the parent task handle drops or completes prematurely. When an asynchronous socket operation references local variables within a coroutine frame that has already been deallocated, memory corruption or segmentation faults occur due to use-after-free access by the underlying I/O worker kernel thread.</p>",
    "root_cause": "The coroutine frame was deallocated because the coroutine handle was destroyed upon task cancellation while an asynchronous I/O completion callback held references to stack variables inside the frame.",
    "bad_code": "struct AsyncSocket {\n    io_uring* ring;\n    \n    Task<int> async_read(int fd, char* buf, size_t len) {\n        // Stack variable local to coroutine frame\n        char local_buf[1024]; \n        co_await io_uring_submit_read(ring, fd, local_buf, sizeof(local_buf));\n        std::memcpy(buf, local_buf, len);\n        co_return len;\n    }\n};",
    "solution_desc": "Architecturally tie the lifetime of the coroutine frame to the outstanding asynchronous operation using a shared ownership promise wrapper or explicitly defer frame destruction until all pending kernel operations yield a completion queue entry (CQE).",
    "good_code": "template <typename T>\nstruct RefCountedPromise {\n    std::atomic<int> ref_count{1};\n    T value;\n\n    void add_ref() { ref_count.fetch_add(1, std::memory_order_relaxed); }\n    void release() {\n        if (ref_count.fetch_sub(1, std::memory_order_acq_rel) == 1) {\n            std::coroutine_handle<RefCountedPromise>::from_promise(*this).destroy();\n        }\n    }\n};\n\nTask<int> async_read_safe(AsyncSocket& socket, int fd, std::shared_ptr<char[]> buf, size_t len) {\n    // Ownership of buffer and state tied to shared handle safely\n    co_await socket.submit_read(fd, buf.get(), len);\n    co_return len;\n}",
    "verification": "Compile with GCC/Clang using `-fsanitize=address -fsanitize=undefined` and execute high-concurrency async read/write integration tests with simulated early socket drop actions to confirm zero invalid memory accesses.",
    "date": "2026-07-29",
    "id": 1785313267,
    "type": "error"
});