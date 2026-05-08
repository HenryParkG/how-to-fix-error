window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine HALO Lifetime Violations",
    "slug": "cpp20-coroutine-halo-lifetime-fix",
    "language": "C++",
    "code": "LifetimeViolation",
    "tags": [
        "Rust",
        "Backend",
        "CPP",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines employ Heap Allocation Elision (HALO) to optimize performance by placing the coroutine frame on the stack. However, when HALO fails\u2014often due to the coroutine outliving the caller's scope or complex control flows\u2014the compiler reverts to heap allocation. If the coroutine captures references to local variables from the calling scope, and those variables are destroyed before the coroutine completes on the heap, a lifetime violation occurs, leading to unpredictable crashes or memory corruption.</p>",
    "root_cause": "The coroutine captures arguments by reference or pointer, but the coroutine's execution lifecycle extends beyond the destruction of the original caller's stack frame, causing dangling references.",
    "bad_code": "task<void> process_data(const std::string& input) {\n    // HALO might fail here if task is detached\n    co_await async_op();\n    std::cout << input << std::endl; // 'input' may be a dangling reference\n}\n\nvoid trigger() {\n    process_data(\"temp_string\"); // Temporary destroyed after trigger returns\n}",
    "solution_desc": "Ensure all arguments passed to coroutines are captured by value rather than reference if the coroutine's lifecycle is asynchronous or detached. Use std::move for efficiency and ensure the promise_type correctly manages the lifetime of captured data.",
    "good_code": "task<void> process_data(std::string input) {\n    // Captured by value, safe even if HALO fails and heap allocation is used\n    co_await async_op();\n    std::cout << input << std::endl; \n}\n\nvoid trigger() {\n    process_data(\"safe_string\"); // String is moved/copied into the coroutine frame\n}",
    "verification": "Compile with -fno-inline and use Valgrind or AddressSanitizer (ASan) to detect Use-After-Free errors in coroutine frames.",
    "date": "2026-05-08",
    "id": 1778224613,
    "type": "error"
});