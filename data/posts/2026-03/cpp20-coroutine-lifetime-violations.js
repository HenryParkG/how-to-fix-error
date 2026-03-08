window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Suspended State Lifetime Violations",
    "slug": "cpp20-coroutine-lifetime-violations",
    "language": "C++",
    "code": "Use-After-Free",
    "tags": [
        "Rust",
        "Backend",
        "C++",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines are stackless, allocating their state (the coroutine frame) on the heap. A critical error occurs when a coroutine captures references to local variables or parameters by reference. When the coroutine suspends at an <code>co_await</code> point, the calling function's stack frame may be destroyed, leaving the coroutine with dangling references. This is particularly dangerous in asynchronous workflows where the coroutine outlives its initiator.</p>",
    "root_cause": "Capturing objects by reference in a coroutine that suspends, leading to dangling references once the caller's stack is cleared.",
    "bad_code": "std::future<void> bad_coroutine(const std::string& input) {\n    // Suspending here allows 'input' to go out of scope\n    co_await some_async_op(); \n    std::cout << input << std::endl; // CRASH: input is a dangling reference\n}",
    "solution_desc": "Always capture parameters by value in coroutines or use shared ownership (std::shared_ptr) to ensure the data remains valid throughout the entire lifecycle of the coroutine execution.",
    "good_code": "std::future<void> good_coroutine(std::string input) {\n    // 'input' is moved into the coroutine frame\n    co_await some_async_op();\n    std::cout << input << std::endl; // SAFE: input is local to the frame\n}",
    "verification": "Compile with AddressSanitizer (ASan) and use -fcoroutines-ts to detect heap-use-after-free during runtime execution.",
    "date": "2026-03-08",
    "id": 1772951542,
    "type": "error"
});