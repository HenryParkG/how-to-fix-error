window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Frame Use-After-Free",
    "slug": "cpp20-coroutine-uaf-fix",
    "language": "C++",
    "code": "Use-After-Free",
    "tags": [
        "Rust",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines allocate a 'coroutine frame' on the heap to store local variables and execution state. A common failure in custom asynchronous schedulers occurs when the scheduler resumes a coroutine handle that has already been destroyed or when the <code>final_suspend</code> logic incorrectly manages the handle ownership.</p><p>When a coroutine reaches its final suspension point, the promise object is still alive. If the scheduler or a wrapper object calls <code>.destroy()</code> prematurely, or if the coroutine is configured to auto-destroy while a reference still exists in the task queue, subsequent access attempts trigger a Use-After-Free (UAF) vulnerability.</p>",
    "root_cause": "The coroutine handle is destroyed either manually via .destroy() or by falling off the end of a non-suspending final_suspend, while the scheduler still holds a reference to the handle in its ready queue.",
    "bad_code": "struct Task {\n  struct promise_type {\n    std::suspend_never final_suspend() noexcept { return {}; }\n    // ...\n  };\n  std::coroutine_handle<promise_type> handle;\n  ~Task() { if(handle) handle.destroy(); }\n};",
    "solution_desc": "Implement a 'suspend_always' strategy for final_suspend and transition ownership of the coroutine frame destruction to the Task wrapper or a dedicated lifetime manager. This ensures the frame stays alive until the scheduler has finished the last resumption.",
    "good_code": "struct Task {\n  struct promise_type {\n    std::suspend_always final_suspend() noexcept { return {}; }\n    // ...\n  };\n  // Handle is destroyed only when Task goes out of scope\n  // after the coroutine has reached final_suspend.\n  ~Task() { if(handle && handle.done()) handle.destroy(); }\n};",
    "verification": "Run the binary through AddressSanitizer (ASan). If the fix is correct, no 'heap-use-after-free' errors will be reported during high-concurrency execution.",
    "date": "2026-04-19",
    "id": 1776563354,
    "type": "error"
});