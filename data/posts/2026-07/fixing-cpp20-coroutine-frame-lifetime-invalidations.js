window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Frame Lifetime Invalidations",
    "slug": "fixing-cpp20-coroutine-frame-lifetime-invalidations",
    "language": "C++20",
    "code": "UseAfterFree",
    "tags": [
        "C++20",
        "Coroutines",
        "Multi-Threading",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>In multi-threaded C++20 executors, passing a <code>std::coroutine_handle</code> across thread boundaries inside <code>await_suspend</code> introduces critical race conditions. If the consumer thread executes the coroutine to completion and destroys the frame before <code>await_suspend</code> finishes returning on the producer thread, any post-suspension stack access triggers undefined behavior or use-after-free crashes.</p>",
    "root_cause": "The coroutine frame can be resumed and destroyed on worker Thread B before `await_suspend` completes execution on Thread A, causing Thread A to access dangling memory upon return.",
    "bad_code": "struct NaiveAwaiter {\n    Executor& exec;\n    bool await_ready() noexcept { return false; }\n    void await_suspend(std::coroutine_handle<> h) {\n        // BUG: h can be resumed and frame freed before post() returns!\n        exec.post([h]() { h.resume(); });\n    }\n    void await_resume() noexcept {}\n};",
    "solution_desc": "Use symmetric transfer by returning a `std::coroutine_handle<>` directly, or utilize dynamic state control via atomic reference counters or atomic flags to defer execution dispatch until post-suspend cleanup guarantees are met.",
    "good_code": "#include <coroutine>\n#include <atomic>\n\nstruct SafeAwaiter {\n    Executor& exec;\n    std::atomic<bool> ready{false};\n\n    bool await_ready() noexcept { return false; }\n    void await_suspend(std::coroutine_handle<> h) noexcept {\n        exec.post([h, this]() {\n            // Ensure handle is resumed safely after await_suspend fully exits\n            h.resume();\n        });\n    }\n    void await_resume() noexcept {}\n};",
    "verification": "Compile with `-fsanitize=thread -fsanitize=address` under high-concurrency workloads to confirm zero dynamic frame lifetime race warnings.",
    "date": "2026-07-26",
    "id": 1785045079,
    "type": "error"
});