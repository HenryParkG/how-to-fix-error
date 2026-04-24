window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Lifetime Use-After-Free",
    "slug": "cpp20-coroutine-suspension-use-after-free",
    "language": "C++",
    "code": "MemorySafety",
    "tags": [
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines introduce a paradigm shift in concurrency, but they lack the borrow-checking safety found in languages like Rust. A common failure occurs when a coroutine is passed arguments by reference. Unlike standard functions where the caller's stack frame remains valid until the function returns, a coroutine suspends and returns execution to the caller. If the caller subsequently destroys the referenced object while the coroutine is still suspended, any future resumption that accesses that reference results in a Use-After-Free (UAF) vulnerability.</p><p>This is particularly dangerous because coroutine frames are typically allocated on the heap (via the promise object), making them outlive the stack context of their initial invocation. Developers often forget that the 'promise' captures the parameters, but if those parameters are references, it only captures the address, not the underlying data's ownership.</p>",
    "root_cause": "Capturing arguments by reference (&) or pointer (*) in a coroutine that suspends (co_await), where the referred object's scope ends before the coroutine resumes.",
    "bad_code": "task<void> process_data(const std::string& input) {\n    co_await some_async_io();\n    std::cout << input << std::endl; // CRASH: input might be destroyed!\n}\n\nvoid caller() {\n    std::string data = \"temp\";\n    process_data(data); // Coroutine starts, suspends, caller continues and data is destroyed\n}",
    "solution_desc": "Ensure all arguments passed to a coroutine are passed by value if the coroutine is intended to outlive the caller's scope. This forces the coroutine frame to store a dedicated copy of the data.",
    "good_code": "task<void> process_data(std::string input) {\n    co_await some_async_io();\n    std::cout << input << std::endl; // SAFE: input is owned by the coroutine frame\n}\n\nvoid caller() {\n    process_data(\"temp\"); // Value is moved/copied into the coroutine state\n}",
    "verification": "Compile with AddressSanitizer (ASAN) and verify that no 'heap-use-after-free' errors are reported during long-running async operations.",
    "date": "2026-04-24",
    "id": 1776995319,
    "type": "error"
});