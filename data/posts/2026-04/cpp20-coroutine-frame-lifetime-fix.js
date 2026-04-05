window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Frame Lifetime Mismanagement",
    "slug": "cpp20-coroutine-frame-lifetime-fix",
    "language": "C++",
    "code": "Use-After-Free",
    "tags": [
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In C++20, coroutines allocate a 'coroutine frame' on the heap to store state across suspension points. A common critical error occurs when the coroutine is passed arguments by reference or pointer that point to objects on the caller's stack. Because coroutines are asynchronous, the caller's stack frame may be destroyed while the coroutine is still suspended. Upon resumption, the coroutine attempts to access those references, leading to memory corruption or segmentation faults. Developers often mistake coroutine parameters for standard function parameters, forgetting that the lifetime must extend until the coroutine is destroyed.</p>",
    "root_cause": "Passing temporary or local stack-allocated variables by reference into a coroutine that outlives the caller's scope.",
    "bad_code": "Task<void> process_data(const std::string& input) {\n    co_await async_io();\n    std::cout << input << std::endl; // CRASH: input is a dangling reference\n}\n\nvoid start() {\n    std::string s = \"temp\";\n    process_data(s);\n} // s is destroyed here",
    "solution_desc": "Ensure all parameters are passed by value to the coroutine. C++ coroutine frames copy parameters into the frame during initialization. By passing by value, the string object is moved or copied into the heap-allocated frame, ensuring its lifetime is managed by the coroutine itself.",
    "good_code": "Task<void> process_data(std::string input) {\n    // input is now copied into the coroutine frame\n    co_await async_io();\n    std::cout << input << std::endl; // Safe: lifetime tied to frame\n}",
    "verification": "Compile with AddressSanitizer (-fsanitize=address) and execute. ASAN will catch use-after-free if the reference is accessed post-caller-destruction.",
    "date": "2026-04-05",
    "id": 1775352512,
    "type": "error"
});