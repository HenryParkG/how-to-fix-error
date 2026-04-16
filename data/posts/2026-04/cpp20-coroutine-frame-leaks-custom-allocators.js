window.onPostDataLoaded({
    "title": "Debugging C++20 Coroutine Frame Leaks with Custom Allocators",
    "slug": "cpp20-coroutine-frame-leaks-custom-allocators",
    "language": "C++",
    "code": "MemoryLeak",
    "tags": [
        "Rust",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines allocate a 'coroutine frame' on the heap to store local variables and execution state. When using custom allocators via <code>operator new</code> within the <code>promise_type</code>, developers often fail to provide a matching <code>operator delete</code>. This results in the frame persisting even after the coroutine reaches its final suspension point, causing silent memory growth in high-concurrency systems.</p>",
    "root_cause": "The C++ standard requires a matching global or class-member operator delete in the promise_type if a custom operator new is provided; otherwise, the runtime behavior for deallocation is undefined or defaults to a mismatching deallocator.",
    "bad_code": "struct promise_type {\n    void* operator new(std::size_t size) {\n        return my_custom_malloc(size);\n    }\n    // Missing operator delete!\n    auto get_return_object() { return MyTask{handle::from_promise(*this)}; }\n    std::suspend_always initial_suspend() { return {}; }\n    std::suspend_always final_suspend() noexcept { return {}; }\n    void return_void() {}\n};",
    "solution_desc": "Implement a matching 'operator delete' within the promise_type that utilizes the same custom memory pool or allocator. Ensure 'final_suspend' returns 'std::suspend_always' to allow the handle to be destroyed manually, or use 'std::suspend_never' if the coroutine is self-destructing.",
    "good_code": "struct promise_type {\n    void* operator new(std::size_t size) {\n        return my_pool.allocate(size);\n    }\n    void operator delete(void* ptr, std::size_t size) {\n        my_pool.deallocate(ptr, size);\n    }\n    auto get_return_object() { return MyTask{handle::from_promise(*this)}; }\n    std::suspend_always initial_suspend() { return {}; }\n    std::suspend_always final_suspend() noexcept { return {}; }\n    void return_void() {}\n};",
    "verification": "Use Valgrind or AddressSanitizer (ASan) with '-fsanitize=address'. Monitor the memory usage of the process under a loop of 1 million coroutine invocations to ensure a flat memory profile.",
    "date": "2026-04-16",
    "id": 1776304164,
    "type": "error"
});