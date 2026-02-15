window.onPostDataLoaded({
    "title": "C++20 Coroutines: Fixing Use-After-Free in Promises",
    "slug": "cpp20-coroutines-fix-uaf-promise-lifecycle",
    "language": "C++",
    "code": "Use-After-Free",
    "tags": [
        "Node.js",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>In C++20 coroutines, the lifecycle of the promise object and the coroutine frame are tightly coupled. A frequent source of Use-After-Free (UAF) errors occurs when a coroutine handle is managed by an asynchronous executor that outlives the scope where the handle was created. If the coroutine reaches its <code>final_suspend</code> point and is configured to automatically destroy itself (via <code>std::suspend_never</code>), any subsequent attempt by the caller or a monitoring thread to access the promise object results in undefined behavior. This is particularly dangerous in high-concurrency environments where race conditions determine whether the frame still exists.</p>",
    "root_cause": "The coroutine reaches final_suspend and returns std::suspend_never, causing the coroutine frame to be deallocated automatically while a handle or pointer to the promise is still being accessed by the calling context.",
    "bad_code": "struct Task {\n    struct promise_type {\n        std::suspend_never final_suspend() noexcept { return {}; }\n        // ... other methods\n    };\n};\n\n// Caller side\nauto handle = my_coroutine();\n// Coroutine finishes internally and destroys frame\nstd::cout << handle.promise().result; // CRASH: UAF",
    "solution_desc": "Configure the coroutine to always suspend at the final point. This transfers ownership of the frame destruction to the holder of the coroutine handle, ensuring the promise remains valid until the caller explicitly calls .destroy().",
    "good_code": "struct Task {\n    struct promise_type {\n        // Prevents automatic destruction of the frame\n        std::suspend_always final_suspend() noexcept { return {}; }\n        // ...\n    };\n    ~Task() { if (handle) handle.destroy(); }\n    std::coroutine_handle<promise_type> handle;\n};",
    "verification": "Compile with AddressSanitizer (-fsanitize=address). Run the asynchronous flow; the sanitizer should no longer report invalid memory access on the promise object during teardown.",
    "date": "2026-02-15",
    "id": 1771137627,
    "type": "error"
});