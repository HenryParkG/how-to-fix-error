window.onPostDataLoaded({
    "title": "Debugging Memory Lifetime Violations in C++20 Coroutines",
    "slug": "cpp20-coroutine-memory-lifetime-violations",
    "language": "C++ / Rust",
    "code": "Use-After-Free",
    "tags": [
        "C++20",
        "Memory-Safety",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines are powerful but introduce subtle memory safety risks because the coroutine state (the 'frame') is allocated on the heap, yet it often captures references to objects on the caller's stack. When a coroutine is suspended, control returns to the caller. If the caller's scope ends before the coroutine resumes and completes, any references passed by 'const &' or pointer become dangling pointers. Unlike traditional functions, the lifetime of the coroutine frame is decoupled from the lifetime of the calling function's stack frame.</p>",
    "root_cause": "Capturing stack-allocated variables by reference in a coroutine that outlives the caller's scope, leading to use-after-free during resumption.",
    "bad_code": "task<void> process_data(const std::string& input) {\n    // Suspend point\n    co_await std::suspend_always{};\n    // CRASH: 'input' reference is likely dangling if the caller finished\n    std::cout << input << std::endl;\n}\n\nvoid trigger() {\n    auto t = process_data(\"temp_string\");\n    // t is returned, but the string is destroyed here\n}",
    "solution_desc": "Always pass arguments by value to coroutines to ensure they are moved or copied into the heap-allocated coroutine frame. If passing large objects, use std::shared_ptr or capture by value to extend the lifetime.",
    "good_code": "task<void> process_data(std::string input) {\n    // 'input' is now moved into the coroutine frame\n    co_await std::suspend_always{};\n    // SAFE: The frame owns this string\n    std::cout << input << std::endl;\n}\n\nvoid trigger() {\n    auto t = process_data(\"temp_string\");\n    // String lives inside the coroutine state even after trigger() returns\n}",
    "verification": "Compile with AddressSanitizer (ASan) and run the coroutine across suspension points to detect invalid memory access.",
    "date": "2026-05-11",
    "id": 1778500672,
    "type": "error"
});