window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Lifetime Hazards in Custom Executors",
    "slug": "fixing-cpp20-coroutine-lifetime-hazards",
    "language": "C++",
    "code": "Dangling Reference / Use-After-Free",
    "tags": [
        "C++",
        "Async",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines introduce powerful stackless async capabilities, but they alter standard lifetime semantics. When parameters or temporaries are captured by reference inside a coroutine function, the coroutine frame allocates references on the heap that point to objects residing on the caller's stack frame. Once the caller function completes its execution beyond the first <code>co_await</code> suspension point, those stack references dangle, resulting in high-concurrency use-after-free bugs and memory corruption inside custom thread-pool task executors.</p>",
    "root_cause": "Coroutine parameters passed by reference are copied as references into the heap-allocated coroutine frame. If the caller context exits while the coroutine is suspended, the referenced object is destroyed, leaving dangling references inside the frame upon resumption.",
    "bad_code": "#include <coroutine>\n#include <iostream>\n#include <string>\n\nstruct Task {\n    struct promise_type {\n        Task get_return_object() { return Task{std::coroutine_handle<promise_type>::from_promise(*this)}; }\n        std::suspend_never initial_suspend() { return {}; }\n        std::suspend_always final_suspend() noexcept { return {}; }\n        void return_void() {}\n        void unhandled_exception() { std::terminate(); }\n    };\n    std::coroutine_handle<promise_type> handle;\n};\n\n// BUG: Capturing std::string by reference causes lifetime hazard across co_await\nTask process_data_async(const std::string& input, Executor& exec) {\n    co_await exec.schedule();\n    // 'input' points to a destroyed temporary if caller scope exited during co_await!\n    std::cout << \"Processing: \" << input << std::endl; \n}",
    "solution_desc": "Value semantics must be strictly enforced for coroutine arguments, or parameters must be wrapped inside `std::shared_ptr` / decayed value copies inside the `promise_type` frame wrapper. This guarantees that parameters remain valid for the total execution lifespan of the coroutine frame.",
    "good_code": "#include <coroutine>\n#include <iostream>\n#include <string>\n#include <memory>\n\nstruct SafeTask {\n    struct promise_type {\n        SafeTask get_return_object() { return SafeTask{std::coroutine_handle<promise_type>::from_promise(*this)}; }\n        std::suspend_never initial_suspend() { return {}; }\n        std::suspend_always final_suspend() noexcept { return {}; }\n        void return_void() {}\n        void unhandled_exception() { std::terminate(); }\n    };\n    std::coroutine_handle<promise_type> handle;\n};\n\n// FIX: Pass arguments by value so the coroutine frame takes full ownership\nSafeTask process_data_async_safe(std::string input, Executor exec) {\n    co_await exec.schedule();\n    // 'input' is safely stored by value inside the coroutine frame memory allocation\n    std::cout << \"Processing safely: \" << input << std::endl;\n}",
    "verification": "Compile the executable with AddressSanitizer (`-fsanitize=address -g`) and thread stress tests. Run asynchronous execution under high queue depth to confirm zero invalid memory read warnings during coroutine frame resumption.",
    "date": "2026-07-24",
    "id": 1784871683,
    "type": "error"
});