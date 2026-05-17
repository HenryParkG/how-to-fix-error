window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Lifetime Violations",
    "slug": "cpp20-coroutine-lifetime-violations",
    "language": "C++",
    "code": "EXC_BAD_ACCESS",
    "tags": [
        "Rust",
        "Backend",
        "C++",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines introduce a paradigm shift in asynchronous programming but lack the borrow-checking safety found in languages like Rust. In high-performance task runners, the most frequent failure point occurs when a coroutine captures references to variables that exist on the caller's stack frame.</p><p>When the coroutine reaches its first suspension point (co_await), control returns to the caller. If the caller's scope ends while the coroutine is still pending, any captured references become dangling pointers. This leads to non-deterministic crashes or silent data corruption when the coroutine eventually resumes.</p>",
    "root_cause": "Captured references to stack-allocated variables in the coroutine factory function outliving the caller's scope.",
    "bad_code": "task<void> process_data(const std::string& input) {\n    co_await async_io();\n    std::cout << input << std::endl; // CRASH: input is a dangling reference\n}\n\nvoid trigger() {\n    auto t = process_data(\"temp_string\");\n    // trigger returns, \"temp_string\" destroyed, t still exists\n}",
    "solution_desc": "Ensure all data passed to a coroutine is either passed by value (copying into the coroutine frame) or managed via smart pointers (shared_ptr) to guarantee the data outlives the coroutine execution.",
    "good_code": "task<void> process_data(std::string input) {\n    co_await async_io();\n    std::cout << input << std::endl; // SAFE: input is moved into the coroutine frame\n}\n\n// Or using shared_ptr for large objects\ntask<void> process_shared(std::shared_ptr<Data> data) {\n    co_await async_io();\n    data->process(); \n}",
    "verification": "Compile with AddressSanitizer (ASan) and use -fcoroutines-ts. Run stress tests to ensure no 'use-after-free' errors are reported.",
    "date": "2026-05-17",
    "id": 1778998421,
    "type": "error"
});