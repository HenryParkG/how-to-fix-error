window.onPostDataLoaded({
    "title": "Fixing Rust Pinning in Custom Futures",
    "slug": "rust-async-pinning-violations",
    "language": "Rust",
    "code": "E0277",
    "tags": [
        "Rust",
        "Backend",
        "Async",
        "Error Fix"
    ],
    "analysis": "<p>When implementing manual <code>Future</code> structures in Rust, developers often encounter errors where a type does not satisfy the <code>Unpin</code> trait. This usually happens when the future contains self-referential data or fields that are not safe to move once they are polled.</p><p>The issue arises because the <code>poll</code> method of the <code>Future</code> trait requires the receiver to be wrapped in a <code>Pin<&mut Self></code>, ensuring the memory address remains stable.</p>",
    "root_cause": "Attempting to access or move fields from a pinned struct without using proper pin-projection, or implementing a future that contains types like 'PhantomPinned'.",
    "bad_code": "struct MyFuture {\n    data: String,\n    // This will cause issues when we try to poll it\n}\n\nimpl Future for MyFuture {\n    type Output = ();\n    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {\n        let this = self.get_mut(); // ERROR: Cannot get &mut if Self is !Unpin\n        Poll::Ready(())\n    }\n}",
    "solution_desc": "Use the 'pin-project-lite' crate to safely project the Pin from the wrapper to the internal fields without requiring manual unsafe blocks or violating memory safety.",
    "good_code": "use pin_project_lite::pin_project;\n\npin_project! {\n    struct MyFuture {\n        #[pin]\n        data: String,\n    }\n}\n\nimpl Future for MyFuture {\n    type Output = ();\n    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {\n        let this = self.project(); // Safely project fields\n        Poll::Ready(())\n    }\n}",
    "verification": "Run 'cargo check'. The compiler should no longer emit E0277 or E0594 errors regarding Pin requirements.",
    "date": "2026-05-19",
    "id": 1779172951,
    "type": "error"
});