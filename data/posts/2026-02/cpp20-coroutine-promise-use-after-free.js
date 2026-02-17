window.onPostDataLoaded({
    "title": "C++20: Fixing Use-After-Free in Coroutine Promises",
    "slug": "cpp20-coroutine-promise-use-after-free",
    "language": "Backend",
    "code": "Memory Management",
    "tags": [
        "Rust",
        "Backend",
        "C++",
        "Error Fix"
    ],
    "analysis": "<p>In C++20 coroutines, the promise object is stored within the coroutine state. A common 'Use-After-Free' (UAF) occurs when the coroutine finishes execution and destroys its state while an external caller still holds a reference to the promise or data owned by it. This often happens because the coroutine's lifetime is managed by a handle that is implicitly destroyed when the coroutine reaches its final suspension point, yet the caller attempts to access result data stored in the promise after the coroutine has resumed and completed.</p>",
    "root_cause": "The coroutine state (and thus the promise) is destroyed automatically when control flow passes through the final suspension point if the coroutine is not configured to suspend there.",
    "bad_code": "struct Task {\n  struct promise_type {\n    std::string result;\n    std::suspend_never final_suspend() noexcept { return {}; }\n    // ... other methods\n  };\n};\n\nTask my_coro() { co_return \"data\"; }\n\n// Caller site\nauto& data = handle.promise().result; // UAF if coro finished",
    "solution_desc": "Configure the coroutine to use std::suspend_always for final_suspend(). This ensures the coroutine state remains alive until the caller explicitly calls handle.destroy(). This allows safe access to the promise data before manual cleanup.",
    "good_code": "struct promise_type {\n  std::string result;\n  // Suspend at the end to keep the promise alive\n  std::suspend_always final_suspend() noexcept { return {}; }\n  // ...\n};\n\n// Caller must manually destroy\nif (handle.done()) {\n  process(handle.promise().result);\n  handle.destroy();\n}",
    "verification": "Compile with Clang/GCC using -fsanitize=address. Run the test suite; if the heap-use-after-free error is gone, the lifetime management is correct.",
    "date": "2026-02-17",
    "id": 1771291038,
    "type": "error"
});