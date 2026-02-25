window.onPostDataLoaded({
    "title": "Mitigating C++20 Coroutine Lifetime Violations",
    "slug": "cpp20-coroutine-lifetime-violations",
    "language": "C++ / Rust",
    "code": "LifetimeViolation",
    "tags": [
        "Rust",
        "Backend",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>In asynchronous IO task-graphs, C++20 coroutines introduce significant risks regarding object lifetimes. Unlike synchronous code, a coroutine's execution is suspended and resumed, often outliving the scope in which it was initially created. The primary danger arises when a coroutine captures references to local variables from its caller. Since the caller's stack frame is destroyed upon suspension (if the caller is not also awaited), the coroutine is left with dangling references when it eventually resumes.</p>",
    "root_cause": "Capturing local variables by reference in a coroutine that outlives the caller's stack frame, leading to use-after-free errors during resumption.",
    "bad_code": "task<void> fetch_data(const std::string& query) {\n    auto result = co_await db.async_query(query); // query is a reference\n    process(result);\n}\n\nvoid trigger() {\n    std::string q = \"SELECT * FROM users\";\n    fetch_data(q); // q goes out of scope while fetch_data is suspended\n}",
    "solution_desc": "Ensure all data required by the coroutine is captured by value or stored in a shared state (like std::shared_ptr) within the coroutine's promise object. For task-graphs, use a 'structured concurrency' approach where the parent scope is guaranteed to outlive children.",
    "good_code": "task<void> fetch_data(std::string query) {\n    // query is now moved into the coroutine frame\n    auto result = co_await db.async_query(query);\n    process(result);\n}\n\n// Or use shared pointers for complex objects\ntask<void> process_ctx(std::shared_ptr<Context> ctx) {\n    co_await ctx->io_op();\n}",
    "verification": "Use AddressSanitizer (ASan) to detect use-after-free at runtime and implement static analysis checks to forbid reference-captures in coroutine signatures.",
    "date": "2026-02-25",
    "id": 1772012872,
    "type": "error"
});