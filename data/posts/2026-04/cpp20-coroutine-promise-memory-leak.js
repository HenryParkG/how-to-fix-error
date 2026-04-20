window.onPostDataLoaded({
    "title": "Resolving C++20 Coroutine Promise Memory Leaks",
    "slug": "cpp20-coroutine-promise-memory-leak",
    "language": "C++",
    "code": "Memory Leak",
    "tags": [
        "Rust",
        "Systems",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In C++20, coroutines allocate a 'coroutine frame' on the heap to store the promise object and local variables. Unlike standard functions, this frame's lifecycle is managed by a <code>std::coroutine_handle</code>. A frequent source of memory leaks occurs when developers assume that the coroutine frame is automatically destroyed when it reaches <code>final_suspend</code>. In many custom implementations, if <code>final_suspend</code> returns <code>std::suspend_always</code>, the coroutine is paused but the memory remains allocated until <code>handle.destroy()</code> is explicitly invoked.</p>",
    "root_cause": "The coroutine handle is not explicitly destroyed after reaching the final suspension point, or the RAII wrapper fails to call .destroy() on the handle during stack unwinding.",
    "bad_code": "struct Task { \n  struct promise_type { ... };\n  std::coroutine_handle<promise_type> handle;\n  // No destructor calling handle.destroy()\n};\n\nTask my_coro() { co_return; }\n\nvoid run() {\n  auto t = my_coro(); // Frame allocated\n} // handle lost, memory leaked",
    "solution_desc": "Implement a strict RAII wrapper for the coroutine handle. Ensure the destructor checks for handle validity and calls destroy(). Additionally, design the promise_type to return suspend_always at final_suspend to allow the owner to inspect results before manual destruction.",
    "good_code": "struct Task {\n  struct promise_type { ... };\n  std::coroutine_handle<promise_type> handle;\n  Task(auto h) : handle(h) {}\n  ~Task() { if (handle) handle.destroy(); }\n  Task(const Task&) = delete;\n  Task& operator=(const Task&) = delete;\n};",
    "verification": "Use Valgrind or AddressSanitizer (ASan) with '-fsanitize=address'. Monitor the 'definitely lost' report to ensure the coroutine frame count matches the destruction count.",
    "date": "2026-04-20",
    "id": 1776671538,
    "type": "error"
});