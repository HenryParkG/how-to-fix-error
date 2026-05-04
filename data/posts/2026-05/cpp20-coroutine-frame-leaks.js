window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Frame Leaks in Network Stacks",
    "slug": "cpp20-coroutine-frame-leaks",
    "language": "C++20",
    "code": "Memory Leak",
    "tags": [
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines allocate a 'coroutine frame' on the heap to store local variables and execution state. Unlike traditional functions, this frame is not automatically destroyed when execution finishes if the promise type specifies 'std::suspend_always' for 'final_suspend'. In high-concurrency network stacks, failing to manually destroy the handle or manage its ownership results in massive memory growth per connection.</p>",
    "root_cause": "The coroutine promise type uses 'std::suspend_always' in 'final_suspend' but the calling Task wrapper fails to call '.destroy()' on the coroutine handle in its destructor.",
    "bad_code": "struct Task {\n    handle_type h_;\n    ~Task() {} // Missing h_.destroy() causes frame leak\n};\n\nstd::suspend_always final_suspend() noexcept { return {}; }",
    "solution_desc": "Implement a proper RAII wrapper for the coroutine handle. Ensure that the destructor of the Task object calls destroy() if the handle is valid and the coroutine has reached its final suspension point.",
    "good_code": "struct Task {\n    handle_type h_;\n    ~Task() {\n        if (h_) h_.destroy();\n    }\n    // Move-only semantics to prevent double-free\n    Task(Task&& other) : h_(other.h_) { other.h_ = nullptr; }\n};",
    "verification": "Use Valgrind or LLVM AddressSanitizer (ASan) with 'leak-check=full'. Look for leaks originating from 'operator new' inside the coroutine's promise allocation.",
    "date": "2026-05-04",
    "id": 1777859930,
    "type": "error"
});