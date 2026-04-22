window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Frame Leaks in High-Perf Servers",
    "slug": "cpp20-coroutine-frame-leaks",
    "language": "C++",
    "code": "MemoryLeak",
    "tags": [
        "C++",
        "Performance",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines represent a paradigm shift in asynchronous programming, but they introduce complex lifecycle management requirements. In high-performance server environments, developers often encounter 'silent' memory leaks where coroutine frames\u2014the heap-allocated state holding local variables and the promise object\u2014are never deallocated. This typically occurs because the <code>coroutine_handle</code> is lost or the final suspension point is reached without a proper call to <code>destroy()</code>.</p><p>Unlike traditional objects, a coroutine's state is detached from the function's scope. If the coroutine reaches its final suspension point but the handle owner doesn't explicitly clean it up, the memory remains allocated indefinitely, leading to a steady climb in RSS (Resident Set Size).</p>",
    "root_cause": "The coroutine handle is not destroyed when the coroutine finishes in a suspended state, or the 'final_suspend' method returns 'std::suspend_always' without a mechanism to trigger manual destruction.",
    "bad_code": "struct Task {\n  struct promise_type {\n    std::suspend_always initial_suspend() { return {}; }\n    std::suspend_always final_suspend() noexcept { return {}; }\n    void return_void() {}\n    Task get_return_object() { return Task{std::coroutine_handle<promise_type>::from_promise(*this)}; }\n    void unhandled_exception() {}\n  };\n  std::coroutine_handle<promise_type> h_;\n};\n\n// Usage: Handle is ignored, frame leaks when scope ends\nvoid fire_and_forget() {\n  []() -> Task { co_return; }(); \n}",
    "solution_desc": "Implement a RAII wrapper for the coroutine handle and ensure the 'final_suspend' logic is integrated with the lifetime of the calling object. Using 'std::suspend_never' at the end of the coroutine allows the compiler to automatically clean up the frame if the handle isn't needed elsewhere.",
    "good_code": "struct Task {\n  struct promise_type {\n    std::suspend_always initial_suspend() { return {}; }\n    // Auto-cleanup by returning suspend_never\n    std::suspend_never final_suspend() noexcept { return {}; }\n    void return_void() {}\n    Task get_return_object() { return {std::coroutine_handle<promise_type>::from_promise(*this)}; }\n    void unhandled_exception() {}\n  };\n  \n  std::coroutine_handle<promise_type> h_;\n  ~Task() { if (h_) h_.destroy(); }\n  Task(Task&& other) : h_(std::exchange(other.h_, {})) {}\n};",
    "verification": "Use Valgrind or AddressSanitizer (ASAN) with LeakSanitizer enabled. Monitor the 'coroutine_frame_allocations' metric if using a custom allocator.",
    "date": "2026-04-22",
    "id": 1776842491,
    "type": "error"
});