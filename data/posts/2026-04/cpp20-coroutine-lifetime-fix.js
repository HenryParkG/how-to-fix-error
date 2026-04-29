window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Reference Lifetime Violations",
    "slug": "cpp20-coroutine-lifetime-fix",
    "language": "C++20",
    "code": "Lifetime Error",
    "tags": [
        "C++",
        "Memory Management",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In C++20 coroutines, a common pitfall occurs when passing arguments by reference. Unlike standard functions, a coroutine's execution is suspended, but its parameters are usually stored in the coroutine frame. If a coroutine captures a reference to a temporary or a local variable from the caller's scope, and that scope is destroyed during suspension, the coroutine will access a dangling reference upon resumption, leading to undefined behavior or segmentation faults.</p>",
    "root_cause": "Coroutine parameters passed by reference are not automatically copied into the coroutine heap-allocated state; only the reference itself is stored, which points to the caller's stack frame.",
    "bad_code": "task<void> process_data(const std::string& input) {\n    co_await async_op();\n    std::cout << input << std::endl; // CRASH: input might be dangling\n}\n\nvoid caller() {\n    process_data(\"temporary string\"); // The string is destroyed before co_await finishes\n}",
    "solution_desc": "Always pass arguments by value to coroutines that involve suspension points, or ensure the coroutine frame takes ownership of the data by moving it into the local scope before the first suspension.",
    "good_code": "task<void> process_data(std::string input) {\n    // input is now moved into the coroutine frame\n    co_await async_op();\n    std::cout << input << std::endl; // Safe: owned by the coroutine\n}\n\n// Alternative: Capture by value explicitly in a lambda\nauto safe_task = [data = std::move(input)]() -> task<void> {\n    co_await async_op();\n    consume(data);\n};",
    "verification": "Use AddressSanitizer (ASan) with -fsanitize=address. If a lifetime violation occurs during resumption, ASan will report a 'use-after-free' on the stack or heap.",
    "date": "2026-04-29",
    "id": 1777428228,
    "type": "error"
});