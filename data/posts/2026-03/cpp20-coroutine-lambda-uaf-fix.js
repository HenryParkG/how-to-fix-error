window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Lambda Use-After-Free",
    "slug": "cpp20-coroutine-lambda-uaf-fix",
    "language": "C++20",
    "code": "Use-After-Free",
    "tags": [
        "C++",
        "Coroutines",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines introduce a significant departure from traditional function lifetimes. When a lambda is used to initiate a coroutine, the capture clause often creates a trap for developers. If the lambda captures variables by reference, those references point to the stack frame of the scope where the lambda was invoked. Since coroutines are designed to suspend and resume, the initial scope often exits long before the coroutine completes its execution, leading to invalid memory access when the coroutine resumes.</p>",
    "root_cause": "Captured local variables in a lambda that returns a coroutine type (like std::task) are destroyed when the initial call returns, but the coroutine state (which keeps references to those destroyed variables) survives.",
    "bad_code": "auto get_data_async(int id) {\n    auto lambda = [&id]() -> std::future<int> {\n        co_await some_io();\n        co_return id * 2; // id is a dangling reference here!\n    };\n    return lambda();\n}",
    "solution_desc": "Switch from reference captures ([&]) to value captures ([=]) or explicit moves for any variable that needs to survive across suspension points. For class members, capture the pointer or use 'shared_from_this'.",
    "good_code": "auto get_data_async(int id) {\n    // Capture by value to ensure the data is moved into the coroutine frame\n    auto lambda = [id]() -> std::future<int> {\n        co_await some_io();\n        co_return id * 2; // id is safely copied into the frame\n    };\n    return lambda();\n}",
    "verification": "Compile with AddressSanitizer (ASan) and run the coroutine; ASan will trigger a 'stack-use-after-scope' error on the bad version and pass on the fixed version.",
    "date": "2026-03-11",
    "id": 1773221686,
    "type": "error"
});