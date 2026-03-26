window.onPostDataLoaded({
    "title": "Debugging Use-After-Free Hazards in C++20 Coroutines",
    "slug": "cpp20-coroutine-use-after-free-symmetric-transfer",
    "language": "C++",
    "code": "MemoryCorruption",
    "tags": [
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In C++20, symmetric transfer allows a coroutine to yield control directly to another coroutine by returning a <code>std::coroutine_handle</code> from <code>await_suspend</code>. This avoids stack overflow in deep recursions and improves performance. However, a critical hazard arises when the yielding coroutine's scope is tied to the lifecycle of the promise. If the handle returned for transfer triggers the destruction of the current coroutine (e.g., via a shared state cleanup), the runtime may attempt to access the promise object after it has been deallocated, leading to a Use-After-Free (UAF) condition.</p>",
    "root_cause": "The yielding coroutine's handle is invalidated or the promise object is destroyed during the suspension phase before the symmetric transfer to the next coroutine is fully registered by the executor.",
    "bad_code": "auto await_suspend(std::coroutine_handle<> h) {\n    auto next = this->next_task;\n    // Potential UAF: h.destroy() might be called indirectly here\n    // if 'next' completion triggers current coroutine cleanup.\n    return next;\n}",
    "solution_desc": "Ensure the coroutine handle remains valid until the transfer is complete. Use a safer state management pattern where the destruction of the current coroutine is deferred or handled by a parent orchestrator only after the symmetric transfer has safely handed off execution.",
    "good_code": "std::coroutine_handle<> await_suspend(std::coroutine_handle<promise_type> h) noexcept {\n    // Transfer ownership of execution without destroying current state\n    // 'next' is returned to the caller to perform symmetric transfer\n    return h.promise().next_handle;\n}",
    "verification": "Compile with AddressSanitizer (ASan) and run with high-concurrency coroutine tests to check for shadow memory violations during suspension.",
    "date": "2026-03-26",
    "id": 1774501222,
    "type": "error"
});