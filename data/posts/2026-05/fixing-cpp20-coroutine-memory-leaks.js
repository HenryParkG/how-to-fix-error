window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Memory Leaks",
    "slug": "fixing-cpp20-coroutine-memory-leaks",
    "language": "C++",
    "code": "MemoryLeak",
    "tags": [
        "Rust",
        "Backend",
        "C++20",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines allocate a coroutine frame on the heap to store local variables and the promise object. A common leak occurs when the coroutine handle is not properly destroyed, or when the awaiter's lifetime management conflicts with the coroutine's lifecycle. Specifically, if a coroutine reaches its final suspension point but is not configured to destroy itself automatically (via <code>final_suspend</code> returning <code>std::suspend_always</code>), the caller must manually call <code>handle.destroy()</code>.</p>",
    "root_cause": "The coroutine promise's final_suspend returns std::suspend_always, but the owning object or caller loses the handle without calling .destroy(), preventing the heap-allocated frame from being deallocated.",
    "bad_code": "struct Task {\n  struct promise_type {\n    std::suspend_always initial_suspend() { return {}; }\n    std::suspend_always final_suspend() noexcept { return {}; }\n    void unhandled_exception() {}\n    Task get_return_object() { return Task{std::coroutine_handle<promise_type>::from_promise(*this)}; }\n  };\n  std::coroutine_handle<promise_type> h;\n  // Handle is never destroyed if Task is dropped\n};",
    "solution_desc": "Implement the Rule of Five for the coroutine wrapper to ensure that the handle is destroyed when the object goes out of scope, and ensure that final_suspend is correctly synchronized with the handle's lifetime.",
    "good_code": "struct Task {\n  ~Task() { if (h) h.destroy(); }\n  Task(Task&& other) : h(other.h) { other.h = nullptr; }\n  struct promise_type {\n    std::suspend_always initial_suspend() { return {}; }\n    std::suspend_always final_suspend() noexcept { return {}; }\n    void return_void() {}\n    void unhandled_exception() { std::terminate(); }\n    Task get_return_object() { return Task{std::coroutine_handle<promise_type>::from_promise(*this)}; }\n  };\n  std::coroutine_handle<promise_type> h;\n};",
    "verification": "Use Valgrind or LLVM's AddressSanitizer (ASan) to monitor heap allocations. Ensure 'definitely lost' bytes reach zero after the coroutine lifecycle completes.",
    "date": "2026-05-10",
    "id": 1778378435,
    "type": "error"
});