window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Frame Leaks in Event Loops",
    "slug": "fixing-cpp20-coroutine-frame-leaks-event-loops",
    "language": "C++20",
    "code": "Memory Leak",
    "tags": [
        "C++",
        "Asio",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>In modern high-performance C++20 network servers, coroutines are frequently used to manage asynchronous event loops. However, because coroutine frames are typically allocated on the heap rather than the stack, they are highly prone to memory leaks. This occurs when a coroutine is suspended but the event loop halts, cancels the operation, or encounters an unhandled exception before the coroutine reaches its final suspension point. If the raw coroutine handle is not explicitly destroyed, the dynamically allocated coroutine frame is permanently orphaned in memory.</p>",
    "root_cause": "The wrapper class managing the coroutine lifetime (e.g., custom Task/Future wrappers) does not implement the RAII pattern to destroy the coroutine handle on premature destruction, or fails to call coroutine_handle::destroy() when the coroutine is cancelled before reaching its final_suspend state.",
    "bad_code": "template <typename T>\nstruct Task {\n    struct promise_type {\n        Task get_return_object() { return Task{std::coroutine_handle<promise_type>::from_promise(*this)}; }\n        std::suspend_always initial_suspend() { return {}; }\n        std::suspend_always final_suspend() noexcept { return {}; }\n        void unhandled_exception() { std::terminate(); }\n        void return_value(T value) { val = value; }\n        T val;\n    };\n\n    std::coroutine_handle<promise_type> handle;\n    \n    Task(std::coroutine_handle<promise_type> h) : handle(h) {}\n    // BUG: Destructor is missing! If the Task is discarded before completing,\n    // the heap-allocated coroutine frame is leaked.\n};",
    "solution_desc": "Implement a rigorous RAII-compliant custom Task wrapper. The destructor of the Task wrapper must verify if the coroutine handle is valid and has not completed, and then invoke `handle.destroy()` to safely free the coroutine frame.",
    "good_code": "template <typename T>\nstruct Task {\n    struct promise_type {\n        Task get_return_object() { return Task{std::coroutine_handle<promise_type>::from_promise(*this)}; }\n        std::suspend_always initial_suspend() { return {}; }\n        std::suspend_always final_suspend() noexcept { return {}; }\n        void unhandled_exception() { std::terminate(); }\n        void return_value(T value) { val = value; }\n        T val;\n    };\n\n    std::coroutine_handle<promise_type> handle;\n    \n    explicit Task(std::coroutine_handle<promise_type> h) : handle(h) {}\n    \n    // RAII Rule of 5 Implementation to prevent leaks\n    ~Task() {\n        if (handle) {\n            handle.destroy();\n        }\n    }\n    \n    Task(const Task&) = delete;\n    Task& operator=(const Task&) = delete;\n    \n    Task(Task&& other) noexcept : handle(other.handle) {\n        other.handle = nullptr;\n    }\n    \n    Task& operator=(Task&& other) noexcept {\n        if (this != &other) {\n            if (handle) handle.destroy();\n            handle = other.handle;\n            other.handle = nullptr;\n        }\n        return *this;\n    }\n};",
    "verification": "Compile with AddressSanitizer (ASan) enabled: `g++ -O3 -std=c++20 -fsanitize=address main.cpp`. Run the test suite that simulates network packet cancellation, and verify that ASan reports zero memory leaks.",
    "date": "2026-07-20",
    "id": 1784539127,
    "type": "error"
});