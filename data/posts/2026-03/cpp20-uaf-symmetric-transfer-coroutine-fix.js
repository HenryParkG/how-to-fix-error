window.onPostDataLoaded({
    "title": "C++20: Fixing UAF in Symmetric Transfer Coroutines",
    "slug": "cpp20-uaf-symmetric-transfer-coroutine-fix",
    "language": "C++20",
    "code": "Use-After-Free",
    "tags": [
        "Rust",
        "Backend",
        "Systems Programming",
        "Error Fix"
    ],
    "analysis": "<p>Symmetric transfer in C++20 coroutines allows a coroutine to suspend and immediately resume another coroutine without incurring the cost of a recursive function call or potentially exhausting the stack. This is achieved by returning a <code>std::coroutine_handle</code> from <code>await_suspend</code>. However, a Use-After-Free (UAF) vulnerability arises when the transferring coroutine's frame is destroyed (e.g., via a unique_ptr or an eager completion mechanism) before the compiler has finished the execution of the suspension logic. If the coroutine object is owned by the handle being transferred or destroyed manually in a separate thread during the transition, the internal machinery attempts to access metadata on a deallocated frame.</p>",
    "root_cause": "The coroutine handle was returned for transfer after the coroutine promise had already initiated destruction of its own frame, causing the resume operation to access a stale pointer.",
    "bad_code": "auto await_suspend(std::coroutine_handle<> h) {\n    auto next = this->next_handle;\n    h.destroy(); // DANGER: Destroying current frame before return\n    return next; // UAF: The 'next' handle is fine, but the current context is gone\n}",
    "solution_desc": "Ensure that the coroutine frame destruction only occurs after control has been fully passed to the next handle. Use 'final_suspend' correctly to manage lifetime, and avoid manual calls to .destroy() within await_suspend when using symmetric transfer. Instead, let the coroutine reach its natural end or use a manager that handles cleanup post-resumption.",
    "good_code": "std::coroutine_handle<> await_suspend(std::coroutine_handle<> h) {\n    // Transfer control without destroying 'h' here.\n    // 'h' will be cleaned up by its own final_suspend logic\n    // or the caller who owns the lifecycle.\n    return this->next_handle;\n}",
    "verification": "Compile with AddressSanitizer (ASan) and run recursive coroutine chains; verify no 'heap-use-after-free' errors are reported during the handle transition.",
    "date": "2026-03-24",
    "id": 1774327708,
    "type": "error"
});