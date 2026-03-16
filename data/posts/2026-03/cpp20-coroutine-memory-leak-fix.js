window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Leaks in Async Networking",
    "slug": "cpp20-coroutine-memory-leak-fix",
    "language": "C++",
    "code": "MemoryLeak",
    "tags": [
        "Rust",
        "Backend",
        "Networking",
        "Error Fix"
    ],
    "analysis": "<p>In high-performance asynchronous networking runtimes, C++20 coroutines are often used to simplify callback chains. However, a common pitfall occurs when the coroutine handle is not explicitly destroyed, leading to persistent memory leaks. Unlike higher-level languages, C++ coroutines do not have automatic garbage collection. If a coroutine finishes its execution or is suspended indefinitely without its <code>std::coroutine_handle::destroy()</code> being called, the promise object and the coroutine frame remain on the heap indefinitely.</p>",
    "root_cause": "The promise_type fails to call destroy() on the coroutine handle during the final suspension point, or the owner of the handle loses track of the coroutine state before it reaches completion.",
    "bad_code": "struct Task {\n  struct promise_type {\n    std::suspend_never initial_suspend() { return {}; }\n    std::suspend_always final_suspend() noexcept { return {}; }\n    void return_void() {}\n    Task get_return_object() { return Task{std::coroutine_handle<promise_type>::from_promise(*this)}; }\n    void unhandled_exception() { std::terminate(); }\n  };\n  std::coroutine_handle<promise_type> handle;\n  // Missing Destructor to cleanup handle\n};",
    "solution_desc": "Implement a proper RAII wrapper for the coroutine handle. Ensure that the task object's destructor calls handle.destroy() if the handle is valid, and use std::suspend_always in final_suspend to ensure the coroutine frame isn't prematurely deallocated before the wrapper can inspect it.",
    "good_code": "struct Task {\n  struct promise_type {\n    std::suspend_never initial_suspend() { return {}; }\n    std::suspend_always final_suspend() noexcept { return {}; }\n    void return_void() {}\n    Task get_return_object() { return Task{std::coroutine_handle<promise_type>::from_promise(*this)}; }\n    void unhandled_exception() { std::terminate(); }\n  };\n  std::coroutine_handle<promise_type> handle;\n  ~Task() { if (handle) handle.destroy(); }\n  Task(Task&& other) : handle(other.handle) { other.handle = nullptr; }\n};",
    "verification": "Monitor the process memory using Valgrind or LeakSanitizer (ASan). Ensure that the 'leaked' byte count remains zero after thousands of async network requests.",
    "date": "2026-03-16",
    "id": 1773637777,
    "type": "error"
});