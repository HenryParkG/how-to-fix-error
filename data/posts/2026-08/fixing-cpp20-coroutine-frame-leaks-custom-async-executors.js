window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Frame Leaks in Async Executors",
    "slug": "fixing-cpp20-coroutine-frame-leaks-custom-async-executors",
    "language": "C++20",
    "code": "Memory Leak",
    "tags": [
        "C++20",
        "Coroutines",
        "Memory Leak",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines introduce stackless multitasking by allocating a coroutine frame on the heap when <code>promise_type::get_return_object()</code> is executed. Unlike standard function frames managed on the stack, the lifecycle of a coroutine frame is bound to its associated <code>std::coroutine_handle&lt;&gt;</code>. If an asynchronous executor drops a coroutine task without explicitly invoking <code>coroutine_handle::destroy()</code>, or fails to properly resume suspension points during task cancellation, the allocated frame leaks permanently.</p><p>In custom async executors, this bug often occurs when exceptions are thrown or tasks are canceled before execution completes. If the executor's task wrapper fails to implement strict RAII ownership for the coroutine handle, any suspended frame detached from the execution graph remains orphaned in heap memory.</p>",
    "root_cause": "The custom task handle wrapper lacked an explicit destructor call to std::coroutine_handle::destroy() when the task was destroyed prior to reaching final_suspend, causing heap-allocated coroutine frames to leak upon early cancellation.",
    "bad_code": "#include <coroutine>\n#include <iostream>\n\ntemplate <typename T>\nstruct Task {\n    struct promise_type {\n        T value;\n        Task get_return_object() {\n            return Task{std::coroutine_handle<promise_type>::from_promise(*this)};\n        }\n        std::suspend_always initial_suspend() noexcept { return {}; }\n        std::suspend_always final_suspend() noexcept { return {}; }\n        void return_value(T val) noexcept { value = val; }\n        void unhandled_exception() { std::terminate(); }\n    };\n\n    std::coroutine_handle<promise_type> handle;\n\n    // BUG: Destructor does not destroy the handle!\n    // If Task is dropped before complete execution, frame leaks.\n    ~Task() {\n        // Missing handle.destroy();\n    }\n};",
    "solution_desc": "Implement full RAII ownership inside the custom Task type. The task destructor must check if the handle is valid and hasn't finished, calling `handle.destroy()` to clean up the heap frame. Additionally, prohibit copy construction and allow move operations only to guarantee unique ownership.",
    "good_code": "#include <coroutine>\n#include <utility>\n\ntemplate <typename T>\nstruct Task {\n    struct promise_type {\n        T value;\n        Task get_return_object() {\n            return Task{std::coroutine_handle<promise_type>::from_promise(*this)};\n        }\n        std::suspend_always initial_suspend() noexcept { return {}; }\n        std::suspend_always final_suspend() noexcept { return {}; }\n        void return_value(T val) noexcept { value = val; }\n        void unhandled_exception() { std::terminate(); }\n    };\n\n    std::coroutine_handle<promise_type> handle = nullptr;\n\n    explicit Task(std::coroutine_handle<promise_type> h) : handle(h) {}\n    \n    ~Task() {\n        if (handle) {\n            handle.destroy();\n        }\n    }\n\n    // Prevent copying to maintain unique ownership\n    Task(const Task&) = delete;\n    Task& operator=(const Task&) = delete;\n\n    // Allow move semantics\n    Task(Task&& other) noexcept : handle(std::exchange(other.handle, nullptr)) {}\n    Task& operator=(Task&& other) noexcept {\n        if (this != &other) {\n            if (handle) handle.destroy();\n            handle = std::exchange(other.handle, nullptr);\n        }\n        return *this;\n    }\n};",
    "verification": "Compile with AddressSanitizer and LeakSanitizer enabled (`-fsanitize=address,leak -g`). Instantiates multiple cancelled coroutine tasks in a loop and verify that zero memory leaks are reported by ASan upon termination.",
    "date": "2026-08-09",
    "id": 1786248651,
    "type": "error"
});