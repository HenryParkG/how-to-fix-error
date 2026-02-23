window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Frame Leaks",
    "slug": "cpp20-coroutine-frame-leak-fix",
    "language": "C++",
    "code": "CORO_LEAK",
    "tags": [
        "Go",
        "Backend",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput networking applications, C++20 coroutines are used to manage thousands of concurrent sockets. However, a common pitfall is the 'leaked coroutine frame.' Unlike traditional functions, coroutines allocate a frame on the heap. If the <code>promise_type</code> does not correctly handle <code>final_suspend</code> or if the <code>coroutine_handle</code> is never destroyed by the caller after completion, the memory associated with the coroutine state is never reclaimed.</p>",
    "root_cause": "The failure occurs when the 'final_suspend' method returns 'std::suspend_always' but the calling event loop fails to call 'handle.destroy()', or when an exception escapes the coroutine body without reaching the promise's 'unhandled_exception' logic.",
    "bad_code": "struct Task {\n    struct promise_type {\n        std::suspend_always final_suspend() noexcept { return {}; }\n        // ... other methods\n    };\n    std::coroutine_handle<promise_type> handle;\n    ~Task() { } // Handle is leaked!\n};",
    "solution_desc": "Implement a RAII (Resource Acquisition Is Initialization) wrapper for the <code>coroutine_handle</code>. Ensure the destructor calls <code>.destroy()</code> if the handle is valid. Furthermore, the <code>final_suspend</code> should return <code>std::suspend_always</code> to allow the caller to clean up, or the wrapper must be designed to relinquish ownership correctly.",
    "good_code": "struct Task {\n    struct promise_type { /* ... */ };\n    std::coroutine_handle<promise_type> handle;\n    \n    ~Task() {\n        if (handle) handle.destroy();\n    }\n    Task(Task&& other) : handle(other.handle) { other.handle = nullptr; }\n    // Disable copying to prevent double-destroy\n    Task(const Task&) = delete;\n};",
    "verification": "Use Valgrind or AddressSanitizer (ASAN) to monitor heap allocations. Run a loop creating 1,000,000 coroutines; memory usage should remain flat if frames are correctly destroyed.",
    "date": "2026-02-23",
    "id": 1771809438,
    "type": "error"
});