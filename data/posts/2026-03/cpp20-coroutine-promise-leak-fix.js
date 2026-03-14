window.onPostDataLoaded({
    "title": "Debugging C++20 Coroutine Memory Leaks in Promise Types",
    "slug": "cpp20-coroutine-promise-leak-fix",
    "language": "Rust",
    "code": "MemoryLeak (Coro)",
    "tags": [
        "Rust",
        "Go",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines allocate a 'coroutine frame' on the heap to store local variables and the promise object. A memory leak occurs when the coroutine reaches its final suspension point but is never explicitly destroyed, or if the <code>promise_type</code> fails to manage the lifetime of the returned task object. Unlike high-level languages, C++ requires the caller or a wrapper object (like a Task or Future) to call <code>handle.destroy()</code> if the coroutine doesn't reach <code>final_suspend</code> with <code>std::suspend_never</code>.</p>",
    "root_cause": "Failure to call coroutine_handle::destroy() on a handle that reached a suspension point, or returning a raw handle from the promise without a RAII wrapper.",
    "bad_code": "struct Task {\n  struct promise_type {\n    auto get_return_object() { return Task{handle_type::from_promise(*this)}; }\n    std::suspend_always final_suspend() noexcept { return {}; }\n  };\n  // Missing Destructor to destroy handle\n  handle_type h_;\n};",
    "solution_desc": "Implement a RAII wrapper for the <code>std::coroutine_handle</code>. The wrapper's destructor must call <code>handle.destroy()</code> if the handle is valid and the coroutine has finished or is being abandoned.",
    "good_code": "struct Task {\n  ~Task() {\n    if (h_) h_.destroy();\n  }\n  Task(Task&& other) : h_(other.h_) { other.h_ = nullptr; }\n  handle_type h_;\n};",
    "verification": "Use Valgrind or AddressSanitizer (ASan) to check for leaked blocks associated with the coroutine's promise_type and frame allocation.",
    "date": "2026-03-14",
    "id": 1773480256,
    "type": "error"
});