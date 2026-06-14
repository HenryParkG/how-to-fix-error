window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Frame Leakage in Engines",
    "slug": "cpp20-coroutine-frame-leakage-network",
    "language": "Rust",
    "code": "Memory Leak (Heap Growth)",
    "tags": [
        "Rust",
        "Backend",
        "C++",
        "Networking",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput asynchronous network engines built with C++20 coroutines, dynamic coroutine frames are allocated on the heap. If a socket disconnects, times out, or encounters an exceptional event while a coroutine is suspended, the network execution scheduler must clean up the context. If the final suspend point of a coroutine promise is configured incorrectly, or if the calling handle fails to invoke the coroutine handle's destroy method, the coroutine frame is leaked on the heap. Over millions of concurrent connections, this leads to continuous memory leakage and eventual engine exhaustion.</p>",
    "root_cause": "The coroutine promise's 'final_suspend' returned 'std::suspend_always' without a corresponding execution framework mechanism to call '.destroy()' on the suspended handle, preventing the compiler-generated coroutine frame from being deallocated.",
    "bad_code": "#include <coroutine>\n#include <iostream>\n\nstruct BadTask {\n    struct promise_type {\n        BadTask get_return_object() { return BadTask{std::coroutine_handle<promise_type>::from_promise(*this)}; }\n        std::suspend_always initial_suspend() { return {}; }\n        std::suspend_always final_suspend() noexcept { return {}; } // Leaks frame if handle is never destroyed manually!\n        void unhandled_exception() { std::terminate(); }\n        void return_void() {}\n    };\n    std::coroutine_handle<promise_type> handle;\n};",
    "solution_desc": "Implement a rigorous RAII (Resource Acquisition Is Initialization) wrapper around the 'std::coroutine_handle'. The wrapper's destructor must check if the handle is valid and call '.destroy()'. Additionally, configure 'final_suspend' to return 'std::suspend_always' only when the RAII owner is explicitly responsible for destroying the handle, or use 'std::suspend_never' if life-cycle management is delegated.",
    "good_code": "#include <coroutine>\n#include <utility>\n\nstruct Task {\n    struct promise_type {\n        Task get_return_object() { return Task{std::coroutine_handle<promise_type>::from_promise(*this)}; }\n        std::suspend_always initial_suspend() { return {}; }\n        std::suspend_always final_suspend() noexcept { return {}; }\n        void unhandled_exception() { std::terminate(); }\n        void return_void() {}\n    };\n\n    std::coroutine_handle<promise_type> handle = nullptr;\n\n    Task(std::coroutine_handle<promise_type> h) : handle(h) {}\n    ~Task() {\n        if (handle) {\n            handle.destroy(); // RAII safety: guarantees coroutine frame deallocation\n        }\n    }\n\n    // Prevent copying to avoid double destruction of the handle\n    Task(const Task&) = delete;\n    Task& operator=(const Task&) = delete;\n\n    // Allow movement\n    Task(Task&& other) noexcept : handle(std::exchange(other.handle, nullptr)) {}\n    Task& operator=(Task&& other) noexcept {\n        if (this != &other) {\n            if (handle) handle.destroy();\n            handle = std::exchange(other.handle, nullptr);\n        }\n        return *this;\n    }\n};",
    "verification": "Compile the network engine with address sanitizer enablement (-fsanitize=address,leak) and simulate abrupt socket disconnects. Verify that no memory leak warnings are outputted to stderr upon execution termination.",
    "date": "2026-06-14",
    "id": 1781404993,
    "type": "error"
});