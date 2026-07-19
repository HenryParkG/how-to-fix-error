window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Lifetime Violations",
    "slug": "fixing-cpp20-coroutine-lifetime-violations",
    "language": "C++",
    "code": "Lifetime Violation",
    "tags": [
        "C++",
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines introduce unique lifetime paradigms. Unlike traditional functions that execute synchronously on the call stack, a coroutine can suspend its execution and return control to the caller. When this happens, its local variables and arguments are saved on a heap-allocated (or compiler-optimized) coroutine frame. However, if a coroutine captures parameters by reference or takes temporaries as arguments, those referenced objects may go out of scope and be destroyed while the coroutine is suspended. Resuming the coroutine subsequently accesses dangling references, causing memory corruption and stack-use-after-free bugs.</p>",
    "root_cause": "The parameters or references passed to the coroutine are allocated on the caller's stack frame or are temporary values. When the calling scope exits or the temporary is cleaned up while the coroutine is suspended, the reference stored in the coroutine's suspended frame points to invalid memory.",
    "bad_code": "#include <iostream>\n#include <coroutine>\n#include <string>\n\nstruct Task {\n    struct promise_type {\n        Task get_return_object() { return Task{std::coroutine_handle<promise_type>::from_promise(*this)}; }\n        std::suspend_always initial_suspend() { return {}; }\n        std::suspend_always final_suspend() noexcept { return {}; }\n        void unhandled_exception() {}\n        void return_void() {}\n    };\n    std::coroutine_handle<promise_type> handle;\n    ~Task() { if (handle) handle.destroy(); }\n};\n\n// BUG: Passing by const reference can lead to dangling references when suspended\nTask run_coroutine(const std::string& message) {\n    co_await std::suspend_always{};\n    std::cout << message << std::endl; \n}\n\nint main() {\n    auto task = run_coroutine(std::string(\"Hello, World!\")); // Temporary string destroyed here\n    task.handle.resume(); // Undefined Behavior: Accesses destroyed stack object\n}",
    "solution_desc": "To guarantee that parameters remain valid throughout the lifetime of a suspended coroutine, pass parameters strictly by value. When passed by value, the arguments are safely copied or moved directly into the coroutine frame allocation, ensuring their survival until the coroutine is fully destroyed.",
    "good_code": "#include <iostream>\n#include <coroutine>\n#include <string>\n\nstruct Task {\n    struct promise_type {\n        Task get_return_object() { return Task{std::coroutine_handle<promise_type>::from_promise(*this)}; }\n        std::suspend_always initial_suspend() { return {}; }\n        std::suspend_always final_suspend() noexcept { return {}; }\n        void unhandled_exception() {}\n        void return_void() {}\n    };\n    std::coroutine_handle<promise_type> handle;\n    ~Task() { if (handle) handle.destroy(); }\n};\n\n// FIX: Pass by value. The parameter is moved/copied directly into the coroutine's heap-allocated frame.\nTask run_coroutine(std::string message) {\n    co_await std::suspend_always{};\n    std::cout << message << std::endl; // Perfectly safe\n}\n\nint main() {\n    auto task = run_coroutine(\"Hello, World!\"); \n    task.handle.resume(); // Safe execution guaranteed\n}",
    "verification": "Compile with GCC/Clang using AddressSanitizer (`-fsanitize=address -std=c++20`). Running the unpatched binary will trigger a heap-use-after-free or stack-use-after-scope error. The fixed code runs to completion cleanly without runtime faults.",
    "date": "2026-07-19",
    "id": 1784425644,
    "type": "error"
});