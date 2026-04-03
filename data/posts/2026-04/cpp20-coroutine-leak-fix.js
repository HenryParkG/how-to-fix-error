window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Leaks in Network Proxies",
    "slug": "cpp20-coroutine-leak-fix",
    "language": "C++ / Rust",
    "code": "MemoryLeak",
    "tags": [
        "Rust",
        "Backend",
        "Networking",
        "Error Fix"
    ],
    "analysis": "<p>In high-concurrency network proxies, C++20 coroutines are often used to manage asynchronous I/O. However, because coroutine frames are heap-allocated by default, memory leaks occur when the coroutine state is not explicitly destroyed. This is especially prevalent when using <code>std::suspend_always</code> in <code>final_suspend</code>, which prevents the compiler from automatically cleaning up the promise object and local variables after the coroutine reaches its end.</p>",
    "root_cause": "Failure to manually call handle.destroy() when final_suspend returns suspend_always, or circular references within the promise_type holding onto shared_ptr instances.",
    "bad_code": "struct Task {\n  struct promise_type {\n    std::suspend_always final_suspend() noexcept { return {}; }\n    // ... other methods\n  };\n  // Coroutine handle is lost or never destroyed\n};",
    "solution_desc": "Implement a Move-Only RAII wrapper for the std::coroutine_handle. By ensuring the destructor of the Task object calls handle.destroy(), we guarantee that the heap-allocated coroutine frame is deallocated even if the execution finishes or is cancelled prematurely.",
    "good_code": "struct Task {\n  ~Task() { if (handle) handle.destroy(); }\n  Task(Task&& other) : handle(other.handle) { other.handle = nullptr; }\n  struct promise_type {\n    std::suspend_always final_suspend() noexcept { return {}; }\n    Task get_return_object() { return Task{handle_type::from_promise(*this)}; }\n    // ...\n  };\n  std::coroutine_handle<promise_type> handle;\n};",
    "verification": "Monitor process RSS and use Valgrind or AddressSanitizer (ASAN) with leak detection enabled during high-concurrency stress tests.",
    "date": "2026-04-03",
    "id": 1775199545,
    "type": "error"
});