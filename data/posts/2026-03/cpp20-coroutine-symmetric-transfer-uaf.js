window.onPostDataLoaded({
    "title": "Fixing Use-After-Free in C++20 Coroutine Transfers",
    "slug": "cpp20-coroutine-symmetric-transfer-uaf",
    "language": "C++",
    "code": "Use-After-Free",
    "tags": [
        "Rust",
        "Backend",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines using symmetric transfer (returning a <code>coroutine_handle</code> from <code>await_suspend</code>) are prone to Use-After-Free (UAF) if the yielding coroutine's promise object or local variables are accessed after the handle is returned. In a state machine, if the next coroutine executes and completes immediately, it may trigger the destruction of the shared state or the parent coroutine before the initial <code>await_suspend</code> scope has fully exited.</p>",
    "root_cause": "The symmetric transfer mechanism transfers execution immediately. If the suspended coroutine is owned by the 'next' coroutine being transferred to, the 'current' coroutine might be destroyed while the CPU is still executing its suspension epilogue.",
    "bad_code": "std::coroutine_handle<> await_suspend(std::coroutine_handle<promise_type> h) {\n    auto next = this->next_task;\n    // BUG: If next_task resumes and deletes 'h', this scope is invalid\n    return next; \n}",
    "solution_desc": "Implement a detached state or a reference-counting mechanism for the coroutine promise. Ensure that the handle being returned is not responsible for the immediate cleanup of the current coroutine's frame unless it is the final act of the execution. Use `std::noop_coroutine()` as a safeguard if no transfer is required.",
    "good_code": "struct final_awaiter {\n    bool await_ready() noexcept { return false; }\n    std::coroutine_handle<> await_suspend(std::coroutine_handle<promise_type> h) noexcept {\n        // Atomically transfer ownership or use a task-scheduler\n        if (auto next = h.promise().continuation) {\n            return next;\n        }\n        return std::noop_coroutine();\n    }\n    void await_resume() noexcept {}\n};",
    "verification": "Run the binary through AddressSanitizer (ASan) with `LSAN_OPTIONS=verbosity=1` and ensure no 'heap-use-after-free' is reported during high-concurrency state transitions.",
    "date": "2026-03-27",
    "id": 1774604847,
    "type": "error"
});