window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Handle Leaks in Orchestrators",
    "slug": "cpp20-coroutine-handle-leaks",
    "language": "Go",
    "code": "Memory Leak",
    "tags": [
        "Go",
        "C++",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In C++20, coroutines are stackless and managed via a <code>std::coroutine_handle</code>. In complex asynchronous orchestrators, if the <code>final_suspend</code> method of the promise type returns <code>std::suspend_always</code>, the coroutine state is not automatically destroyed. If the orchestrator fails to explicitly call <code>handle.destroy()</code>, the promise object and all captured variables leak. This is particularly dangerous in high-throughput task systems where thousands of tasks are spawned per second.</p>",
    "root_cause": "The coroutine reaches the final suspension point but is configured to stay alive for result retrieval. The orchestrator loses track of the handle due to exceptions or logic branches, preventing the required manual destruction of the coroutine state.",
    "bad_code": "struct Task {\n  struct promise_type {\n    std::suspend_always final_suspend() noexcept { return {}; }\n    // ... other methods\n  };\n  // Handle stored but never destroyed\n  std::coroutine_handle<promise_type> h_;\n};",
    "solution_desc": "Implement an RAII wrapper for the coroutine handle. Ensure that the destructor of the Task or Handle owner checks if the handle is valid and calls .destroy(). Use a move-only semantic to prevent double-destruction.",
    "good_code": "struct ManagedTask {\n  ~ManagedTask() {\n    if (h_) h_.destroy();\n  }\n  ManagedTask(ManagedTask&& other) : h_(other.h_) { other.h_ = nullptr; }\n  std::coroutine_handle<promise_type> h_;\n};",
    "verification": "Use Valgrind or AddressSanitizer (ASan) with leak detection enabled. Monitor the 'coroutine_frames_allocated' counter if using a custom allocator.",
    "date": "2026-03-03",
    "id": 1772519968,
    "type": "error"
});