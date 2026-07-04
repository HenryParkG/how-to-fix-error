window.onPostDataLoaded({
    "title": "Fixing Rust Async Task Starvation and Pin Invariants",
    "slug": "debugging-rust-async-starvation-pinning-violations",
    "language": "Rust",
    "code": "Future Poll / Task Starvation",
    "tags": [
        "Rust",
        "Backend",
        "Asynchronous",
        "Error Fix"
    ],
    "analysis": "<p>In custom Rust async executors, task starvation and pinning violations represent two of the most insidious runtime failures. Task starvation occurs when the executor's scheduling queue is dominated by non-yielding futures or when futures block the underlying OS thread, preventing the reactor from polling other tasks. Pinning violations, on the other hand, occur when a developer bypasses the safety guarantees of <code>Pin</code>. Because Rust futures are state machines, moving a future after it has been polled can invalidate internal self-referential pointers, resulting in silent memory corruption or segmentation faults. Correctly managing the polling lifecycle requires strict adherence to both cooperative scheduling guidelines and safe pin-projection mechanisms.</p>",
    "root_cause": "The executor fails to enforce a cooperative scheduling budget, allowing cooperative futures to run indefinitely without yielding. Additionally, the custom executor moves a future in memory after calling 'poll' without wrapping it in a 'Pin' pointer, violating the unpin safety contract.",
    "bad_code": "use std::future::Future;\nuse std::pin::Pin;\nuse std::task::{Context, Poll};\n\nstruct StarvingFuture {\n    work_done: bool,\n}\n\nimpl Future for StarvingFuture {\n    type Output = ();\n\n    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {\n        // BAD: Blocking system call in async poll loop blocks the executor thread\n        std::thread::sleep(std::time::Duration::from_millis(500));\n        \n        if !self.work_done {\n            self.work_done = true;\n            cx.waker().wake_by_ref();\n            Poll::Pending\n        } else {\n            Poll::Ready(())\n        }\n    }\n}\n\n// Buggy executor poll driver\nfn run_executor(mut future: StarvingFuture) {\n    let mut pin_fut = unsafe { Pin::new_unchecked(&mut future) }; // Stack pinning done unsafely\n    // ... executor polls future, then moves it\n    let moved_future = future; // VIOLATION: Future moved after poll!\n}",
    "solution_desc": "To prevent task starvation, we must avoid blocking OS calls within async poll loops and use cooperative yielding. To resolve pinning violations, we utilize the 'tokio::pin!' macro or the 'pin-project-lite' crate to securely lock self-referential structures in memory, making it impossible to move the future after it is polled.",
    "good_code": "use std::future::Future;\nuse std::pin::Pin;\nuse std::task::{Context, Poll};\nuse pin_project_lite::pin_project;\n\npin_project! {\n    struct SafeFuture {\n        work_done: bool,\n    }\n}\n\nimpl Future for SafeFuture {\n    type Output = ();\n\n    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {\n        let this = self.project();\n        \n        if !*this.work_done {\n            *this.work_done = true;\n            // Cooperative yield: notify the waker and yield execution gracefully\n            cx.waker().wake_by_ref();\n            Poll::Pending\n        } else {\n            Poll::Ready(())\n        }\n    }\n}\n\n// Safe usage using stack pinning macro\npub fn run_safe_executor() {\n    let future = SafeFuture { work_done: false };\n    tokio::pin!(future); // Future is now safely pinned to stack and cannot be moved\n    // safe_poll_loop(future);\n}",
    "verification": "Run the program using cargo test and monitor task latencies. Verify memory safety using 'miri' (cargo miri run) to confirm that no invalid pointer access or pin-related memory movements occur under high concurrent loads.",
    "date": "2026-07-04",
    "id": 1783162167,
    "type": "error"
});