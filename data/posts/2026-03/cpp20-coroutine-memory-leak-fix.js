window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Memory Leaks in Promise Lifetimes",
    "slug": "cpp20-coroutine-memory-leak-fix",
    "language": "C++",
    "code": "MemoryLeak",
    "tags": [
        "Backend",
        "C++",
        "RAII",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines introduce a hidden heap allocation for the coroutine frame. Unlike standard functions, the lifetime of this frame is managed by a <code>promise_type</code> and tracked via a <code>std::coroutine_handle</code>. A frequent source of memory leaks occurs when the <code>final_suspend</code> method returns <code>std::suspend_always</code>, but the caller fails to manually call <code>handle.destroy()</code>. Alternatively, leaks happen when the coroutine object is copied without implementing proper move semantics, leading to orphaned handles that still point to allocated frames in the heap.</p>",
    "root_cause": "The coroutine frame is not automatically destroyed if the coroutine reaches its final suspension point with 'std::suspend_always' unless destroy() is explicitly called on the handle.",
    "bad_code": "struct Task {\n    struct promise_type {\n        std::suspend_always initial_suspend() { return {}; }\n        std::suspend_always final_suspend() noexcept { return {}; }\n        void unhandled_exception() {}\n        Task get_return_object() { return {std::coroutine_handle<promise_type>::from_promise(*this)}; }\n        void return_void() {}\n    };\n    std::coroutine_handle<promise_type> handle;\n    // Missing Destructor to call handle.destroy()\n};",
    "solution_desc": "Implement the RAII pattern for the coroutine wrapper object. Ensure the destructor calls handle.destroy() if the handle is valid. Additionally, disable copying and implement move semantics to ensure single ownership of the coroutine frame.",
    "good_code": "struct Task {\n    struct promise_type { /* ... same as above ... */ };\n    std::coroutine_handle<promise_type> handle;\n    \n    Task(std::coroutine_handle<promise_type> h) : handle(h) {}\n    ~Task() { if (handle) handle.destroy(); }\n    \n    // Move-only semantics\n    Task(const Task&) = delete;\n    Task(Task&& other) noexcept : handle(other.handle) { other.handle = nullptr; }\n    Task& operator=(Task&& other) noexcept {\n        if (this != &other) {\n            if (handle) handle.destroy();\n            handle = other.handle;\n            other.handle = nullptr;\n        }\n        return *this;\n    }\n};",
    "verification": "Run the application through Valgrind or use LLVM's AddressSanitizer (ASan) with 'leak' detection enabled to verify zero 'still reachable' blocks.",
    "date": "2026-03-30",
    "id": 1774865313,
    "type": "error"
});