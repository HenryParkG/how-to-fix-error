window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Lifetime & Dangling Ref Errors",
    "slug": "fixing-cpp20-coroutine-lifetime-dangling-references",
    "language": "C++20",
    "code": "DanglingReferenceError",
    "tags": [
        "C++20",
        "Coroutines",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines introduce powerful asynchronous programming models but shift significant lifetime management responsibilities onto the developer. Unlike traditional functions, a coroutine execution can be suspended and resumed later. When a coroutine takes arguments by reference (e.g., <code>const T&amp;</code> or <code>T&amp;&amp;</code>), only the reference address is copied to the coroutine frame, not the underlying object.</p><p>If the caller passes a temporary object or a local variable that goes out of scope while the coroutine is suspended, the reference becomes dangling. Upon resumption, any access to that reference yields undefined behavior, often manifesting as silent heap corruption or random segmentation faults.</p>",
    "root_cause": "Coroutine parameters passed by reference are not copied into the coroutine frame by value. When the caller scope finishes or a temporary object is destroyed post-suspension, the coroutine frame retains a reference to a deallocated stack/heap memory location.",
    "bad_code": "#include <iostream>\n#include <coroutine>\n#include <string>\n\nstruct Task {\n    struct promise_type {\n        Task get_return_object() { return Task{std::coroutine_handle<promise_type>::from_promise(*this)}; }\n        std::initial_suspend initial_suspend() { return std::suspend_always{}; }\n        std::final_suspend final_suspend() noexcept { return std::suspend_always{}; }\n        void unhandled_exception() {}\n        void return_void() {}\n    };\n    std::coroutine_handle<promise_type> handle;\n};\n\n// BUG: Passing by const reference can cause dangling references if a temporary is passed\nTask async_print(const std::string& message) {\n    co_await std::suspend_always{}; \n    std::cout << message << std::endl; \n}\n\nint main() {\n    auto task = async_print(\"Hello, dangling reference!\"); // Temporary string object is destroyed here\n    task.handle.resume(); // CRASH or undefined behavior: message is dangling\n    task.handle.destroy();\n}",
    "solution_desc": "To fix this lifetime hazard, pass arguments to coroutines by value. Passing by value forces the compiler to copy or move the object directly into the allocated coroutine frame, ensuring its lifetime is tied directly to the lifetime of the coroutine state itself.",
    "good_code": "#include <iostream>\n#include <coroutine>\n#include <string>\n\nstruct Task {\n    struct promise_type {\n        Task get_return_object() { return Task{std::coroutine_handle<promise_type>::from_promise(*this)}; }\n        std::initial_suspend initial_suspend() { return std::suspend_always{}; }\n        std::final_suspend final_suspend() noexcept { return std::suspend_always{}; }\n        void unhandled_exception() {}\n        void return_void() {}\n    };\n    std::coroutine_handle<promise_type> handle;\n};\n\n// FIX: Pass by value to copy the argument directly into the coroutine frame\nTask async_print(std::string message) {\n    co_await std::suspend_always{};\n    std::cout << message << std::endl; // Safe: message is owned by the coroutine frame\n}\n\nint main() {\n    auto task = async_print(\"Hello, safe lifetime!\"); // Safe copy made\n    task.handle.resume(); // Prints successfully\n    task.handle.destroy();\n}",
    "verification": "Compile the code using Clang/GCC with AddressSanitizer enabled: `-fsanitize=address -std=c++20`. The buggy implementation will instantly trigger an 'use-after-poison' or stack-use-after-scope error upon resumption, whereas the fixed version executes cleanly without runtime violations.",
    "date": "2026-05-20",
    "id": 1779244123,
    "type": "error"
});