window.onPostDataLoaded({
    "title": "C++20 Coroutines: Solving the Dangling Promise Trap",
    "slug": "cpp20-coroutines-dangling-promise-fix",
    "language": "C++",
    "code": "Lifetime Error",
    "tags": [
        "Rust",
        "Backend",
        "C++20",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines introduce a complex relationship between the coroutine frame, the promise object, and the returned handle. A 'Dangling Promise' occurs when a coroutine is suspended, but the object managing the coroutine's lifetime (like a Task or Future wrapper) is destroyed before the coroutine resumes or completes.</p><p>Unlike high-level languages, C++ does not provide automatic garbage collection for coroutine frames. If the caller drops the handle while the coroutine is awaiting an external event, the promise object may be deallocated, leading to Use-After-Free (UAF) when the execution eventually resumes.</p>",
    "root_cause": "The coroutine handle is stored in a temporary object that goes out of scope while the coroutine is suspended at an 'initial_suspend' or 'yield' point, causing the underlying promise to be destroyed.",
    "bad_code": "Task<int> get_data() {\n    auto result = co_await fetch_remote();\n    co_return result;\n}\n\n// Caller usage\nvoid fire_and_forget() {\n    get_data(); // Temporary Task object destroyed immediately!\n}",
    "solution_desc": "Implement a proper RAII wrapper that manages the coroutine_handle. Ensure that the coroutine's 'initial_suspend' returns 'std::suspend_always' and that the lifecycle of the Task object is tied to the completion of the coroutine via a reference-counted handle or by awaiting it properly.",
    "good_code": "template<typename T>\nstruct Task {\n    struct promise_type {\n        Task get_return_object() { return Task{handle_type::from_promise(*this)}; }\n        std::suspend_always initial_suspend() { return {}; }\n        std::suspend_always final_suspend() noexcept { return {}; }\n        // ... handle result ...\n    };\n    using handle_type = std::coroutine_handle<promise_type>;\n    handle_type h_;\n    ~Task() { if(h_) h_.destroy(); }\n};\n\n// Correct usage\nauto my_task = get_data(); \n// Now 'my_task' holds the handle alive.",
    "verification": "Compile with AddressSanitizer (-fsanitize=address). The fix will show 0 memory leaks or UAF errors when the caller scope exits.",
    "date": "2026-02-14",
    "id": 1771031661,
    "type": "error"
});