window.onPostDataLoaded({
    "title": "Fixing Rust Pinning Violations in Async Executors",
    "slug": "rust-async-pinning-violations",
    "language": "Rust",
    "code": "PinViolation",
    "tags": [
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Rust, self-referential structs (common in Futures) cannot be safely moved after they are created because pointers within the struct would point to invalid memory. The <code>Pin<P></code> wrapper guarantees that the data pointed to by <code>P</code> will not move.</p><p>Violations occur in custom executors when a Future is polled, then accidentally moved (e.g., by putting it in a different collection or returning it from a function) before it has completed, breaking the internal references required for async/await to function.</p>",
    "root_cause": "Polling a future that is not 'Unpin' without first pinning it to the heap or stack, and then performing an operation that moves the memory location of that future.",
    "bad_code": "fn run_executor(mut fut: impl Future<Output = ()>) {\n    let mut cx = Context::from_waker(Waker::noop());\n    // WRONG: Polling a future that isn't pinned\n    // fut.poll(&mut cx); // This won't even compile if not Unpin\n    \n    let mut boxed_fut = Box::new(fut);\n    // Even with Box, if we don't use Pin, we can still move it\n    let _ = boxed_fut; \n}",
    "solution_desc": "Use <code>Box::pin</code> to allocate the future on the heap and obtain a <code>Pin<Box<T>></code>, which ensures the future's memory address remains constant even if the pointer itself is moved. For stack pinning, use the <code>pin_utils::pin_mut!</code> macro.",
    "good_code": "use std::pin::Pin;\n\nfn run_executor<F: Future<Output = ()>>(fut: F) {\n    let mut pinned_fut = Box::pin(fut);\n    let waker = waker_setup();\n    let mut cx = Context::from_waker(&waker);\n\n    // Correctly polling a Pinned future\n    match pinned_fut.as_mut().poll(&mut cx) {\n        Poll::Ready(_) => println!(\"Done\"),\n        Poll::Pending => println!(\"Waiting\"),\n    }\n}",
    "verification": "Run the code through 'Miri' with <code>cargo miri run</code> to detect undefined behavior related to pointer invalidation and pinning violations.",
    "date": "2026-02-25",
    "id": 1771994920,
    "type": "error"
});