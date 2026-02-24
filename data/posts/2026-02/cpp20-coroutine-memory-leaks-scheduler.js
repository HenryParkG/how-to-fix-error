window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Leaks in Custom Schedulers",
    "slug": "cpp20-coroutine-memory-leaks-scheduler",
    "language": "C++",
    "code": "MemoryLeak",
    "tags": [
        "Rust",
        "Multithreading",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines shift memory management responsibility to the programmer. When using custom schedulers, memory leaks typically occur because the coroutine frame is not destroyed when the coroutine reaches its final suspension point. Unlike standard functions, the coroutine frame remains allocated on the heap unless <code>coroutine_handle::destroy()</code> is explicitly called or the promise object is configured to auto-destroy.</p><p>In high-performance schedulers, this often happens because the scheduler loses track of the handle during an asynchronous handoff or a race condition between completion and cancellation.</p>",
    "root_cause": "The coroutine promise's final_suspend returns std::suspend_always, but the custom executor fails to call .destroy() on the handle after the final resume.",
    "bad_code": "struct Task {\n  struct promise_type {\n    std::suspend_always initial_suspend() { return {}; }\n    std::suspend_always final_suspend() noexcept { return {}; } // Stays alive!\n    void return_void() {}\n    Task get_return_object() { return Task{handle_type::from_promise(*this)}; }\n  };\n  handle_type h_;\n};",
    "solution_desc": "Implement a 'Symmetric Transfer' or ensure the scheduler/wrapper object calls .destroy() in its destructor or upon reaching final_suspend if the coroutine is detached.",
    "good_code": "struct Task {\n  ~Task() { if (h_) h_.destroy(); }\n  struct promise_type {\n    std::suspend_always initial_suspend() { return {}; }\n    // Use std::suspend_never to auto-cleanup if detached,\n    // or manage life-cycle via the Task wrapper's RAII.\n    std::suspend_always final_suspend() noexcept { return {}; }\n    void unhandled_exception() { std::terminate(); }\n  };\n  handle_type h_;\n};",
    "verification": "Use Valgrind or ASAN with -fsanitize=address to track heap allocations. Ensure 'leaked' frames are reclaimed after the scheduler loop exits.",
    "date": "2026-02-24",
    "id": 1771908463,
    "type": "error"
});