window.onPostDataLoaded({
    "title": "C++20 Coroutine Frame Lifetime Violations in Pipelines",
    "slug": "cpp20-coroutine-frame-lifetime-violations",
    "language": "C++",
    "code": "Use-After-Free / Segmentation Fault",
    "tags": [
        "C++",
        "Coroutines",
        "Rust",
        "Async",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines introduce symmetric transfer via <code>std::coroutine_handle&lt;&gt;::transfer</code> or returning a coroutine handle from <code>await_suspend</code>. This optimization eliminates stack frame buildup during tail-recursive coroutine resumptions. However, lifetime violations occur when the frame of the suspending coroutine is implicitly or explicitly destroyed before the control transfer completes.</p><p>When an awaiter's <code>await_suspend</code> method triggers destruction of the current coroutine (e.g., via a completed promise callback or immediate inline cleanup) while simultaneously returning a handle for symmetric transfer, the compiler-generated resume sequence attempts to access deallocated frame metadata. This leads to subtle Use-After-Free (UAF) bugs, heap corruption, or silent failure in high-throughput async processing pipelines.</p>",
    "root_cause": "The suspending coroutine frame is deallocated inside 'await_suspend' (or via an asynchronous completion handler executing on another thread) prior to returning the handle to the execution runtime, leaving a dangling frame pointer during the symmetric transfer resumption.",
    "bad_code": "#include <coroutine>\n#include <iostream>\n\nstruct PipelineTask {\n    struct promise_type {\n        PipelineTask get_return_object() { return PipelineTask{std::coroutine_handle<promise_type>::from_promise(*this)}; }\n        std::suspend_always initial_suspend() noexcept { return {}; }\n        std::suspend_always final_suspend() noexcept { return {}; }\n        void return_void() {}\n        void unhandled_exception() { std::terminate(); }\n    };\n\n    std::coroutine_handle<promise_type> handle;\n};\n\nstruct SymmetricAwaiter {\n    std::coroutine_handle<> next_coro;\n\n    bool await_ready() noexcept { return false; }\n    \n    // BUG: Destroying the current coroutine handle inside await_suspend\n    // while returning next_coro causes frame lifetime violation!\n    std::coroutine_handle<> await_suspend(std::coroutine_handle<> current) noexcept {\n        current.destroy(); // Frame deallocated here!\n        return next_coro;  // Tail transfer executes in context of destroyed frame\n    }\n    \n    void await_resume() noexcept {}\n};",
    "solution_desc": "To prevent lifetime violations in symmetric transfer pipelines, defer frame destruction until after control has transferred away, or utilize std::noop_coroutine() when the frame must be destroyed. Alternatively, manage coroutine reference counts within custom allocators or promise types to ensure frame memory remains valid through the transition execution step.",
    "good_code": "#include <coroutine>\n#include <utility>\n\nstruct SymmetricAwaiter {\n    std::coroutine_handle<> next_coro;\n\n    bool await_ready() noexcept { return false; }\n    \n    // FIXED: Safely transfer without destroying caller frame inside suspend,\n    // or return std::noop_coroutine() if explicit cleanup is handled elsewhere.\n    std::coroutine_handle<> await_suspend(std::coroutine_handle<> current) noexcept {\n        // Ownership of frame destruction is safely delegated to caller pipeline cleanup,\n        // preserving frame memory throughout the tail resumption sequence.\n        if (next_coro) {\n            return next_coro;\n        }\n        return std::noop_coroutine();\n    }\n    \n    void await_resume() noexcept {}\n};",
    "verification": "Compile with AddressSanitizer enabled (`-fsanitize=address -g`) and run under heavy asymmetric concurrency. Verify that memory accesses within `await_suspend` tail transitions show zero use-after-free reports.",
    "date": "2026-08-12",
    "id": 1786528436,
    "type": "error"
});