window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Promise-Type Lifecycle Mismatches",
    "slug": "cpp20-coroutine-lifecycle-mismatches",
    "language": "C++",
    "code": "LifetimeError",
    "tags": [
        "Rust",
        "Go",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines introduce a complex ownership model involving the coroutine frame, the promise object, and the return object. A frequent error occurs when the coroutine handle is destroyed while the return object (like a Task or Future) still attempts to access the promise_type. This typically happens when the coroutine reaches its final suspension point and is configured to auto-destroy, but the caller still holds a handle to the now-freed memory.</p>",
    "root_cause": "The coroutine frame is destroyed upon reaching the final suspension point (return_void/return_value) if the final_awaiter returns false, leading to a use-after-free when the returning future object tries to access the promise.",
    "bad_code": "struct Task {\n  struct promise_type {\n    Task get_return_object() { return Task{handle_type::from_promise(*this)}; }\n    std::suspend_never initial_suspend() { return {}; }\n    std::suspend_never final_suspend() noexcept { return {}; } // Auto-destroys!\n    void return_void() {}\n  };\n  handle_type h;\n};",
    "solution_desc": "Implement proper RAII for the coroutine handle. Ensure the final_suspend returns std::suspend_always to keep the frame alive until the Task object's destructor explicitly calls handle.destroy().",
    "good_code": "struct Task {\n  struct promise_type {\n    Task get_return_object() { return Task{handle_type::from_promise(*this)}; }\n    std::suspend_always initial_suspend() { return {}; }\n    std::suspend_always final_suspend() noexcept { return {}; } // Keeps frame alive\n    void return_void() {}\n  };\n  ~Task() { if (h) h.destroy(); }\n  handle_type h;\n};",
    "verification": "Compile with -fsanitize=address and run unit tests to ensure no heap-use-after-free occurs during coroutine completion.",
    "date": "2026-05-05",
    "id": 1777967685,
    "type": "error"
});