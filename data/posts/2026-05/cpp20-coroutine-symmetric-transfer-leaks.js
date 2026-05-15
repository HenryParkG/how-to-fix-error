window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Frame Leaks via Symmetric Transfer",
    "slug": "cpp20-coroutine-symmetric-transfer-leaks",
    "language": "C++",
    "code": "Memory Leak",
    "tags": [
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines allocate a coroutine frame on the heap. When using asymmetric transfer (where <code>await_suspend</code> returns <code>void</code> or <code>bool</code>), resuming another coroutine typically involves a recursive call. In high-frequency scenarios or deep recursion, this leads to 'stack-like' growth of coroutine frames that are never properly deallocated because the 'caller' remains active until the 'callee' finishes. This often manifests as a slow memory leak in asynchronous event loops or state machines.</p>",
    "root_cause": "Returning void in await_suspend forces the current frame to stay active while the resumed coroutine runs, preventing tail-call optimization and delaying frame destruction.",
    "bad_code": "void await_suspend(std::coroutine_handle<> h) {\n    // This triggers a recursive call stack\n    other_handle.resume(); \n}",
    "solution_desc": "Implement Symmetric Transfer by changing the return type of await_suspend to std::coroutine_handle<>. This allows the compiler to perform a tail-call to the next coroutine, popping the current frame's stack usage before entering the next.",
    "good_code": "std::coroutine_handle<> await_suspend(std::coroutine_handle<> h) {\n    // Tail-calls the next coroutine without growing the stack\n    return other_handle; \n}",
    "verification": "Monitor heap usage over 1 million iterations; symmetric transfer will maintain constant memory pressure, while asymmetric will grow linearly.",
    "date": "2026-05-15",
    "id": 1778826292,
    "type": "error"
});