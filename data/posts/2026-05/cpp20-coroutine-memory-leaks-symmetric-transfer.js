window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Leaks in Symmetric Transfer",
    "slug": "cpp20-coroutine-memory-leaks-symmetric-transfer",
    "language": "C++",
    "code": "MemoryLeak",
    "tags": [
        "Rust",
        "Performance",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In high-performance C++20 coroutine pipelines, symmetric transfer is essential to prevent stack overflow during deep recursion of awaitables. However, memory leaks often occur because the lifecycle of the coroutine frame becomes detached from the calling scope. When using <code>std::coroutine_handle</code> to transfer execution directly to another coroutine, the <code>final_suspend</code> behavior determines whether the frame is cleaned up or persists in memory indefinitely.</p>",
    "root_cause": "The leak typically occurs when a promise's <code>final_suspend</code> returns <code>std::suspend_never</code> while using symmetric transfer, or when the returned handle from a <code>transfer</code> operation is never destroyed by the final consumer in the pipeline chain.",
    "bad_code": "struct task {\n  struct promise_type {\n    std::suspend_always initial_suspend() { return {}; }\n    // ERROR: suspend_never prevents manual destruction control\n    std::suspend_never final_suspend() noexcept { return {}; }\n    void unhandled_exception() {}\n    task get_return_object() { return {std::coroutine_handle<promise_type>::from_promise(*this)}; }\n  };\n  std::coroutine_handle<promise_type> h;\n};",
    "solution_desc": "Ensure <code>final_suspend</code> returns <code>std::suspend_always</code> to keep the frame alive until the handle is explicitly destroyed. In symmetric transfer, implement a 'continuation' pattern where the final coroutine in the chain is responsible for destroying the handles of its predecessors, or use a shared ownership wrapper.",
    "good_code": "struct promise_type {\n  std::coroutine_handle<> continuation = std::noop_coroutine();\n  std::suspend_always initial_suspend() { return {}; }\n  // SUCCESS: Keep frame alive for the caller to destroy\n  std::suspend_always final_suspend() noexcept {\n    return {continuation};\n  }\n  void return_void() {}\n  void unhandled_exception() { std::terminate(); }\n};\n// Ensure destructor calls h.destroy()",
    "verification": "Use Valgrind or LLVM AddressSanitizer (ASan) with 'leak-detection' enabled to confirm that the number of coroutine frame allocations matches the number of destructions.",
    "date": "2026-05-02",
    "id": 1777706413,
    "type": "error"
});