window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Leaks in Asynchronous Graphs",
    "slug": "cpp20-coroutine-memory-leak-fix",
    "language": "C++ / Rust",
    "code": "Memory Leak (Resource)",
    "tags": [
        "Rust",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>In C++20, coroutines allocate a 'coroutine state' on the heap which contains the promise object and captured parameters. In complex asynchronous task graphs, memory leaks frequently occur when the coroutine lifecycle is not strictly tied to a RAII-compliant handle. If a coroutine reaches its final suspension point but the handle's <code>.destroy()</code> method is never called, the heap memory is never reclaimed.</p><p>This is particularly dangerous in high-concurrency environments where task graphs are pruned or cancelled dynamically, leaving 'orphaned' coroutine states that slowly consume the system's RSS.</p>",
    "root_cause": "The coroutine promise's final_suspend() returns std::suspend_always, but the ownership of the coroutine_handle is lost or not managed by a smart pointer/wrapper that calls .destroy() upon destruction.",
    "bad_code": "struct Task {\n  struct promise_type {\n    Task get_return_object() { return Task{handle_type::from_promise(*this)}; }\n    std::suspend_always initial_suspend() { return {}; }\n    std::suspend_always final_suspend() noexcept { return {}; } // Stays suspended\n    void return_void() {}\n    void unhandled_exception() {}\n  };\n  handle_type h_;\n  // Missing destructor to call h_.destroy()\n};",
    "solution_desc": "Implement a RAII wrapper for the coroutine handle. Ensure that the destructor of the Task object explicitly calls handle.destroy(). Use std::coroutine_handle::from_promise to manage the state and consider move-only semantics to prevent multiple handles from attempting to destroy the same state.",
    "good_code": "struct Task {\n  ~Task() {\n    if (h_) h_.destroy();\n  }\n  Task(Task&& other) noexcept : h_(other.h_) { other.h_ = nullptr; }\n  Task& operator=(Task&& other) noexcept {\n    if (this != &other) {\n      if (h_) h_.destroy();\n      h_ = other.h_; other.h_ = nullptr;\n    }\n    return *this;\n  }\n  handle_type h_;\n};",
    "verification": "Use Valgrind or AddressSanitizer (ASan) to check for leaked blocks. In a loop of 1 million task creations, RSS should remain stable.",
    "date": "2026-04-08",
    "id": 1775624779,
    "type": "error"
});