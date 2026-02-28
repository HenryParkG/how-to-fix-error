window.onPostDataLoaded({
    "title": "Fixing Rust Pinning Violations in Async Structs",
    "slug": "rust-pinning-violations-self-referential-async",
    "language": "Rust",
    "code": "PinViolation",
    "tags": [
        "Rust",
        "Async",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Rust, self-referential structures are problematic because moving the structure in memory invalidates internal pointers. Async futures often generate these structures under the hood. When a Future is polled, it might store a reference to its own data; if that Future is then moved (e.g., pushed into a Vec or sent across a thread), those internal pointers become dangling, causing undefined behavior or compilation errors.</p>",
    "root_cause": "The specific cause is moving a type that implements !Unpin after it has been initialized with self-referential pointers, violating the memory safety guarantees required by the Pin wrapper.",
    "bad_code": "struct MyFuture {\n    data: String,\n    ptr: *const String,\n}\n\nimpl MyFuture {\n    fn init(&mut self) {\n        self.ptr = &self.data; // Self-reference created\n    }\n}\n\n// Moving this struct after init() is a violation",
    "solution_desc": "Use the `Pin` type to guarantee that the data will not move in memory. For custom structs, use the `pin_project` crate to safely handle projection without unsafe boilerplate, ensuring the structure is pinned to the stack or heap (via Box::pin).",
    "good_code": "use std::pin::Pin;\nuse pin_project::pin_project;\n\n#[pin_project]\nstruct MyFuture {\n    data: String,\n    // Internal references are handled via safe pinning\n}\n\nfn execute_pinned(fut: Pin<&mut MyFuture>) {\n    // Implementation ensures 'fut' cannot be moved\n}",
    "verification": "Run the code with 'cargo test' and use 'Miri' (cargo miri test) to detect any stacked borrow violations or undefined behavior during execution.",
    "date": "2026-02-28",
    "id": 1772270291,
    "type": "error"
});