window.onPostDataLoaded({
    "title": "Solving C++20 Coroutine Memory Leaks",
    "slug": "cpp20-coroutine-memory-leaks",
    "language": "C++",
    "code": "Memory Leak",
    "tags": [
        "Rust",
        "Backend",
        "CPP",
        "Error Fix"
    ],
    "analysis": "<p>C++20 Coroutines allocate a 'coroutine frame' on the heap to store local variables and the promise object. Unlike traditional functions, this frame's lifetime is managed via a coroutine_handle. A leak occurs when a coroutine reaches its final suspension point (suspend_always) but the caller/owner fails to call .destroy() on the handle.</p><p>This is particularly common in asynchronous loops where handles are stored in a collection and forgotten after an error or timeout.</p>",
    "root_cause": "Manual management of std::coroutine_handle without an RAII wrapper, leading to the heap-allocated coroutine frame never being deallocated.",
    "bad_code": "struct Task {\n    std::coroutine_handle<promise_type> handle;\n    ~Task() {} // Missing handle.destroy()!\n};\n\nTask my_coro() {\n    co_return;\n}",
    "solution_desc": "Implement a strict RAII (Resource Acquisition Is Initialization) wrapper for the coroutine handle. The destructor must check if the handle is valid and destroy it to release the frame memory.",
    "good_code": "struct Task {\n    std::coroutine_handle<promise_type> handle = nullptr;\n    ~Task() {\n        if (handle) handle.destroy();\n    }\n    Task(Task&& other) : handle(other.handle) { other.handle = nullptr; }\n    // Disable copy to prevent double destroy\n    Task(const Task&) = delete;\n};",
    "verification": "Run the application through Valgrind or use AddressSanitizer (ASAN) to verify zero leaks in coroutine suspension paths.",
    "date": "2026-03-17",
    "id": 1773740769,
    "type": "error"
});