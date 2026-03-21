window.onPostDataLoaded({
    "title": "Fix C++20 Coroutine Use-After-Return Errors",
    "slug": "cpp20-coroutine-uar-fix",
    "language": "C++",
    "code": "UAR_COROUTINE",
    "tags": [
        "Rust",
        "Backend",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>In C++20, coroutines are stackless, meaning they store their state in a heap-allocated coroutine frame. A critical error occurs when a coroutine captures a local variable from its caller's scope by reference. When the coroutine suspends and the caller continues execution, that local variable is destroyed. Upon resumption, the coroutine attempts to access the now-invalid memory, resulting in a Use-After-Return (UAR) or Use-After-Free bug.</p>",
    "root_cause": "Capturing variables by reference in the coroutine's parameter list or scope when the coroutine's lifetime extends beyond the caller's stack frame.",
    "bad_code": "Task<void> processData(const std::string& input) {\n    // Suspending here allows the caller to destroy 'input'\n    co_await timer.sleep(100ms);\n    std::cout << input << std::endl; // CRASH: input is a dangling reference\n}\n\nvoid run() {\n    processData(\"Temporary String\"); // Temp string destroyed after this call\n}",
    "solution_desc": "Ensure that all data needed by a coroutine after a suspension point is captured by value in the coroutine's parameters. This ensures the data is moved or copied into the coroutine frame, which persists until the coroutine is destroyed.",
    "good_code": "Task<void> processData(std::string input) { \n    // input is now stored in the coroutine frame\n    co_await timer.sleep(100ms);\n    std::cout << input << std::endl; // SAFE: input is owned by the coroutine\n}\n\n// Usage remains the same, but the coroutine now owns its data\nvoid run() {\n    auto task = processData(\"Persistent String\");\n    execute(std::move(task));\n}",
    "verification": "Compile with AddressSanitizer (ASAN) using the flag `-fsanitize=address` and run the executable with `ASAN_OPTIONS=detect_stack_use_after_return=1`.",
    "date": "2026-03-21",
    "id": 1774066978,
    "type": "error"
});