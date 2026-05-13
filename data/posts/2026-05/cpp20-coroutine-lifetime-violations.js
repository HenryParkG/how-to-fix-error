window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Lifetime Violations",
    "slug": "cpp20-coroutine-lifetime-violations",
    "language": "C++",
    "code": "Lifetime Error",
    "tags": [
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines introduce a significant paradigm shift in asynchronous programming but come with hidden dangers regarding object lifetimes. Unlike standard functions, a coroutine's state is stored on the heap, yet it often captures references to objects on the stack. When a coroutine suspends, the calling function's stack frame may be destroyed, leaving the coroutine with dangling references to local variables.</p><p>This issue is particularly prevalent in asynchronous task chains where lambdas are used to initiate coroutines. If a lambda captures by reference and then suspends, the lambda object itself may go out of scope before the coroutine resumes, leading to undefined behavior or segmentation faults that are notoriously difficult to debug.</p>",
    "root_cause": "The coroutine frame captures arguments by reference or pointer, but the underlying storage is destroyed during a 'co_await' suspension point because the caller's scope ends.",
    "bad_code": "Task<void> process_data(const std::string& input) {\n    // Suspending here allows the caller to continue\n    co_await socket.async_write(input);\n    // CRASH: 'input' reference is now dangling if caller finished\n    std::cout << \"Sent: \" << input << std::endl;\n}\n\n// Usage\n{ \n    std::string data = \"payload\";\n    process_data(data); // Returns Task, but 'data' is destroyed at '}'\n}",
    "solution_desc": "Always capture by value in coroutines that might outlive their call site, or use 'std::shared_ptr' to manage shared ownership of the data throughout the coroutine's lifecycle. Ensure the 'promise_type' is configured to handle argument copies correctly.",
    "good_code": "Task<void> process_data(std::string input) { \n    // Input is now moved/copied into the coroutine frame\n    co_await socket.async_write(input);\n    // SAFE: 'input' lives in the heap-allocated coroutine frame\n    std::cout << \"Sent: \" << input << std::endl;\n}\n\n// Or using shared_ptr for large objects\nTask<void> process_large_data(std::shared_ptr<BigData> data) {\n    co_await socket.async_write(data->buffer);\n    std::cout << \"Processed: \" << data->id << std::endl;\n}",
    "verification": "Compile with AddressSanitizer (ASan) and run the task chain; ASan will flag any use-after-free if the lifetime is violated.",
    "date": "2026-05-13",
    "id": 1778653130,
    "type": "error"
});