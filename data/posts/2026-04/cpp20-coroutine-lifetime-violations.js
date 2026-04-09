window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Lifetime Violations",
    "slug": "cpp20-coroutine-lifetime-violations",
    "language": "Rust",
    "code": "Use-After-Free",
    "tags": [
        "Rust",
        "Backend",
        "Systems",
        "Error Fix"
    ],
    "analysis": "<p>In C++20, coroutines allocate a frame on the heap to store state. A common pitfall occurs when parameters are passed by reference or pointer. Since coroutines are suspended and resumed, the original caller's stack frame might be destroyed while the coroutine frame still holds references to that stack, leading to critical memory corruption.</p>",
    "root_cause": "The coroutine frame captures references to temporary objects or local variables from the calling scope that expire before the coroutine resumes.",
    "bad_code": "task<void> process_data(const std::string& input) {\n    // Suspending here allows the caller to continue\n    co_await async_io();\n    // CRASH: 'input' reference is now dangling if the caller destroyed the string\n    std::cout << input << std::endl;\n}",
    "solution_desc": "Ensure that all data required by the coroutine after its first suspension point is captured by value rather than by reference, moving the ownership into the coroutine frame itself.",
    "good_code": "task<void> process_data(std::string input) {\n    // 'input' is moved into the coroutine frame\n    co_await async_io();\n    // SAFE: the frame owns the string data\n    std::cout << input << std::endl;\n}",
    "verification": "Compile with AddressSanitizer (ASan) and execute heavy concurrent loads to detect dangling pointer access during suspension.",
    "date": "2026-04-09",
    "id": 1775729234,
    "type": "error"
});