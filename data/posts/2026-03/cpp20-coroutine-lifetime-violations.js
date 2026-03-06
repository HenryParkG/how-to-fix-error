window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Frame Lifetime Violations",
    "slug": "cpp20-coroutine-lifetime-violations",
    "language": "Go",
    "code": "LifetimeViolation",
    "tags": [
        "Go",
        "Networking",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In C++20 asynchronous networking, coroutine frames are allocated on the heap, but the variables they capture follow strict lifetime rules. A common violation occurs when a coroutine captures a local variable by reference from a scope that is destroyed while the coroutine is suspended. Unlike standard functions, the stack frame of the caller might disappear long before the coroutine resumes, leading to use-after-free errors that are notoriously difficult to debug in high-throughput IO-uring or ASIO based systems.</p>",
    "root_cause": "Capturing variables by reference in a lambda that returns a coroutine (Task/Awaitable) where the lambda's scope terminates before the coroutine completion.",
    "bad_code": "auto start_connection(std::string host) {\n    auto connection_task = [&]() -> Task<void> {\n        // Error: 'host' is captured by reference but its scope might end\n        co_await socket.connect(host);\n    };\n    return connection_task();\n}",
    "solution_desc": "Switch from capture-by-reference to capture-by-value or use std::shared_ptr to ensure the data remains alive within the coroutine frame until the final suspension point.",
    "good_code": "auto start_connection(std::string host) {\n    // Capture by value to move 'host' into the coroutine frame\n    auto connection_task = [host = std::move(host)]() -> Task<void> {\n        co_await socket.connect(host);\n    };\n    return connection_task();\n}",
    "verification": "Compile with AddressSanitizer (ASAN) and run a stress test; ASAN will trigger 'stack-use-after-scope' if the reference violation persists.",
    "date": "2026-03-06",
    "id": 1772779010,
    "type": "error"
});