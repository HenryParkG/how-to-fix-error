window.onPostDataLoaded({
    "title": "Debugging C++20 Coroutine Lifetime Issues",
    "slug": "debugging-cpp20-coroutine-lifetime-suspension",
    "language": "C++20",
    "code": "UAF / Lifetime",
    "tags": [
        "C++",
        "Coroutines",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines are stackless, meaning they suspend execution by returning control to the caller while saving their state (variables and parameters) in a heap-allocated coroutine frame. However, passing parameters by reference (e.g., <code>const T&</code>) or by pointer to a coroutine is highly dangerous. If the coroutine suspends using <code>co_await</code>, the caller's stack frames might be popped before the coroutine resumes. When the coroutine finally resumes and accesses the reference, the referenced object no longer exists, causing undefined behavior or a Use-After-Free (UAF) crash.</p>",
    "root_cause": "Coroutine parameters passed by reference are copied as references (pointers) into the heap-allocated coroutine frame. If the underlying argument's lifetime ends during a suspension point, the coroutine frame retains a dangling reference.",
    "bad_code": "#include <iostream>\n#include <coroutine>\n#include <string>\n\nstruct Task {\n    struct promise_type {\n        Task get_return_object() { return Task{std::coroutine_handle<promise_type>::from_promise(*this)}; }\n        std::suspend_always initial_suspend() { return {}; }\n        std::suspend_always final_suspend() noexcept { return {}; }\n        void unhandled_exception() {}\n        void return_void() {}\n    };\n    std::coroutine_handle<promise_type> handle;\n};\n\n// BUG: Passing std::string by reference. The reference is copied, not the value.\nTask print_delayed(const std::string& message) {\n    co_await std::suspend_always{}; // Suspends here\n    std::cout << message << std::endl; // UNDEFINED BEHAVIOR: message is dangling!\n}\n\nint main() {\n    Task t;\n    {\n        std::string local_str = \"Temporary Data\";\n        t = print_delayed(local_str);\n    } // local_str goes out of scope and is destroyed here\n    t.handle.resume(); // Resumes and accesses destroyed local_str\n    t.handle.destroy();\n}",
    "solution_desc": "To guarantee safety across suspension points, pass parameters by value to the coroutine. The compiler will then copy or move the arguments directly into the coroutine's heap-allocated frame, ensuring their lifetimes are tied directly to the coroutine frame itself.",
    "good_code": "#include <iostream>\n#include <coroutine>\n#include <string>\n\nstruct Task {\n    struct promise_type {\n        Task get_return_object() { return Task{std::coroutine_handle<promise_type>::from_promise(*this)}; }\n        std::suspend_always initial_suspend() { return {}; }\n        std::suspend_always final_suspend() noexcept { return {}; }\n        void unhandled_exception() {}\n        void return_void() {}\n    };\n    std::coroutine_handle<promise_type> handle;\n};\n\n// FIX: Pass by value. The string is safely copied/moved into the coroutine frame.\nTask print_delayed(std::string message) {\n    co_await std::suspend_always{};\n    std::cout << message << std::endl; // Safe: message is owned by the coroutine frame\n}\n\nint main() {\n    Task t;\n    {\n        std::string local_str = \"Temporary Data\";\n        t = print_delayed(local_str); // Copied safely\n    }\n    t.handle.resume(); // Safe execution\n    t.handle.destroy();\n}",
    "verification": "Compile the code using GCC or Clang with AddressSanitizer enabled: `g++ -std=c++20 -fsanitize=address main.cpp -o main`. Run the executable. The bad code will trigger an ASan heap-use-after-free error report, while the fixed code will execute cleanly without warnings.",
    "date": "2026-07-03",
    "id": 1783059829,
    "type": "error"
});