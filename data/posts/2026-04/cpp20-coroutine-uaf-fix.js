window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Promise Use-After-Free",
    "slug": "cpp20-coroutine-uaf-fix",
    "language": "C++",
    "code": "Use-After-Free",
    "tags": [
        "Rust",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>In C++20 coroutines, the coroutine state (including the promise object) is managed by the compiler. A common bug in custom schedulers occurs when the coroutine is allowed to finish while the scheduler still holds a reference to the <code>coroutine_handle</code>. If <code>final_suspend</code> returns <code>std::suspend_never</code>, the state is destroyed immediately, turning any subsequent access into a use-after-free error.</p>",
    "root_cause": "The coroutine reaches its final suspension point and deallocates its frame before the scheduler completes its task tracking.",
    "bad_code": "struct Task {\n    struct promise_type {\n        // BUG: Coroutine frame destroyed before caller is ready\n        std::suspend_never final_suspend() noexcept { return {}; }\n        // ...\n    };\n};",
    "solution_desc": "Always use std::suspend_always in final_suspend for managed tasks. This prevents the compiler from automatically destroying the coroutine frame, allowing the scheduler or the handle owner to call .destroy() manually after bookkeeping.",
    "good_code": "struct Task {\n    struct promise_type {\n        // Keep frame alive until manual destruction\n        std::suspend_always final_suspend() noexcept { return {}; }\n        void unhandled_exception() { std::terminate(); }\n        // ...\n    };\n    ~Task() { if (handle) handle.destroy(); }\n    std::coroutine_handle<promise_type> handle;\n};",
    "verification": "Run the application with AddressSanitizer (ASan) enabled and verify no 'use-after-free' errors are reported during coroutine completion.",
    "date": "2026-04-27",
    "id": 1777268764,
    "type": "error"
});