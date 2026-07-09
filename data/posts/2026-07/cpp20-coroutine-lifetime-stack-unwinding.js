window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Lifetime & Unwinding Bugs",
    "slug": "cpp20-coroutine-lifetime-stack-unwinding",
    "language": "C++",
    "code": "Lifetime-Error",
    "tags": [
        "C++",
        "Rust",
        "Debugging",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines introduce a paradigm shift in writing asynchronous code, but they also bring severe object lifetime hazards. Unlike traditional functions where the stack frame exists for the entire duration of the execution, a coroutine's stack frame is split. Local variables inside the coroutine are preserved on the heap-allocated coroutine frame, but arguments passed by reference are not automatically copied to this frame.</p><p>When a coroutine suspends via <code>co_await</code>, the caller continues execution. If the caller passed a temporary object or a local variable by reference, that object may go out of scope and be destroyed while the coroutine is suspended. Upon resumption, the coroutine attempts to access the dereferenced dangling reference, leading to silent memory corruption or segmentation faults. Furthermore, unhandled exceptions escaping from coroutines can bypass standard RAII stack unwinding, causing memory leaks.</p>",
    "root_cause": "The coroutine captures input arguments by reference (e.g., const std::string&), but suspending the coroutine allows the caller's stack frame to unwind, destroying the referenced object before the coroutine resumes.",
    "bad_code": "#include <iostream>\n#include <coroutine>\n#include <future>\n#include <string>\n\nstruct Task {\n    struct promise_type {\n        Task get_return_object() { return Task{std::coroutine_handle<promise_type>::from_promise(*this)}; }\n        std::suspend_always initial_suspend() { return {}; }\n        std::suspend_always final_suspend() noexcept { return {}; }\n        void unhandled_exception() {} \n        void return_void() {}\n    };\n    std::coroutine_handle<promise_type> handle;\n};\n\n// BUG: Passing by reference. The temporary string passed here will be destroyed\n// at the end of the full-expression in the caller, before resumption.\nTask process_data_async(const std::string& input) {\n    co_await std::suspend_always{};\n    std::cout << \"Processing: \" << input << std::endl; // Undefined Behavior: dangling reference\n    co_return;\n}",
    "solution_desc": "To resolve lifetime issues with asynchronous coroutines, arguments must be passed by value rather than by reference. Passing by value ensures that the parameters are safely copied or moved directly into the heap-allocated coroutine state frame, guaranteeing their existence across all suspend and resume points.",
    "good_code": "#include <iostream>\n#include <coroutine>\n#include <string>\n#include <utility>\n\nstruct Task {\n    struct promise_type {\n        Task get_return_object() { return Task{std::coroutine_handle<promise_type>::from_promise(*this)}; }\n        std::suspend_always initial_suspend() { return {}; }\n        std::suspend_always final_suspend() noexcept { return {}; }\n        void unhandled_exception() { std::terminate(); }\n        void return_void() {}\n    };\n    std::coroutine_handle<promise_type> handle;\n};\n\n// FIXED: Pass by value. The parameter 'input' is constructed inside the coroutine frame\nTask process_data_async(std::string input) {\n    co_await std::suspend_always{};\n    std::cout << \"Processing: \" << input << std::endl; // Safe: 'input' lives in the coroutine frame\n    co_return;\n}",
    "verification": "Compile with AddressSanitizer enabled (`g++ -O1 -g -fsanitize=address -std=c++20 main.cpp`). Run the executable. The compiler-inserted ASan checks will immediately detect use-after-free conditions in the bad code, while the corrected code will pass without violations.",
    "date": "2026-07-09",
    "id": 1783597684,
    "type": "error"
});