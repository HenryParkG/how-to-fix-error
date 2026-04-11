window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Lifetime Violations",
    "slug": "cpp20-coroutine-lifetime-violations",
    "language": "C++",
    "code": "LifetimeError",
    "tags": [
        "C++",
        "Systems",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines are stackless, meaning they transform the function's local variables into a heap-allocated coroutine state. A common pitfall occurs when a coroutine captures parameters by reference or takes a pointer to an object on the caller's stack.</p><p>Because the coroutine suspends and returns execution to the caller, the caller's stack frame may be destroyed while the coroutine is still alive. When the coroutine resumes, any reference to those destroyed stack variables results in undefined behavior, typically a segmentation fault or memory corruption.</p>",
    "root_cause": "The coroutine state captures references to objects that reside on the caller's stack frame, which is unwound upon the first suspension point (co_await).",
    "bad_code": "task<void> process_data(const std::string& input) {\n    // 'input' is a reference to a temporary on the caller's stack\n    co_await some_async_io();\n    std::cout << input << std::endl; // BUG: input may be a dangling reference\n}",
    "solution_desc": "Always capture coroutine parameters by value if the coroutine is asynchronous and likely to outlive the caller's scope, or ensure the object's lifetime is managed by a shared_ptr passed into the coroutine.",
    "good_code": "task<void> process_data(std::string input) {\n    // 'input' is now moved into the heap-allocated coroutine state\n    co_await some_async_io();\n    std::cout << input << std::endl; // SAFE: input is owned by the coroutine\n}",
    "verification": "Use AddressSanitizer (ASan) with -fsanitize=address to detect use-after-free on the coroutine frame during runtime execution.",
    "date": "2026-04-11",
    "id": 1775882978,
    "type": "error"
});