window.onPostDataLoaded({
    "title": "Fix C++20 Coroutine Frame Lifespan Corruption",
    "slug": "fix-cpp20-coroutine-frame-lifespan-corruption",
    "language": "C++",
    "code": "UseAfterFree",
    "tags": [
        "C++",
        "Coroutines",
        "Multithreading",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>C++20 coroutines allocate frame memory on the heap (or via HALO optimization) that holds parameter copies, local variables, and execution state. When dispatching coroutines across multithreaded event loops (such as ASIO or libuv), frame destruction occurs prematurely if a coroutine parameter is captured by reference or if the coroutine's lifetime isn't tied to a ref-counted handle or task continuation.</p><p>When worker thread A resumes the coroutine while thread B releases the wrapping handle or the underlying IO operation completes asynchronously after parameter stack memory has been unrolled, the coroutine frame gets destroyed mid-execution, causing dangling pointer access, heap corruption, or non-deterministic segmentation faults.</p>",
    "root_cause": "Capturing stack parameters by reference or passing references to temporary objects into a C++20 coroutine running across worker threads, leading to race conditions between frame deallocation and asynchronous resumption.",
    "bad_code": "// Buggy: Reference parameter 'req' captured in coroutine frame\n// If caller exits before coroutine completes on worker thread, frame holds dangling reference.\ntask<void> handle_request(const Request& req, EventLoop& loop) {\n    co_await loop.schedule();\n    // req is referenced from destroyed caller stack frame!\n    process_data(req.payload); \n}",
    "solution_desc": "Pass parameters by value or wrap shared resources in std::shared_ptr. Manage the lifetime of the coroutine frame using a custom promise_type that holds strong reference counts or uses RAII execution handles (task<T>) to guarantee completion before frame teardown.",
    "good_code": "// Fixed: Pass by value or shared_ptr to ensure frame self-containment\ntask<void> handle_request(Request req, std::shared_ptr<EventLoop> loop) {\n    co_await loop->schedule();\n    // req lives safely within the coroutine frame heap allocation\n    process_data(req.payload);\n}",
    "verification": "Run the application under AddressSanitizer (ASan) and ThreadSanitizer (TSan) using compile flags '-fsanitize=address,thread'. Execute workload under heavy concurrency to confirm zero memory access violations.",
    "date": "2026-08-05",
    "id": 1785894230,
    "type": "error"
});