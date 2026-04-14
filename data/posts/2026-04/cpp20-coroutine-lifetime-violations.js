window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Lifetime Violations",
    "slug": "cpp20-coroutine-lifetime-violations",
    "language": "C++",
    "code": "UseAfterFree",
    "tags": [
        "Rust",
        "Backend",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines are stackless, meaning their state is heap-allocated in a coroutine frame. A common pitfall occurs in multi-threaded runtimes when a coroutine captures arguments by reference. If the coroutine suspends (via <code>co_await</code>) and the original caller's scope ends before the coroutine resumes on a different thread, the reference becomes dangling. This leads to non-deterministic crashes and memory corruption that are notoriously difficult to debug in production environments.</p>",
    "root_cause": "Capturing temporary objects or function parameters by reference/pointer in a coroutine that outlives the caller's stack frame.",
    "bad_code": "std::future<void> process_data(const std::string& input) {\n    // 'input' is a reference to a temporary or stack variable\n    co_await async_io(); \n    std::cout << input << std::endl; // CRASH: input is dangling\n}",
    "solution_desc": "Always pass arguments by value to coroutines intended for asynchronous execution, or capture necessary data in the coroutine's promise object. If using lambdas, ensure all captures are by value [=].",
    "good_code": "std::future<void> process_data(std::string input) {\n    // 'input' is moved into the coroutine frame\n    co_await async_io();\n    std::cout << input << std::endl; // SAFE: input is owned by the frame\n}",
    "verification": "Use AddressSanitizer (ASan) with stack-use-after-return detection enabled to catch dangling references during integration tests.",
    "date": "2026-04-14",
    "id": 1776151137,
    "type": "error"
});