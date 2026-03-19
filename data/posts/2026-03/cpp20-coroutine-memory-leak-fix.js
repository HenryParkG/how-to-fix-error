window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Leaks in Suspended Promises",
    "slug": "cpp20-coroutine-memory-leak-fix",
    "language": "C++ / Rust",
    "code": "MemoryLeak",
    "tags": [
        "Rust",
        "Systems Programming",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines are stackless, meaning their state is typically allocated on the heap via operator new. A common pitfall occurs when a coroutine reaches its final suspension point. If the promise type specifies <code>std::suspend_always</code> for <code>final_suspend()</code>, the coroutine state is not automatically destroyed. If the caller or the managing object (like a Task or Future) fails to call <code>handle.destroy()</code>, the coroutine frame remains orphaned in memory indefinitely. This is exacerbated in asynchronous event loops where thousands of coroutines may be suspended awaiting external I/O that never completes, leading to gradual heap exhaustion.</p>",
    "root_cause": "The coroutine promise type uses final_suspend returning std::suspend_always without a corresponding RAII-managed call to coroutine_handle::destroy().",
    "bad_code": "struct MyTask {\n  struct promise_type {\n    std::suspend_always initial_suspend() { return {}; }\n    // LEAK: Returns suspend_always but caller doesn't destroy\n    std::suspend_always final_suspend() noexcept { return {}; }\n    MyTask get_return_object() { return {std::coroutine_handle<promise_type>::from_promise(*this)}; }\n    void unhandled_exception() {}\n  };\n  std::coroutine_handle<promise_type> h;\n  // Missing Destructor calling h.destroy()\n};",
    "solution_desc": "Implement a strict RAII wrapper for the coroutine handle. Ensure that the destructor of the Task object calls handle.destroy() if the handle is valid. Alternatively, use std::suspend_never in final_suspend if the lifecycle is managed entirely by the coroutine completion itself, though RAII is safer for cancelled tasks.",
    "good_code": "struct MyTask {\n  struct promise_type {\n    std::suspend_always initial_suspend() { return {}; }\n    std::suspend_always final_suspend() noexcept { return {}; }\n    MyTask get_return_object() { return {std::coroutine_handle<promise_type>::from_promise(*this)}; }\n    void return_void() {}\n    void unhandled_exception() { std::terminate(); }\n  };\n  std::coroutine_handle<promise_type> h;\n  ~MyTask() { if (h) h.destroy(); }\n  MyTask(MyTask&& other) : h(other.h) { other.h = nullptr; }\n  // Prevent copying to avoid double destroy\n  MyTask(const MyTask&) = delete;\n};",
    "verification": "Compile with Clang/LLVM and run through Valgrind or AddressSanitizer (ASAN). Verify '0 bytes in 0 blocks' are leaked after the coroutine reaches final_suspend.",
    "date": "2026-03-19",
    "id": 1773912905,
    "type": "error"
});