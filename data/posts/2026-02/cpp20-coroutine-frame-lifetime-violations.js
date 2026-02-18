window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Frame Lifetime Violations",
    "slug": "cpp20-coroutine-frame-lifetime-violations",
    "language": "C++",
    "code": "LifetimeViolation",
    "tags": [
        "Rust",
        "Networking",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In high-concurrency networking, C++20 coroutines are often used to manage asynchronous I/O via <code>co_await</code>. A critical issue arises when references or pointers to local variables are passed into an asynchronous operation. If the coroutine suspends and the underlying operation outlives the coroutine frame (e.g., due to a cancellation or premature destruction), the resumed coroutine or the completion handler will access a dangling pointer. This is particularly frequent in network buffers where the lifetime of the <code>std::string</code> or <code>vector</code> used for receiving data is tied to a scope that closes before the I/O finishes.</p>",
    "root_cause": "The coroutine frame or local scope variables are destroyed while an asynchronous operation still holds a reference to them, typically due to improper use of references in 'fire-and-forget' tasks or incorrect shared_ptr ownership.",
    "bad_code": "task<void> start_read(tcp::socket& socket) {\n    char buffer[1024]; // Local stack-like buffer in coroutine frame\n    auto bytes = co_await socket.async_read_some(asio::buffer(buffer));\n    process(buffer, bytes);\n}",
    "solution_desc": "Ensure that the buffer's lifetime is managed by a shared state or move the buffer into the coroutine frame's heap-allocated portion using a member variable in a class-based coroutine or by passing a shared_ptr to the async operation.",
    "good_code": "task<void> start_read(tcp::socket& socket) {\n    auto buffer = std::make_shared<std::vector<char>>(1024);\n    // Capture shared_ptr to extend lifetime until completion\n    auto bytes = co_await socket.async_read_some(asio::buffer(*buffer));\n    process(buffer->data(), bytes);\n}",
    "verification": "Use AddressSanitizer (ASan) with 'detect_stack_use_after_return=1' and run stress tests under high network load to catch invalid memory access.",
    "date": "2026-02-18",
    "id": 1771397579,
    "type": "error"
});