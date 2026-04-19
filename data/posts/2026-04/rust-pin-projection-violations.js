window.onPostDataLoaded({
    "title": "Resolving Rust Pin Projection Violations in Custom Futures",
    "slug": "rust-pin-projection-violations",
    "language": "Rust",
    "code": "BorrowError",
    "tags": [
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>When implementing manual <code>Future</code> traits in Rust, developers often need to access the inner fields of a pinned struct to call their respective <code>poll</code> methods. Because <code>Pin</code> ensures that data cannot be moved, standard field access (e.g., <code>&mut self.inner</code>) is disallowed because it could potentially allow moving the data out of the pin. This leads to the infamous 'cannot borrow as mutable' or 'pin projection' errors where the compiler cannot guarantee the structural pinning requirements are met.</p>",
    "root_cause": "Attempting to access a mutable reference to a field within a Pinned struct without performing a proper 'projection', which violates Rust's memory safety guarantees regarding non-movable types.",
    "bad_code": "impl Future for MyFuture {\n    type Output = ();\n    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {\n        // Error: cannot borrow field of pinned struct\n        self.inner.poll(cx)\n    }\n}",
    "solution_desc": "Use the 'pin-project' crate to safely project the Pinned state to the struct's fields, or implement manual unsafe projection that maintains the pinning invariants.",
    "good_code": "use pin_project::pin_project;\n\n#[pin_project]\nstruct MyFuture {\n    #[pin]\n    inner: InnerFuture,\n}\n\nimpl Future for MyFuture {\n    type Output = ();\n    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {\n        let this = self.project();\n        this.inner.poll(cx)\n    }\n}",
    "verification": "Run `cargo check`. If the project compiles without 'move' errors and passes the `pin-project` safety checks, the projection is valid.",
    "date": "2026-04-19",
    "id": 1776582459,
    "type": "error"
});