window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Lifetime Violations",
    "slug": "fixing-cpp20-coroutine-lifetime-violations",
    "language": "C++ / Rust",
    "code": "LifetimeError",
    "tags": [
        "Rust",
        "Go",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In C++20, coroutines offer a powerful way to write asynchronous code, but they introduce complex lifetime management issues. When a coroutine is suspended, its local variables and parameters must remain valid until the coroutine resumes and eventually completes. In multi-threaded schedulers, the coroutine might be resumed on a different thread long after the caller has gone out of scope.</p><p>This often results in 'Use-After-Free' vulnerabilities where the coroutine state refers to stack-allocated variables from the caller's frame that no longer exist.</p>",
    "root_cause": "Coroutines capture parameters by value in the coroutine state, but if those parameters are references or pointers to objects on the caller's stack, the coroutine state holds a dangling reference once the caller returns.",
    "bad_code": "task<void> process_data(const std::string& input) {\n    // Suspend point\n    co_await scheduler.switch_to_thread();\n    // CRASH: 'input' is a reference to a temporary or stack variable\n    // that might be destroyed by now.\n    std::cout << input << std::endl;\n}",
    "solution_desc": "Ensure that all parameters passed to a coroutine are captured by value rather than reference, or use shared pointers to extend the lifetime of the data. Alternatively, utilize a wrapper that copies the input into the coroutine frame.",
    "good_code": "task<void> process_data(std::string input) {\n    // By taking 'input' by value, C++ moves/copies it into\n    // the coroutine's heap-allocated state frame.\n    co_await scheduler.switch_to_thread();\n    std::cout << input << std::endl; \n    // Safe: 'input' lives as long as the coroutine state.\n}",
    "verification": "Compile with AddressSanitizer (ASan) and run stress tests under a multi-threaded scheduler to ensure no memory access violations are reported during suspension transitions.",
    "date": "2026-04-12",
    "id": 1775986723,
    "type": "error"
});