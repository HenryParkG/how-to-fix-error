window.onPostDataLoaded({
    "title": "Fixing C++20 Coroutine Frame Destruction and Dangling Lifetime",
    "slug": "cpp20-coroutine-suspended-frame-destruction",
    "language": "C++20",
    "code": "UseAfterFree",
    "tags": [
        "C++20",
        "Coroutines",
        "MemorySafety",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>In C++20 coroutines, the coroutine frame is allocated on the heap by default and managed via a <code>std::coroutine_handle&lt;Promise&gt;</code>. A critical failure occurs when a coroutine captures parameters by reference or when an external caller invokes <code>handle.destroy()</code> while another execution context is resuming or suspended on an internal awaiter.</p><p>Because coroutine execution suspends control back to the caller while retaining local variables across suspension points, passing temporary objects by reference causes the coroutine's promise and stack frames to bind to expired caller storage. Once resumed, accessing these bound references causes heap-use-after-free or stack-use-after-scope faults under AddressSanitizer.</p>",
    "root_cause": "The coroutine captured an lvalue reference to a temporary variable from caller scope, and the coroutine frame handle was prematurely destroyed while an asynchronous operation held a reference to the promise object.",
    "bad_code": "#include <coroutine>\n#include <iostream>\n#include <string>\n\nstruct Task {\n    struct promise_type {\n        Task get_return_object() { \n            return Task{std::coroutine_handle<promise_type>::from_promise(*this)}; \n        }\n        std::suspend_never initial_suspend() noexcept { return {}; }\n        std::suspend_always final_suspend() noexcept { return {}; }\n        void return_void() {}\n        void unhandled_exception() { std::terminate(); }\n    };\n    std::coroutine_handle<promise_type> handle;\n    ~Task() { if (handle) handle.destroy(); } // Prematurely destroys frame while suspended!\n};\n\nTask async_log(const std::string& msg) { // Captures reference to temporary\n    co_await std::suspend_always{};\n    std::cout << msg << std::endl; // Bug: msg is a dangling reference\n}\n\nvoid run() {\n    async_log(\"Temporary Event\"); // Temporary destroyed at full expression end\n}",
    "solution_desc": "Ensure all coroutine arguments are passed by value unless lifetimes are strictly managed by an outer scope. Pair coroutines with RAII handle wrappers utilizing symmetric transfer or reference-counted handles (`std::shared_ptr` backing state) so destruction only occurs after `final_suspend` has been executed.",
    "good_code": "#include <coroutine>\n#include <iostream>\n#include <string>\n#include <memory>\n\nstruct SafeTask {\n    struct promise_type {\n        SafeTask get_return_object() {\n            return SafeTask{std::coroutine_handle<promise_type>::from_promise(*this)};\n        }\n        std::suspend_always initial_suspend() noexcept { return {}; }\n        std::suspend_always final_suspend() noexcept { return {}; }\n        void return_void() noexcept {}\n        void unhandled_exception() { std::terminate(); }\n    };\n\n    struct Destructor {\n        void operator()(std::coroutine_handle<promise_type> h) const {\n            if (h) h.destroy();\n        }\n    };\n\n    std::shared_ptr<void> frame_owner;\n    std::coroutine_handle<promise_type> handle;\n\n    explicit SafeTask(std::coroutine_handle<promise_type> h)\n        : handle(h), frame_owner(h.address(), [h](void*) { if (h) h.destroy(); }) {}\n};\n\n// Pass by value to guarantee lifetime inside the coroutine frame\nSafeTask async_log(std::string msg) {\n    co_await std::suspend_always{};\n    std::cout << msg << std::endl; // Safe: msg is moved into the coroutine frame\n}",
    "verification": "Compile with `-fsanitize=address,undefined -std=c++20`. Execute test suites under Clang 16+ or GCC 13+ to verify zero heap-use-after-free triggers across suspension boundaries.",
    "date": "2026-09-12",
    "id": 1789216278,
    "type": "error"
});