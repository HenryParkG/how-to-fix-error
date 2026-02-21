window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Frame Leakage",
    "slug": "cpp20-coroutine-frame-leakage-fix",
    "language": "C++",
    "code": "MemoryLeak",
    "tags": [
        "C++",
        "Backend",
        "High-Performance",
        "Error Fix"
    ],
    "analysis": "<p>In high-concurrency network runtimes, C++20 coroutines allocate state on the heap via a 'coroutine frame'. A common failure occurs when the coroutine is suspended indefinitely (e.g., waiting on a socket that closes) and the coroutine handle is never destroyed. Unlike traditional stack-based functions, the frame is not automatically reclaimed unless the coroutine runs to completion or <code>handle.destroy()</code> is explicitly called.</p>",
    "root_cause": "The coroutine promise_type lacks RAII management for the coroutine_handle, leading to heap-allocated frames remaining in memory when tasks are cancelled or timed out before reaching their final suspension point.",
    "bad_code": "task<void> handle_client(socket s) {\n    auto data = co_await s.read(); \n    // If socket closes here, the handle is often lost\n    co_return;\n}\n\n// Caller usage\nauto t = handle_client(s);\nt.resume(); // No cleanup if t is dropped",
    "solution_desc": "Implement a Move-Only Task wrapper that encapsulates the std::coroutine_handle. Use the destructor of the wrapper to call handle.destroy() if the handle is valid and the coroutine is not at its final state.",
    "good_code": "template<typename T>\nstruct Task {\n    ~Task() {\n        if (handle && !handle.done()) handle.destroy();\n    }\n    Task(Task&& other) : handle(std::exchange(other.handle, {})) {}\n    std::coroutine_handle<promise_type> handle;\n};",
    "verification": "Monitor memory usage using Valgrind or ASAN (AddressSanitizer) with 'leak detection' enabled while simulating high connection churn and frequent timeouts.",
    "date": "2026-02-21",
    "id": 1771655539,
    "type": "error"
});