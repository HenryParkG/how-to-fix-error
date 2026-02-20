window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Promise Object Leaks",
    "slug": "cpp20-coroutine-promise-leaks-fix",
    "language": "Rust",
    "code": "MemoryLeak",
    "tags": [
        "Rust",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput C++20 runtimes, coroutine state is typically allocated on the heap. A common issue arises when the coroutine handle's ownership is ambiguous. If a coroutine reaches its <code>final_suspend</code> point and returns <code>std::suspend_always</code>, the coroutine frame is not automatically destroyed. Failure to call <code>.destroy()</code> on the handle results in a persistent memory leak that accumulates rapidly under high load.</p>",
    "root_cause": "The coroutine frame is not reclaimed because the promise_type's final_suspend prevents automatic destruction, and the owner fails to call destroy().",
    "bad_code": "struct Task {\n  struct promise_type {\n    std::suspend_always final_suspend() noexcept { return {}; }\n    // ... other methods\n  };\n  // Handle is lost or never destroyed\n  std::coroutine_handle<promise_type> _h;\n};",
    "solution_desc": "Implement a RAII wrapper for the coroutine handle that ensures destroy() is called in the destructor, and ensure the final_suspend logic aligns with your memory management strategy.",
    "good_code": "struct Task {\n  ~Task() { if (_h) _h.destroy(); }\n  Task(Task&& other) : _h(std::exchange(other._h, {})) {}\n  struct promise_type {\n    std::suspend_always final_suspend() noexcept { return {}; }\n    Task get_return_object() { return Task{std::coroutine_handle<promise_type>::from_promise(*this)}; }\n  };\n  std::coroutine_handle<promise_type> _h;\n};",
    "verification": "Monitor process RSS memory usage and use Valgrind or AddressSanitizer (ASan) to detect leaked coroutine frames.",
    "date": "2026-02-20",
    "id": 1771550069,
    "type": "error"
});