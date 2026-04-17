window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Symmetric Transfer Deadlocks",
    "slug": "cpp20-coroutine-symmetric-transfer-deadlocks",
    "language": "C++",
    "code": "Deadlock",
    "tags": [
        "Rust",
        "Backend",
        "Concurrency",
        "Error Fix"
    ],
    "analysis": "<p>Symmetric transfer in C++20 allows a coroutine to suspend and immediately resume another coroutine without returning to the caller, preventing stack overflow during deep recursions. However, in single-threaded asynchronous runtimes, this can lead to a 'logical deadlock' if two coroutines await each other in a circular dependency.</p><p>Because the control flow never returns to the central event loop (executor), other tasks scheduled on the same thread are starved, and if the resolution of the dependency depends on another task in the queue, the system hangs indefinitely.</p>",
    "root_cause": "Circular awaiting of coroutine handles via symmetric transfer without returning control to the scheduler's event loop.",
    "bad_code": "struct Task {\n  auto operator await_ready() { return false; }\n  std::coroutine_handle<> await_suspend(std::coroutine_handle<> h) {\n    // Directly returning the next handle skips the executor\n    return other_coro_handle; \n  }\n  void await_resume() {}\n};",
    "solution_desc": "Architect the runtime to detect recursive transfers or force a yield to the executor using a 'yield_now' token that returns 'std::noop_coroutine_handle' to break the chain.",
    "good_code": "struct Task {\n  auto await_suspend(std::coroutine_handle<> h) {\n    if (should_yield_to_executor()) {\n      executor.schedule(other_coro_handle);\n      return std::noop_coroutine(); // Back to event loop\n    }\n    return other_coro_handle; // Safe symmetric transfer\n  }\n};",
    "verification": "Use an execution tracer to monitor the stack depth and verify that control periodically returns to the main loop.",
    "date": "2026-04-17",
    "id": 1776410436,
    "type": "error"
});