window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Lifetime Violations",
    "slug": "cpp20-coroutine-lifetime-violations",
    "language": "C++",
    "code": "LifetimeViolation",
    "tags": [
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines are stackless, meaning that when a coroutine suspends, its local state is preserved in a heap-allocated coroutine frame. However, a common pitfall occurs when passing arguments by reference. Unlike standard functions, if a coroutine captures a reference to a temporary object or a stack-allocated variable from the caller's scope, and then suspends, that reference becomes dangling if the caller continues execution and exits its scope.</p><p>This is particularly dangerous in asynchronous frameworks where the coroutine might resume on a different thread long after the initial calling function has returned, leading to non-deterministic segmentation faults or data corruption.</p>",
    "root_cause": "The coroutine captures arguments by reference (e.g., const T&) which reside on the caller's stack frame, but the coroutine outlives that frame after a suspension point.",
    "bad_code": "Task<void> processData(const std::string& input) {\n    // Suspends here; if caller exits, 'input' reference is now dangling\n    co_await socket.write(input);\n    co_return;\n}\n\n// Usage\nvoid fireAndForget() {\n    std::string data = \"payload\";\n    processData(data); // 'data' destroyed at end of this scope\n}",
    "solution_desc": "Ensure all arguments passed to asynchronous coroutines are passed by value or stored in a shared_ptr. Passing by value ensures the data is moved or copied into the coroutine's heap-allocated frame, making it independent of the caller's stack lifetime.",
    "good_code": "// Pass by value to move the string into the coroutine frame\nTask<void> processData(std::string input) {\n    co_await socket.write(input);\n    co_return;\n}\n\n// Or use shared_ptr for shared ownership\nTask<void> processDataShared(std::shared_ptr<std::string> input) {\n    co_await socket.write(*input);\n    co_return;\n}",
    "verification": "Compile with Clang's AddressSanitizer (ASan) and run the async execution path; ASan will trigger a 'use-after-free' error if the lifetime violation persists.",
    "date": "2026-03-29",
    "id": 1774760754,
    "type": "error"
});