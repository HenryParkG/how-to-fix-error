window.onPostDataLoaded({
    "title": "Fix C++20 Coroutine Lifetime Violations",
    "slug": "cpp20-coroutine-lifetime-violations",
    "language": "C++",
    "code": "LifetimeViolation",
    "tags": [
        "Rust",
        "Backend",
        "HighPerformance",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines are 'stackless', meaning that when a coroutine suspends via <code>co_await</code>, the execution returns to the caller. A frequent error in asynchronous network stacks occurs when the coroutine captures arguments by reference or pointer. If the caller's scope finishes before the coroutine resumes, those references point to deallocated memory, leading to non-deterministic crashes or heap corruption.</p>",
    "root_cause": "Capturing function arguments by reference (e.g., const std::string&) in a coroutine that yields, causing the reference to outlive the caller's stack frame.",
    "bad_code": "task<void> process_packet(const std::string& data) {\n    co_await socket.write(data);\n    // CRASH: 'data' is a reference to a temporary that may be gone\n    std::cout << \"Sent: \" << data << std::endl;\n}",
    "solution_desc": "Always pass arguments by value to coroutines intended for asynchronous execution. This ensures the coroutine state machine (the coroutine frame) owns a copy of the data, extending its lifetime until the coroutine completes.",
    "good_code": "task<void> process_packet(std::string data) {\n    co_await socket.write(data);\n    // SAFE: 'data' is stored in the coroutine frame\n    std::cout << \"Sent: \" << data << std::endl;\n}",
    "verification": "Compile with AddressSanitizer (ASan) and run a stress test that triggers high-frequency suspension; ASan will flag any use-after-free on the stack or heap.",
    "date": "2026-05-07",
    "id": 1778119263,
    "type": "error"
});