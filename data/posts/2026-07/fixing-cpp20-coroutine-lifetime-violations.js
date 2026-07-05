window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Lifetime Violations",
    "slug": "fixing-cpp20-coroutine-lifetime-violations",
    "language": "C++",
    "code": "LifetimeViolation",
    "tags": [
        "C++",
        "Asynchronous",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>In C++20, coroutines introduce powerful asynchronous capabilities but lack structural lifetime safety. When a coroutine function is executed, it allocates a coroutine frame on the heap. By default, function parameters are captured inside this frame. However, if a parameter is passed by reference (e.g., <code>const std::string&amp;</code>), only the reference (the pointer address) is copied into the coroutine frame. If the calling scope exits while the coroutine is suspended, the referenced object is destroyed, leaving the resumed coroutine with a dangling reference.</p>",
    "root_cause": "Coroutine parameter capture copies reference types as references rather than copying the underlying values into the coroutine frame, leading to undefined behavior when the referenced caller-owned object is deallocated before coroutine resumption.",
    "bad_code": "#include <iostream>\n#include <coroutine>\n#include <string>\n\nstruct Task {\n    struct promise_type {\n        Task get_return_object() { return {}; }\n        std::suspend_never initial_suspend() { return {}; }\n        std::suspend_always final_suspend() noexcept { return {}; }\n        void unhandled_exception() {}\n        void return_void() {}\n    };\n};\n\n// BUG: Passing by const reference creates a dangling reference upon resumption\nTask async_print(const std::string& message) {\n    co_await std::suspend_always{};\n    std::cout << message << std::endl; \n}",
    "solution_desc": "To prevent dangling references, you must pass arguments to asynchronous coroutines by value. This forces the compiler to copy the underlying object into the coroutine frame, binding its lifecycle to the duration of the coroutine's execution. Alternatively, you can use explicit smart pointers like std::shared_ptr if copying is too expensive.",
    "good_code": "#include <iostream>\n#include <coroutine>\n#include <string>\n\nstruct Task {\n    struct promise_type {\n        Task get_return_object() { return {}; }\n        std::suspend_never initial_suspend() { return {}; }\n        std::suspend_always final_suspend() noexcept { return {}; }\n        void unhandled_exception() {}\n        void return_void() {}\n    };\n};\n\n// FIX: Pass by value so the string is safely copied and preserved in the coroutine frame\nTask async_print(std::string message) {\n    co_await std::suspend_always{};\n    std::cout << message << std::endl;\n}",
    "verification": "Compile the code using GCC or Clang with AddressSanitizer enabled (-fsanitize=address) to verify that no use-after-free errors occur during coroutine suspension and resumption.",
    "date": "2026-07-05",
    "id": 1783233059,
    "type": "error"
});