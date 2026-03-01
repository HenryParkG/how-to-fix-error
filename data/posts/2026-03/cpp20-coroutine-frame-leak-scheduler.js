window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Frame Leaks in Custom Schedulers",
    "slug": "cpp20-coroutine-frame-leak-scheduler",
    "language": "C++ / Backend",
    "code": "MemoryLeak",
    "tags": [
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In C++20, coroutine frames are typically allocated on the heap. While the compiler optimizes some away via HALO (Heap Allocation Elision Optimization), custom task schedulers often hold onto <code>std::coroutine_handle&lt;&gt;</code> objects. A common leak occurs when the coroutine reaches its <code>final_suspend</code> point but the scheduler fails to call <code>.destroy()</code> on the handle.</p><p>This is particularly prevalent in asynchronous runtimes where exceptions bypass the normal resumption flow, leaving the promise_type in a suspended state that never reaches its destructor.</p>",
    "root_cause": "The promise_type used std::suspend_always in final_suspend, but the executor's RAII wrapper did not account for edge cases where the task was cancelled before completion, leaving the heap-allocated frame orphaned.",
    "bad_code": "struct Task {\n  struct promise_type {\n    std::suspend_always final_suspend() noexcept { return {}; }\n    // ... other methods\n  };\n  std::coroutine_handle<promise_type> handle;\n  ~Task() { /* Missing handle.destroy() or check */ }\n};",
    "solution_desc": "Implement a strict RAII management for the coroutine handle. Ensure that the destructor of the Task or the awaitable object explicitly calls handle.destroy() if the handle is valid and the coroutine has finished or been cancelled. Alternatively, use std::suspend_never in final_suspend if you want the coroutine to self-destruct (though this is risky with custom schedulers).",
    "good_code": "struct Task {\n  std::coroutine_handle<promise_type> handle;\n  ~Task() {\n    if (handle) {\n      handle.destroy();\n    }\n  }\n  Task(Task&& other) : handle(other.handle) { other.handle = nullptr; }\n  // Prevent double-free via move semantics\n};",
    "verification": "Use Valgrind or AddressSanitizer (ASan) with 'detect_leaks=1'. Run a loop creating 1 million ephemeral tasks and monitor RSS memory usage to ensure stability.",
    "date": "2026-03-01",
    "id": 1772356900,
    "type": "error"
});