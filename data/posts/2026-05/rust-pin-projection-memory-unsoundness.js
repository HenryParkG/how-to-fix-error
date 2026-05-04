window.onPostDataLoaded({
    "title": "Fixing Rust Pin-Projection Memory Unsoundness",
    "slug": "rust-pin-projection-memory-unsoundness",
    "language": "Rust",
    "code": "UnsoundPin",
    "tags": [
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Self-referential structs in asynchronous Rust are a common source of memory unsoundness if not pinned correctly. When an async block or a Future contains internal pointers to its own fields, moving that struct in memory invalidates those pointers. Rust's <code>Pin</code> wrapper guarantees that the data won't move, but manually projecting that pin to internal fields is inherently unsafe because it can bypass the <code>Unpin</code> auto-trait checks or violate the <code>Drop</code> guarantee.</p>",
    "root_cause": "Manual implementation of pin projection using unsafe 'get_unchecked_mut' without properly handling the Drop requirement or verifying that fields don't move independently.",
    "bad_code": "struct MyFuture {\n    data: String,\n    ptr: *const String,\n}\n\nimpl MyFuture {\n    fn project(self: Pin<&mut Self>) -> &mut String {\n        unsafe { &mut self.get_unchecked_mut().data }\n    }\n}",
    "solution_desc": "Use the 'pin-project' crate to generate safe projection types. This ensures that the Unpin status of the struct correctly tracks the Unpin status of its fields and prevents manual unsafe pointer manipulation.",
    "good_code": "use pin_project::pin_project;\nuse std::pin::Pin;\n\n#[pin_project]\nstruct MyFuture {\n    #[pin]\n    data: String,\n    ptr: *const String,\n}\n\nimpl MyFuture {\n    fn project(self: Pin<&mut Self>) {\n        let this = self.project();\n        let _data_pin: Pin<&mut String> = this.data;\n    }\n}",
    "verification": "Run 'cargo test' and utilize 'miri' (cargo miri test) to detect undefined behavior and pointer invalidation during runtime execution.",
    "date": "2026-05-04",
    "id": 1777892217,
    "type": "error"
});