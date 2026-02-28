window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Lifetime Violations",
    "slug": "cpp20-coroutine-lifetime-violations",
    "language": "C++",
    "code": "LifetimeViolation",
    "tags": [
        "C++20",
        "Performance",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines are stackless, meaning their state is stored on the heap in a coroutine frame. A critical error occurs when a coroutine captures a reference to a local variable from its calling scope. Since the calling function returns immediately upon the first suspension point (co_await), the local variable is destroyed, leaving the coroutine with a dangling reference when it eventually resumes.</p>",
    "root_cause": "The coroutine captures arguments by reference or pointer that point to stack-allocated memory in the caller's scope, which is invalidated after the initial suspension.",
    "bad_code": "task<void> delayed_print(const std::string& message) {\n    co_await sleep_for(1s);\n    std::cout << message << std::endl; // 'message' is a dangling reference!\n}\n\n// Usage\ndelayed_print(\"Hello World\"); // Temporary string destroyed immediately",
    "solution_desc": "Always pass arguments to coroutines by value if they need to persist across suspension points, or ensure the promise object manages the lifetime of shared data. Passing by value ensures the data is moved or copied into the coroutine frame.",
    "good_code": "task<void> delayed_print(std::string message) {\n    co_await sleep_for(1s);\n    std::cout << message << std::endl; // 'message' is safely stored in the coroutine frame\n}",
    "verification": "Compile with AddressSanitizer (ASan) to detect use-after-free or use-after-scope errors during runtime execution.",
    "date": "2026-02-28",
    "id": 1772240869,
    "type": "error"
});