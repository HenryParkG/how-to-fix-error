window.onPostDataLoaded({
    "title": "Fix C++20 Coroutine Frame Leaks in Symmetric Transfer",
    "slug": "fix-cpp20-coroutine-frame-leaks-symmetric-transfer",
    "language": "C++",
    "code": "MemoryLeak",
    "tags": [
        "C++",
        "Coroutines",
        "Memory",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines introduce symmetric transfer via std::coroutine_handle<> returning await_suspend methods to avoid stack overflow during deeply nested coroutine execution. However, handling ownership of coroutine frames during symmetric transfer pipelines frequently results in severe memory leaks.</p><p>When transferring execution back and forth between producers and consumers without a designated frame cleanup mechanism, allocated coroutine frames remain suspended on the heap indefinitely when the execution terminates early or completes without explicit destroy() calls.</p>",
    "root_cause": "Returning a coroutine handle from await_suspend transfers control flow without transferring lifetime management responsibility. If the suspended state is not explicitly freed via std::coroutine_handle::destroy(), or if parent task destructors miss suspended child handles, heap allocations leak.",
    "bad_code": "#include <coroutine>\n\nstruct Task {\n    struct promise_type {\n        Task get_return_object() { \n            return Task{std::coroutine_handle<promise_type>::from_promise(*this)}; \n        }\n        std::suspend_always initial_suspend() { return {}; }\n        std::suspend_always final_suspend() noexcept { return {}; }\n        void return_void() {}\n        void unhandled_exception() {}\n    };\n    std::coroutine_handle<promise_type> handle;\n    // BUG: Missing destructor to invoke handle.destroy(), leaking frame on drop\n};\n\nstruct SymmetricAwaiter {\n    std::coroutine_handle<> next_coro;\n    bool await_ready() const noexcept { return false; }\n    std::coroutine_handle<> await_suspend(std::coroutine_handle<>) noexcept {\n        return next_coro; // Transfers execution but calling frame remains suspended and un-managed\n    }\n    void await_resume() noexcept {}\n};",
    "solution_desc": "Implement strict RAII wrappers around coroutine handles to guarantee cleanup. Use a custom final_awaiter in symmetric transfer pipelines that routes continuation handles cleanly to std::noop_coroutine() upon completion while explicitly freeing completed frame handles.",
    "good_code": "#include <coroutine>\n#include <utility>\n\ntemplate <typename T>\nstruct Generator {\n    struct promise_type {\n        T current_value;\n        std::coroutine_handle<> continuation;\n\n        Generator get_return_object() {\n            return Generator{std::coroutine_handle<promise_type>::from_promise(*this)};\n        }\n        std::suspend_always initial_suspend() { return {}; }\n        auto final_suspend() noexcept {\n            struct FinalAwaiter {\n                bool await_ready() noexcept { return false; }\n                std::coroutine_handle<> await_suspend(std::coroutine_handle<promise_type> h) noexcept {\n                    if (h.promise().continuation) {\n                        return h.promise().continuation;\n                    }\n                    return std::noop_coroutine();\n                }\n                void await_resume() noexcept {}\n            };\n            return FinalAwaiter{};\n        }\n        void yield_value(T val) { current_value = val; }\n        void return_void() {}\n        void unhandled_exception() { std::terminate(); }\n    };\n\n    std::coroutine_handle<promise_type> handle;\n    explicit Generator(std::coroutine_handle<promise_type> h) : handle(h) {}\n    ~Generator() { if (handle) handle.destroy(); }\n    Generator(const Generator&) = delete;\n    Generator& operator=(const Generator&) = delete;\n    Generator(Generator&& o) noexcept : handle(std::exchange(o.handle, nullptr)) {}\n};",
    "verification": "Compile with GCC or Clang using '-fsanitize=address,leak' and run task execution loops. Confirm 0 memory leaks reported by AddressSanitizer upon completion.",
    "date": "2026-07-31",
    "id": 1785496889,
    "type": "error"
});