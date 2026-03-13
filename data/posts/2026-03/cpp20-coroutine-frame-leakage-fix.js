window.onPostDataLoaded({
    "title": "Eliminating C++20 Coroutine Frame Leakage",
    "slug": "cpp20-coroutine-frame-leakage-fix",
    "language": "C++",
    "code": "Memory Leak",
    "tags": [
        "Go",
        "C++",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In C++20, coroutines allocate a 'coroutine frame' on the heap to store local variables and execution state. A common pitfall in asynchronous task chains occurs when a coroutine handle is not explicitly destroyed, or the promise type logic fails to handle the transition to the final suspension state. This results in the heap memory remaining allocated even after the logical task has completed.</p><p>The issue is particularly prevalent when using custom <code>Task&lt;T&gt;</code> types where the destructor doesn't check the <code>done()</code> status of the handle or when the <code>final_suspend</code> returns <code>std::suspend_never</code> while the caller still expects to manage the handle's lifecycle. In high-frequency async chains, this creates a slow, steady memory leak that eventually leads to OOM (Out of Memory) errors.</p>",
    "root_cause": "The promise_type's final_suspend returns suspend_always but the parent task never calls .destroy() on the coroutine handle, or vice versa, leading to orphaned heap-allocated frames.",
    "bad_code": "struct Task {\n    struct promise_type {\n        std::suspend_always initial_suspend() { return {}; }\n        std::suspend_never final_suspend() noexcept { return {}; }\n        // ... other methods\n    };\n    std::coroutine_handle<promise_type> handle;\n    ~Task() { /* Missing handle.destroy() or double free risk */ }\n};",
    "solution_desc": "Implement RAII for the coroutine handle within the Task wrapper. Ensure the promise_type uses std::suspend_always in final_suspend to allow the Task wrapper to manually manage the destruction, preventing premature frame deallocation or leakage.",
    "good_code": "struct Task {\n    struct promise_type {\n        std::suspend_always initial_suspend() { return {}; }\n        std::suspend_always final_suspend() noexcept { return {}; }\n        Task get_return_object() { return {std::coroutine_handle<promise_type>::from_promise(*this)}; }\n        void unhandled_exception() { std::terminate(); }\n        void return_void() {}\n    };\n    std::coroutine_handle<promise_type> handle;\n    Task(std::coroutine_handle<promise_type> h) : handle(h) {}\n    ~Task() { if (handle) handle.destroy(); }\n    Task(const Task&) = delete;\n    Task(Task&& other) : handle(other.handle) { other.handle = nullptr; }\n};",
    "verification": "Compile with Clang/GCC and run through Valgrind or AddressSanitizer (ASAN) using -fsanitize=address to ensure zero leaked blocks after task execution.",
    "date": "2026-03-13",
    "id": 1773376168,
    "type": "error"
});