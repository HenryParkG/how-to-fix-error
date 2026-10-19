window.onPostDataLoaded({
    "title": "Prevent C++20 Coroutine Frame Lifetime Invalidation",
    "slug": "prevent-cpp20-coroutine-frame-lifetime-invalidation",
    "language": "C++20",
    "code": "DanglingReference",
    "tags": [
        "C++20",
        "Coroutines",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines introduce stackless asynchronous primitives where the execution state is saved inside an allocated heap frame. However, parameter passing semantics in C++20 coroutines present a notorious memory safety hazard: coroutine parameters are copied or moved into the coroutine frame, but reference parameters (<code>const T&amp;</code>, <code>T&amp;&amp;</code>, and string views) copy only the reference, not the referenced object.</p><p>When a caller invokes a coroutine passing a temporary object or a local stack-allocated variable by reference, the temporary is destroyed at the end of the full expression in the caller. As soon as the coroutine suspends at its first <code>co_await</code> point, the captured reference becomes a dangling pointer. When resumed on a thread pool, dereferencing the captured parameter invokes undefined behavior, heap-use-after-free, or silent data corruption.</p>",
    "root_cause": "Coroutine parameters passed by reference or string_view bind to caller-side temporaries whose lifetimes expire at the caller's full-expression boundary before coroutine resumption.",
    "bad_code": "#include <coroutine>\n#include <string_view>\n#include <iostream>\n\nstruct AsyncTask {\n    struct promise_type {\n        AsyncTask get_return_object() { return {}; }\n        std::suspend_never initial_suspend() { return {}; }\n        std::suspend_always final_suspend() noexcept { return {}; }\n        void return_void() {}\n        void unhandled_exception() {}\n    };\n};\n\n// BUG: std::string_view holds pointer to temporary std::string\nAsyncTask process_data_async(const std::string_view payload) {\n    co_await std::suspend_always{};\n    // UB: payload points to freed memory if caller passed temporary std::string\n    std::cout << \"Received payload: \" << payload << std::endl;\n}\n\nvoid run() {\n    // Temporary std::string destroyed at semicolon; coroutine suspended!\n    process_data_async(std::string(\"transient_event_data\"));\n}",
    "solution_desc": "Enforce value semantics for all coroutine parameters or use decay-by-value capture wrappers. For non-copyable types, explicitly move ownership into the coroutine parameter so the coroutine frame manages the complete lifetime across all suspension points.",
    "good_code": "#include <coroutine>\n#include <string>\n#include <iostream>\n\nstruct AsyncTask {\n    struct promise_type {\n        AsyncTask get_return_object() { return {}; }\n        std::suspend_never initial_suspend() { return {}; }\n        std::suspend_always final_suspend() noexcept { return {}; }\n        void return_void() {}\n        void unhandled_exception() {}\n    };\n};\n\n// FIX: Take parameter by value; moved directly into coroutine frame\nAsyncTask process_data_async(std::string payload) {\n    co_await std::suspend_always{};\n    // Safe: 'payload' lives inside the heap coroutine frame\n    std::cout << \"Received payload: \" << payload << std::endl;\n}\n\nvoid run() {\n    process_data_async(std::string(\"safe_event_data\"));\n}",
    "verification": "Compile with `-fsanitize=address -fsanitize=undefined` using Clang 16+ or GCC 13+ and run the test suite; confirm zero heap-use-after-free errors occur during suspended execution.",
    "date": "2026-10-19",
    "id": 1792376811,
    "type": "error"
});