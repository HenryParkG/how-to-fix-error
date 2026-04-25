window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Lifecycle Leaks in Runtimes",
    "slug": "cpp20-coroutine-lifecycle-leaks-fix",
    "language": "C++",
    "code": "MemoryLeak",
    "tags": [
        "Backend",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines introduce a paradigm shift but lack a default ownership model for the coroutine frame. In asynchronous promise runtimes, the coroutine state is allocated on the heap. If the lifecycle management between the <code>promise_type</code>, the <code>std::coroutine_handle</code>, and the custom <code>Task/Future</code> object is not perfectly synchronized, the frame is never destroyed, leading to silent memory growth. This is particularly prevalent when using <code>std::suspend_always</code> in <code>final_suspend</code> without a guaranteed destruction path in the executor.</p>",
    "root_cause": "The coroutine frame is not automatically destroyed if the coroutine reaches its final suspension point and the final_suspend returns std::suspend_always. The handle must be manually destroyed via .destroy(), but often the Task object is moved or dropped before the executor finishes execution.",
    "bad_code": "struct Task {\n  struct promise_type {\n    std::suspend_always final_suspend() noexcept { return {}; }\n    // ... other methods\n  };\n  std::coroutine_handle<promise_type> handle;\n  ~Task() { /* Missing handle.destroy() or check if done */ }\n};",
    "solution_desc": "Implement a clear ownership transfer. Use a thread-safe reference-counted state or ensure the Task destructor handles the coroutine destruction only if the coroutine has been suspended at its final point. Alternatively, use std::suspend_never in final_suspend if the promise doesn't need to be accessed post-completion, though this is risky for asynchronous results.",
    "good_code": "struct Task {\n  ~Task() {\n    if (handle) {\n      if (handle.done()) handle.destroy();\n      else detach_to_executor(handle); // Hand off cleanup\n    }\n  }\n  struct promise_type {\n    std::suspend_always final_suspend() noexcept {\n      // Notify awaiters and allow destruction\n      return {};\n    }\n  };\n  std::coroutine_handle<promise_type> handle;\n};",
    "verification": "Use Valgrind or LLVM AddressSanitizer (ASan) with leak detection enabled. Monitor the process RSS while cycling thousands of short-lived coroutines.",
    "date": "2026-04-25",
    "id": 1777100662,
    "type": "error"
});