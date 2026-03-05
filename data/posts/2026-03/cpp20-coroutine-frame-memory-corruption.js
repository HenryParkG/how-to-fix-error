window.onPostDataLoaded({
    "title": "Debugging C++20 Coroutine Frame Memory Corruption",
    "slug": "cpp20-coroutine-frame-memory-corruption",
    "language": "C++",
    "code": "Heap-Use-After-Free",
    "tags": [
        "Rust",
        "Memory Management",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines are stackless, meaning their state is stored in a dynamically allocated coroutine frame. A common and elusive bug occurs when the lifetime of the coroutine object (the handle) and the coroutine frame become decoupled. If a coroutine is destroyed while an asynchronous operation is still pending, the completion handler may attempt to resume a deallocated frame, leading to heap corruption or segmentation faults.</p><p>This is particularly dangerous in multi-threaded environments where a promise_type might be cleaned up on one thread while a driver or executor is attempting to access the frame on another.</p>",
    "root_cause": "The coroutine handle is destroyed before the final suspension point is reached, or a local reference captured by value in the coroutine refers to a temporary that was destroyed during the initial suspension.",
    "bad_code": "Task<int> compute_async(const std::string& input) {\n    // Problem: 'input' is a reference. If the caller passes a temporary,\n    // and the coroutine suspends, the temporary is destroyed.\n    co_await some_io();\n    co_return input.size();\n}",
    "solution_desc": "Ensure that all parameters passed to coroutines are passed by value if their lifetime isn't guaranteed. Additionally, implement a robust RAII wrapper for the coroutine handle that prevents premature destruction of the promise object until the coroutine is fully complete (final_suspend).",
    "good_code": "Task<int> compute_async(std::string input) {\n    // Solution: Pass by value to move the string into the coroutine frame\n    co_await some_io();\n    co_return input.size();\n}\n\n// Ensure promise_type uses std::suspend_always for final_suspend\nstruct promise_type {\n    auto final_suspend() noexcept { return std::suspend_always{}; }\n};",
    "verification": "Compile with AddressSanitizer (-fsanitize=address) and run the coroutine through multiple suspension cycles to ensure no 'use-after-free' errors are reported.",
    "date": "2026-03-05",
    "id": 1772673347,
    "type": "error"
});