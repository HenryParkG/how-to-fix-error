window.onPostDataLoaded({
    "title": "Debugging C++20 Coroutine Frame Allocation Leaks",
    "slug": "cpp20-coroutine-halo-allocation-leaks",
    "language": "C++",
    "code": "Memory Leak",
    "tags": [
        "C++",
        "C++20",
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In modern C++, C++20 coroutines promise high-performance asynchronous execution without the overhead of heap allocations if the compiler can apply Heap Allocation Elision Optimization (HALO). However, HALO is a brittle compiler optimization. When LLVM or GCC cannot statically guarantee that the coroutine's lifetime is nested strictly within the caller's lifetime, or when the coroutine object escapes the scope, HALO silently fails. This falls back to standard heap allocation. If the return object's destructor fails to clean up, or if developers expect elision that does not happen under complex control flows, massive memory leaks occur in long-running backend services.</p>",
    "root_cause": "The compiler optimizer fails to apply HALO because the coroutine's promise/handle lifetime is not guaranteed to be strictly nested within the calling scope, or the return type lacks a deterministic RAII-based destroy mechanism, causing the dynamically allocated coroutine frame to leak.",
    "bad_code": "#include <coroutine>\n#include <iostream>\n\nstruct Task {\n    struct promise_type {\n        Task get_return_object() {\n            return Task{std::coroutine_handle<promise_type>::from_promise(*this)};\n        }\n        std::suspend_never initial_suspend() { return {}; }\n        std::suspend_always final_suspend() noexcept { return {}; }\n        void return_void() {}\n        void unhandled_exception() {}\n    };\n    std::coroutine_handle<promise_type> handle;\n};\n\nTask leaked_coroutine() {\n    co_return;\n}\n\nvoid run() {\n    // HALO fails because handle escapes and is never destroyed!\n    auto t = leaked_coroutine();\n}",
    "solution_desc": "Wrap the raw coroutine handle in an explicit, non-copyable RAII wrapper that guarantees handle destruction on scope exit. Ensure that the coroutine lifetime is strictly structured so the compiler's escape analysis can statically prove nesting, allowing HALO to succeed.",
    "good_code": "#include <coroutine>\n#include <utility>\n\ntemplate<typename T = void>\nstruct UniqueTask {\n    struct promise_type {\n        UniqueTask get_return_object() {\n            return UniqueTask{std::coroutine_handle<promise_type>::from_promise(*this)};\n        }\n        std::suspend_always initial_suspend() noexcept { return {}; }\n        std::suspend_always final_suspend() noexcept { return {}; }\n        void return_void() noexcept {}\n        void unhandled_exception() { std::terminate(); }\n    };\n\n    std::coroutine_handle<promise_type> handle;\n\n    explicit UniqueTask(std::coroutine_handle<promise_type> h) : handle(h) {}\n    ~UniqueTask() { if (handle) handle.destroy(); }\n\n    UniqueTask(const UniqueTask&) = delete;\n    UniqueTask& operator=(const UniqueTask&) = delete;\n    UniqueTask(UniqueTask&& other) noexcept : handle(std::exchange(other.handle, nullptr)) {}\n};\n\nUniqueTask<> optimized_coroutine() {\n    co_return;\n}\n\nvoid run_optimized() {\n    auto task = optimized_coroutine();\n    task.handle.resume(); // Safe nested execution; HALO can optimize frame allocation\n}",
    "verification": "Compile with Clang using '-O3 -Rpass=coro-elide' to verify diagnostics confirming that coroutine frame allocation elision occurred successfully. Use Valgrind or AddressSanitizer (ASan) to assert zero dynamic memory allocations during runtime execution.",
    "date": "2026-06-02",
    "id": 1780403765,
    "type": "error"
});