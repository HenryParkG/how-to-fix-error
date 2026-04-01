window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Lifetime Violations",
    "slug": "cpp20-coroutine-lifetime-violations",
    "language": "C++",
    "code": "AccessViolation",
    "tags": [
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines are stackless, meaning local variables are moved to a heap-allocated coroutine frame. A common pitfall occurs when passing arguments by reference. While a normal function keeps the reference valid for its duration, a coroutine suspends, potentially outliving the caller's scope where the referenced object resided. This leads to use-after-free errors when the coroutine resumes.</p>",
    "root_cause": "Capturing or passing objects by reference to a coroutine that suspends and resumes after the original object's lifetime has ended.",
    "bad_code": "task<void> process_data(const std::string& input) {\n    co_await async_io();\n    std::cout << input << std::endl; // 'input' is a dangling reference if caller scope ended\n}\n\nvoid trigger() {\n    auto t = process_data(\"temp\"); // Temporary string destroyed here\n    t.resume();\n}",
    "solution_desc": "Always pass arguments by value to coroutines intended for asynchronous execution to ensure they are copied into the coroutine frame, or use shared pointers for shared ownership.",
    "good_code": "task<void> process_data(std::string input) {\n    co_await async_io();\n    std::cout << input << std::endl; // 'input' is safely stored in the coroutine frame\n}\n\nvoid trigger() {\n    auto t = process_data(\"temp\");\n    // The string 'temp' is moved/copied into the frame\n}",
    "verification": "Use AddressSanitizer (ASan) to detect heap-use-after-free or verify with Valgrind during the suspension/resume cycle.",
    "date": "2026-04-01",
    "id": 1775027403,
    "type": "error"
});