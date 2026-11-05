window.onPostDataLoaded({
    "title": "Fix C++20 Coroutine Leaks & Cancellation Deadlocks",
    "slug": "fix-cpp20-coroutine-leaks-cancellation-deadlocks",
    "language": "C++20",
    "code": "COROUTINE_LEAK",
    "tags": [
        "C++20",
        "Concurrency",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>In asynchronous C++20 systems, coroutines using custom promise types frequently leak their allocated frame memory when an external cancellation occurs prior to execution completion. When a caller attempts to cancel a task by calling <code>destroy()</code> on a <code>std::coroutine_handle</code> while the coroutine is suspended at an intermediate suspension point, a race condition often ensues. If the promise retains references to synchronization primitives (such as mutexes or condition variables) that depend on another thread resuming the frame, destroying or detaching the handle abruptly leads to deadlocks or undefined memory behavior.</p><p>Furthermore, standard suspension via <code>std::suspend_always</code> does not inherently propagate cooperative cancellation tokens. Without explicit integration with <code>std::stop_token</code>, calling threads block indefinitely waiting for an awaited event that was cancelled upstream.</p>",
    "root_cause": "Destroying coroutine handles externally while suspended inside nested awaitables without cooperative cancellation triggers unmanaged frame deallocation, skips RAII destructors, and causes circular wait deadlocks on promise completion flags.",
    "bad_code": "struct Task {\n    struct promise_type {\n        std::suspend_always initial_suspend() noexcept { return {}; }\n        std::suspend_always final_suspend() noexcept { return {}; }\n        Task get_return_object() { return Task{std::coroutine_handle<promise_type>::from_promise(*this)}; }\n        void return_void() {}\n        void unhandled_exception() { std::terminate(); }\n    };\n    std::coroutine_handle<promise_type> handle;\n    ~Task() {\n        // Bug: Hard destroying handle while coroutine might be waiting on another thread\n        if (handle && !handle.done()) {\n            handle.destroy(); // Causes use-after-free or deadlocks suspended workers\n        }\n    }\n};",
    "solution_desc": "Integrate C++20 `std::stop_token` directly into the coroutine's promise and custom awaiters. Instead of forcefully invoking `handle.destroy()`, signal the stop source cooperatively. Custom awaiters must register callbacks that resume the coroutine into an early-exit or exception path, ensuring that all local stack variables run their RAII destructors before reaching `final_suspend`.",
    "good_code": "#include <coroutine>\n#include <stop_token>\n#include <atomic>\n\nstruct CancellableTask {\n    struct promise_type {\n        std::stop_token stop_token;\n        std::suspend_always initial_suspend() noexcept { return {}; }\n        // Use suspend_always on final to allow caller to clean up safely via RAII\n        std::suspend_always final_suspend() noexcept { return {}; }\n        CancellableTask get_return_object() {\n            return CancellableTask{std::coroutine_handle<promise_type>::from_promise(*this)};\n        }\n        void return_void() noexcept {}\n        void unhandled_exception() {}\n    };\n\n    std::coroutine_handle<promise_type> h_;\n    explicit CancellableTask(std::coroutine_handle<promise_type> h) : h_(h) {}\n    \n    ~CancellableTask() {\n        if (h_) {\n            // Safe deallocation: handle is only destroyed once reached final_suspend\n            if (h_.done()) h_.destroy();\n        }\n    }\n};",
    "verification": "Compile with Clang/GCC using `-fsanitize=address,undefined -fsanitize=thread`. Execute high-frequency cancellation stress tests ensuring zero memory leaks reported by LeakSanitizer and no reported data races.",
    "date": "2026-11-05",
    "id": 1793887077,
    "type": "error"
});