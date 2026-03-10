window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Lifetime Violations",
    "slug": "cpp20-coroutine-lifetime-violations",
    "language": "C++",
    "code": "Use-after-free",
    "tags": [
        "Rust",
        "Backend",
        "C++",
        "Error Fix"
    ],
    "analysis": "<p>In C++20, coroutines suspend execution and return control to the caller. A common mistake occurs when a coroutine accepts arguments by reference (e.g., const std::string&). If the caller's scope ends while the coroutine is suspended, the reference becomes a dangling pointer. Unlike traditional functions, the coroutine's state (the coroutine frame) persists on the heap, but the references it captured point to the now-destroyed stack frame of the caller.</p><p>This is particularly dangerous in asynchronous task graphs where a coroutine might be launched and then the initiating function exits immediately, leaving the coroutine to resume later and access garbage memory.</p>",
    "root_cause": "Capturing stack-allocated references or pointers in a coroutine that outlives the caller's scope.",
    "bad_code": "Task<void> process_data(const std::string& input) {\n    co_await async_io();\n    std::cout << input << std::endl; // CRASH: input is a dangling reference\n}\n\nvoid start() {\n    process_data(\"Temporary String\");\n}",
    "solution_desc": "Always pass arguments to asynchronous coroutines by value. The coroutine frame will copy these values into its heap-allocated storage, ensuring they remain valid for the entire lifecycle of the coroutine.",
    "good_code": "Task<void> process_data(std::string input) {\n    co_await async_io();\n    std::cout << input << std::endl; // SAFE: input is stored in the coroutine frame\n}\n\nvoid start() {\n    process_data(\"Temporary String\"); // Copied into coroutine frame\n}",
    "verification": "Compile with AddressSanitizer (-fsanitize=address) to detect heap-use-after-free during coroutine resumption.",
    "date": "2026-03-10",
    "id": 1773105048,
    "type": "error"
});