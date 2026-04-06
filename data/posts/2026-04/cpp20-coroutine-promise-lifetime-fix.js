window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Promise Lifetime Violations",
    "slug": "cpp20-coroutine-promise-lifetime-fix",
    "language": "C++",
    "code": "Lifetime UB",
    "tags": [
        "Rust",
        "Backend",
        "C++",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines are stackless, meaning the coroutine state (including the promise object and local variables) is allocated on the heap. A common violation occurs when a coroutine handle is destroyed while an asynchronous operation is still referencing the promise object. In complex call chains, if a parent coroutine resumes and completes before its child's asynchronous completion handler is invoked, the child's promise type may be deallocated, leading to use-after-free errors. This is particularly prevalent in networking code where callbacks outlive the coroutine scope.</p>",
    "root_cause": "The coroutine frame is destroyed upon the coroutine reaching its final suspension point or via explicit handle destruction, while external asynchronous executors still hold raw pointers to the promise.",
    "bad_code": "task<void> fetch_data(conn& c) {\n  auto result = co_await c.read(); // 'c' might be destroyed if parent finishes\n  process(result);\n}\n// Parent doesn't ensure child completion\nauto t = fetch_data(global_conn);\nt.resume(); ",
    "solution_desc": "Implement a reference-counted mechanism within the promise_type or use a structured concurrency wrapper that ensures the coroutine frame remains alive until all detached asynchronous operations are fully synchronized.",
    "good_code": "struct promise_type {\n  std::atomic<int> ref_count{1};\n  void add_ref() { ref_count.fetch_add(1); }\n  void release() { if(ref_count.fetch_sub(1) == 1) delete this; }\n  // Custom deleter in handle logic\n};",
    "verification": "Compile with ThreadSanitizer and AddressSanitizer (ASan) to detect heap-use-after-free during high-concurrency stress tests.",
    "date": "2026-04-06",
    "id": 1775469648,
    "type": "error"
});