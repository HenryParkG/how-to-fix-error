window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Symmetric Transfer Leaks",
    "slug": "fixing-cpp20-coroutine-symmetric-transfer-leaks",
    "language": "C++20",
    "code": "Memory Leak",
    "tags": [
        "C++",
        "Systems",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines introduce symmetric transfer via std::coroutine_handle to allow direct, stack-less suspension and resumption of sibling coroutines. While this eliminates recursion stack-overflow risks, it introduces critical ownership tracking issues. If a custom awaiter transfers control to another coroutine without cleanly deallocating the caller's frame or tracking lifetime completion, the allocated coroutine frames remain suspended on the heap forever, leading to quiet but severe memory leaks.</p>",
    "root_cause": "In symmetric transfers, returning a coroutine_handle from await_suspend passes execution control directly to the targeted coroutine. If the parent frame completes its logic but has no structured mechanism to self-destroy or signal its caller to invoke .destroy() on its handle, the coroutine frame allocated via operator new is permanently orphaned.",
    "bad_code": "struct TaskAwaiter {\n    std::coroutine_handle<> next_coro;\n    bool await_ready() noexcept { return false; }\n    std::coroutine_handle<> await_suspend(std::coroutine_handle<> current) noexcept {\n        // BAD: Yielding control without ensuring 'current' is destroyed\n        // upon execution completion of 'next_coro'.\n        return next_coro;\n    }\n    void await_resume() noexcept {}\n};",
    "solution_desc": "Implement a structured custom promise type and a dedicated final_awaiter. The final_awaiter should cleanly transfer control back to the calling/parent coroutine via symmetric transfer, while ensuring the child coroutine is marked for deletion or destroyed automatically by its custom promise wrapper when it reaches its final suspension point.",
    "good_code": "#include <coroutine>\n\nstruct FinalAwaiter {\n    bool await_ready() noexcept { return false; }\n    std::coroutine_handle<> await_suspend(std::coroutine_handle<> current) noexcept {\n        // Retrieve parent coroutine handle saved in the promise\n        auto parent = current.promise().parent_handle;\n        if (parent) {\n            current.destroy(); // Safely destroy current completed frame\n            return parent;     // Symmetric transfer back to parent\n        }\n        return std::noop_coroutine();\n    }\n    void await_resume() noexcept {}\n};",
    "verification": "Compile your program with Clang or GCC using the flags `-fsanitize=address -fsanitize=leak`. Execute a pipeline performing millions of coroutine swaps; the process memory footprint must remain flat, and the AddressSanitizer should report zero leaks upon exit.",
    "date": "2026-05-22",
    "id": 1779432060,
    "type": "error"
});