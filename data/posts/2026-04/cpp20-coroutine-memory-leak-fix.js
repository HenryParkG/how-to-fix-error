window.onPostDataLoaded({
    "title": "Eliminating C++20 Coroutine Memory Leaks",
    "slug": "cpp20-coroutine-memory-leak-fix",
    "language": "C++",
    "code": "Memory Leak",
    "tags": [
        "Rust",
        "Networking",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>In high-frequency networking stacks, C++20 coroutines offer significant performance gains by reducing context switching. However, manual lifecycle management of the <code>std::coroutine_handle</code> often leads to memory leaks. The problem usually arises when a coroutine promise is allocated on the heap but the <code>destroy()</code> method is never called, particularly when an asynchronous operation is cancelled or an exception is thrown mid-suspension.</p><p>Unlike high-level languages, C++ coroutines require the developer to define when the coroutine frame is deallocated. In a networking loop, if the socket closes before the coroutine resumes, the handle remains 'in flight' forever, consuming memory for the promise object and the local variables captured in the frame.</p>",
    "root_cause": "Failure to call coroutine_handle::destroy() on orphaned coroutine frames during socket disconnection or timeout events.",
    "bad_code": "struct Task {\n  std::coroutine_handle<promise_type> handle;\n  ~Task() { /* Missing handle.destroy() */ }\n};\n\n// In network loop\nauto my_coro = socket_read(); \nif (error) return; // Coroutine frame leaked here!",
    "solution_desc": "Implement a strict RAII (Resource Acquisition Is Initialization) wrapper for the coroutine handle. Ensure that the task destructor explicitly checks for handle validity and invokes destroy(). Additionally, use symmetric transfer to avoid deep recursion and ensure proper cleanup during final suspension.",
    "good_code": "struct Task {\n  std::coroutine_handle<promise_type> handle;\n  Task(std::coroutine_handle<promise_type> h) : handle(h) {}\n  ~Task() {\n    if (handle) handle.destroy();\n  }\n  Task(Task&& other) : handle(other.handle) { other.handle = nullptr; }\n  // Prevents leaks on scope exit\n};",
    "verification": "Run the networking service under Valgrind or use AddressSanitizer (ASan) with 'detect_leaks=1'. Monitor memory usage stability over 1 million rapid connection/disconnection cycles.",
    "date": "2026-04-30",
    "id": 1777536317,
    "type": "error"
});