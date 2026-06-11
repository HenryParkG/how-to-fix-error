window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Frame Leaks in Async Loops",
    "slug": "fixing-cpp20-coroutine-frame-leaks-in-async-loops",
    "language": "C++",
    "code": "Memory Leak",
    "tags": [
        "C++",
        "Asynchronous",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>In high-performance asynchronous event loops, C++20 coroutines are heavily utilized to avoid callback hell. However, because coroutine frames are typically allocated on the heap, failing to manage their lifecycle correctly results in severe memory leaks. Unlike standard functions, a coroutine's frame persists after execution suspends. If the driving asynchronous event loop cancels a task or drops a coroutine handle without explicitly calling its <code>destroy()</code> member function, the heap-allocated coroutine frame is permanently orphaned.</p>",
    "root_cause": "The RAII wrapper (often a custom 'Task' or 'Future' object) fails to destroy the coroutine handle in its destructor when the coroutine is cancelled or abandoned before reaching its final suspension point.",
    "bad_code": "template <typename T>\nstruct Task {\n    struct promise_type {\n        Task get_return_object() { return Task{std::coroutine_handle<promise_type>::from_promise(*this)}; }\n        std::suspend_always initial_suspend() { return {}; }\n        std::suspend_always final_suspend() noexcept { return {}; }\n        void unhandled_exception() { std::terminate(); }\n        void return_value(T val) { value = val; }\n        T value;\n    };\n\n    std::coroutine_handle<promise_type> handle;\n    \n    Task(std::coroutine_handle<promise_type> h) : handle(h) {}\n    // BUG: Destructor does not destroy the coroutine handle if execution is incomplete or suspended\n    ~Task() {}\n};",
    "solution_desc": "Implement a robust RAII destructor within the Task wrapper. The destructor must explicitly check if the coroutine handle is valid and hasn't finished, and subsequently invoke handle.destroy(). This ensures that whether the coroutine runs to completion, throws an exception, or is prematurely cancelled by the asynchronous event loop, the associated heap allocation is reliably deallocated.",
    "good_code": "template <typename T>\nstruct Task {\n    struct promise_type {\n        Task get_return_object() { return Task{std::coroutine_handle<promise_type>::from_promise(*this)}; }\n        std::suspend_always initial_suspend() { return {}; }\n        std::suspend_always final_suspend() noexcept { return {}; }\n        void unhandled_exception() { std::terminate(); }\n        void return_value(T val) { value = val; }\n        T value;\n    };\n\n    std::coroutine_handle<promise_type> handle;\n\n    Task(std::coroutine_handle<promise_type> h) : handle(h) {}\n    \n    // Move-only semantics to prevent duplicate ownership\n    Task(const Task&) = delete;\n    Task& operator=(const Task&) = delete;\n    Task(Task&& other) noexcept : handle(other.handle) { other.handle = nullptr; }\n    Task& operator=(Task&& other) noexcept {\n        if (this != &other) {\n            if (handle) handle.destroy();\n            handle = other.handle;\n            other.handle = nullptr;\n        }\n        return *this;\n    }\n\n    // RAII Destructor reliably cleans up the coroutine frame\n    ~Task() {\n        if (handle) {\n            handle.destroy();\n        }\n    }\n};",
    "verification": "Compile the code using GCC or Clang with AddressSanitizer and LeakSanitizer enabled (`-fsanitize=address,leak`). Run the asynchronous loop, trigger task cancellations, and confirm that zero memory leaks are reported in the sanitization log.",
    "date": "2026-06-11",
    "id": 1781162587,
    "type": "error"
});